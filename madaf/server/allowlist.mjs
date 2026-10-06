// Admin allowlist: listed Google accounts get full access (admin + their own customer side).
// Any other signed-in account is a customer only. Stored at private/allowlist as {emails:{"x@gmail.com":"admin"}}.
// Firestore Rules deny all client access to private/**, so only the Admin SDK (scripts/allow.mjs, functions) can edit it.
export const ALLOWLIST_PATH='private/allowlist';
export const normalizeEmail=email=>typeof email==='string'?email.trim().toLowerCase():'';
// True only for a verified email listed as admin.
export function isListedAdmin(allowlist,email,emailVerified){
 const key=normalizeEmail(email);
 return Boolean(key&&emailVerified===true&&allowlist?.emails?.[key]==='admin');
}
// The role the server grants: admin when listed, otherwise customer.
export const grantedRole=(allowlist,email,emailVerified)=>isListedAdmin(allowlist,email,emailVerified)?'admin':'customer';
