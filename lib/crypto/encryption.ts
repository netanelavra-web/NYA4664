/**
 * End-to-End Encryption (E2EE) Module
 *
 * This module implements hybrid encryption:
 * 1. Each message is encrypted with a unique AES-GCM-256 symmetric key
 * 2. The symmetric key is wrapped (encrypted) using RSA-OAEP with each recipient's public key
 * 3. Only recipients with the corresponding private key can decrypt the message
 */

// ============================================================================
// KEY GENERATION
// ============================================================================

/**
 * Generate RSA key pair for a user
 */
export async function generateUserKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
  };
}

/**
 * Generate AES-GCM symmetric key for message encryption
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// MESSAGE ENCRYPTION
// ============================================================================

export interface EncryptedData {
  ciphertext: string; // Base64
  iv: string; // Base64 initialization vector
  encryptedKeyFor: Record<string, string>; // { userId: encryptedKey }
}

/**
 * Encrypt message content for multiple recipients
 */
export async function encryptMessage(
  content: string,
  recipientPublicKeys: Record<string, string> // { userId: publicKeyBase64 }
): Promise<EncryptedData> {
  // Generate a random symmetric key for this message
  const symmetricKey = await generateSymmetricKey();

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the content with AES-GCM
  const encoder = new TextEncoder();
  const contentBuffer = encoder.encode(content);

  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    symmetricKey,
    contentBuffer
  );

  // Export the symmetric key
  const symmetricKeyBuffer = await window.crypto.subtle.exportKey('raw', symmetricKey);

  // Wrap the symmetric key for each recipient
  const encryptedKeyFor: Record<string, string> = {};

  for (const [userId, publicKeyBase64] of Object.entries(recipientPublicKeys)) {
    // Import recipient's public key
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );

    // Encrypt the symmetric key with recipient's public key
    const wrappedKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      symmetricKeyBuffer
    );

    encryptedKeyFor[userId] = arrayBufferToBase64(wrappedKey);
  }

  return {
    ciphertext: arrayBufferToBase64(encryptedContent),
    iv: arrayBufferToBase64(iv),
    encryptedKeyFor,
  };
}

// ============================================================================
// MESSAGE DECRYPTION
// ============================================================================

/**
 * Decrypt message content using user's private key
 */
export async function decryptMessage(
  encryptedData: EncryptedData,
  userId: string,
  privateKeyBase64: string
): Promise<string> {
  // Get the wrapped key for this user
  const wrappedKeyBase64 = encryptedData.encryptedKeyFor[userId];
  if (!wrappedKeyBase64) {
    throw new Error('No encrypted key found for this user');
  }

  // Import user's private key
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );

  // Unwrap (decrypt) the symmetric key
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyBase64);
  const symmetricKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    wrappedKeyBuffer
  );

  // Import the symmetric key
  const symmetricKey = await window.crypto.subtle.importKey(
    'raw',
    symmetricKeyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['decrypt']
  );

  // Decrypt the content
  const ciphertextBuffer = base64ToArrayBuffer(encryptedData.ciphertext);
  const ivBuffer = base64ToArrayBuffer(encryptedData.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    symmetricKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// ============================================================================
// PRIVATE KEY ENCRYPTION (with user password)
// ============================================================================

/**
 * Derive encryption key from user password
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES key using PBKDF2
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt user's private key with their password
 */
export async function encryptPrivateKey(
  privateKeyBase64: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const derivedKey = await deriveKeyFromPassword(password, salt);

  const encoder = new TextEncoder();
  const privateKeyBuffer = encoder.encode(privateKeyBase64);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    privateKeyBuffer
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt user's private key with their password
 */
export async function decryptPrivateKey(
  encryptedData: { encrypted: string; salt: string; iv: string },
  password: string
): Promise<string> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const encrypted = base64ToArrayBuffer(encryptedData.encrypted);

  const derivedKey = await deriveKeyFromPassword(password, salt);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================================
// FILE ENCRYPTION (for media)
// ============================================================================

/**
 * Encrypt file for upload
 */
export async function encryptFile(
  file: File,
  recipientPublicKeys: Record<string, string>
): Promise<{
  encryptedFile: Blob;
  metadata: EncryptedData;
}> {
  // Generate symmetric key
  const symmetricKey = await generateSymmetricKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Read file
  const fileBuffer = await file.arrayBuffer();

  // Encrypt file
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    symmetricKey,
    fileBuffer
  );

  // Export symmetric key
  const symmetricKeyBuffer = await window.crypto.subtle.exportKey('raw', symmetricKey);

  // Wrap key for recipients
  const encryptedKeyFor: Record<string, string> = {};
  for (const [userId, publicKeyBase64] of Object.entries(recipientPublicKeys)) {
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );

    const wrappedKey = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      symmetricKeyBuffer
    );

    encryptedKeyFor[userId] = arrayBufferToBase64(wrappedKey);
  }

  return {
    encryptedFile: new Blob([encryptedBuffer]),
    metadata: {
      ciphertext: '', // Not used for files
      iv: arrayBufferToBase64(iv),
      encryptedKeyFor,
    },
  };
}

/**
 * Decrypt file after download
 */
export async function decryptFile(
  encryptedBlob: Blob,
  metadata: EncryptedData,
  userId: string,
  privateKeyBase64: string
): Promise<Blob> {
  // Get wrapped key
  const wrappedKeyBase64 = metadata.encryptedKeyFor[userId];
  if (!wrappedKeyBase64) {
    throw new Error('No encrypted key found for this user');
  }

  // Import private key
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );

  // Unwrap symmetric key
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyBase64);
  const symmetricKeyBuffer = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    wrappedKeyBuffer
  );

  // Import symmetric key
  const symmetricKey = await window.crypto.subtle.importKey(
    'raw',
    symmetricKeyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  // Decrypt file
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  const ivBuffer = base64ToArrayBuffer(metadata.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    symmetricKey,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer]);
}
