# QabiFly Buyer-Only Frontend

Updated for buyer-only use.

Changes made:
- Removed `src/app/shopkeeper/*` routes.
- Removed `src/app/delivery/*` routes.
- Register now creates only `BUYER` accounts.
- Login/onboarding redirects only to `/` or `/onboarding`.
- Bottom navigation is buyer-only.
- Profile menu is buyer-only.
- Removed shopkeeper/delivery API helpers from order API.

Run:
```bash
npm install
npm run build
npm run dev
```
