# Trusted Firebase backend

This is executable backend code, not a client-transaction blueprint. It has not been deployed without a user-owned Firebase project. Live cloud behavior must be verified before use with real customers.

## Setup
1. In a Firebase project enable Google Authentication, Firestore, Storage and Functions billing. Add the hosted domain to Auth authorized domains.
2. From the project root run `node server/scripts/prepare.mjs`, then `npm install --prefix server`.
3. Log in once with the intended Google admin account to create its Auth UID.
4. With trusted Application Default Credentials run `cd server && npm run bootstrap -- PROJECT_ID ADMIN_UID`. Existing data is never overwritten. Initial catalog has zero stock; add stock using adjustment commands so the reason is audited.
5. Build the root frontend into `public` using the supplied build script. Add a config script before app initialization: `window.MADAF_FIREBASE_CONFIG = {apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", appId: "..."}`. These client identifiers are not admin credentials. Never put service-account keys in client code.
6. `firebase deploy --project PROJECT_ID`. Functions region is europe-west1.

For emulators use `firebase emulators:start --project demo-madaf` after dependency installation. Set `emulators:true` in client config. Bootstrap against emulator environment variables FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST. Emulator setup still requires local Firebase CLI, Java and emulator binaries.

## Integrity and boundaries
The callable checks Firebase Auth and resolves role/business membership from server-owned users. All reads precede writes inside one Firestore transaction; a metadata revision document serializes commands. Inventory, order, event records and a permanent idempotency receipt commit together. Client rules deny ALL direct writes. Reads are restricted to an admin, own business/orders, or active catalog. Audit records cannot be edited via client commands.

Each entity is a separate Firestore document. The prototype transaction loads all entities to run the shared domain model, and uses one global metadata lock. This is deliberately suitable only for a low-volume prototype: read cost and contention grow with history. Before production scale, replace it with command-specific reads and per-product/per-order locking while preserving the domain tests. A single very large order can still hit Firestore document limits; UI must keep orders reasonably bounded. Receipts must not be deleted casually because they enforce retry safety.

Notification records form a transactional outbox; there is no WhatsApp provider worker or live sending in this scope. Firebase subscriptions are individually delivered and may briefly show related records from adjacent revisions; commands always revalidate server-side.

Demo mode uses Web Locks for serialized cross-tab commands and localStorage with explicit quota failures. Without Web Locks an explicitly temporary isolated in-memory demo is used; this is not a concurrency-safe persistence polyfill. Demo images are limited to 1 MiB and may exhaust localStorage; cloud mode uses Storage.

Official reference checked: https://firebase.google.com/docs/firestore/manage-data/transactions ; https://firebase.google.com/docs/functions/callable ; https://firebase.google.com/docs/storage/security/rules-conditions

## Tests
`npm test` runs pure projection + two-repository serialization/onboarding checks. With the Firestore emulator running, `npm run test:rules` runs tenant isolation, read filtering, self-promotion and direct-write-denial checks using Rules Unit Testing. The delivery run passed 11 emulator checks (5 commands, 4 Firestore Rules, 2 Storage Rules). Commands used direct handler invocation against emulators because this environment blocks the Functions runtime Unix socket. HTTP callable transport and live OAuth remain unverified; see docs/QA_REPORT.md.
