# Security Specification & Test Payloads

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId`.
2. **Subcollection Ownership Invariant**: Documents in `/users/{userId}/saves/{saveId}` and `/users/{userId}/pastLives/{recordId}` can only be accessed or modified if `request.auth.uid == userId` and the document's `userId` field equals `request.auth.uid`.
3. **Immutability Invariant**: `userId`, `id`, and creation timestamps cannot be altered on update.
4. **Boundary Limits**: String fields must not exceed specified size limits (names <= 100, characterData <= 200000 bytes) to prevent resource exhaustion / Denial-of-Wallet attacks.

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read User**: Unauthenticated request attempting `get /users/victim123`.
2. **Cross-User Read User**: User A (`attacker_uid`) attempting `get /users/victim_uid`.
3. **Spoofed User Creation**: User A trying to `set /users/victim_uid` with `{ id: 'victim_uid', email: 'victim@test.com' }`.
4. **Ghost Field Injection**: User A updating `/users/attacker_uid` with unauthorized field `{ role: 'admin' }`.
5. **Cross-User Save Read**: User A trying to read `/users/victim_uid/saves/current`.
6. **Cross-User Save Write**: User A trying to write `/users/victim_uid/saves/current` with attacker data.
7. **Identity Mismatch Save Write**: User A writing to `/users/attacker_uid/saves/save1` with `{ userId: 'victim_uid' }`.
8. **Denial-of-Wallet Payload**: Writing `characterData` string greater than 200,000 characters.
9. **Past Lives Tampering**: User A attempting to delete or overwrite past lives of `victim_uid`.
10. **Path Variable Injection**: Attempting access with non-alphanumeric ID `/users/attacker_uid/saves/../../malicious`.
11. **Client-Forced List Query**: Attempting collectionGroup query across all users' saves without filtering by `userId`.
12. **Immutable Field Mutation**: User attempting to update `userId` or `createdAt` on an existing save document.
