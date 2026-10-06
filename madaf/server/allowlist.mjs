// Allowlist: the single source of truth for who may use Madaf.
// Stored at private/allowlist as {emails:{"user@gmail.com":"admin"|"customer"}}.
// Firestore Rules deny all client access to private/**, so only the Admin SDK (scripts/allow.mjs, functions) can edit it.
export const ALLOWLIST_PATH='private/allowlist';
export const ROLES=['admin','customer'];
export const normalizeEmail=email=>typeof email==='string'?email.trim().toLowerCase():'';
// Returns the allowed role for a verified email, or null.
export function allowedRole(allowlist,email,emailVerified){
 const key=normalizeEmail(email);
 if(!key||emailVerified!==true)return null;
 const role=allowlist?.emails?.[key];
 return ROLES.includes(role)?role:null;
}
