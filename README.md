# CartShare

CartShare is a responsive shared-shopping frontend for roommates, student groups, and teams. It helps a group keep a single shopping list, track item contributors, and print a receipt.

## Features
- Create rooms with a unique six-character code and join rooms by code.
- Add items with a price and quantity; remove items or clear the cart.
- Room overview with item count, estimated total, and participant count.
- Activity feed for room actions.
- Local browser persistence with `localStorage`.
- Storage-event updates across tabs/windows using the same browser storage.
- Responsive layout for mobile, tablet, and desktop.
- Print-friendly receipt via the browser print dialog.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser, or use VS Code Live Server.
3. Create a room and add a few items to test the cart.
4. To test storage syncing, open the same site origin in another tab. Browser storage events do not synchronize across separate devices or unrelated origins.

## Folder structure
```text
cartshare_project/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   └── app.js
└── assets/
```

## Important scope note
This version is a frontend prototype. `localStorage` is browser-specific, so a room code is only discoverable in the same browser profile/storage. Cross-device real-time collaboration requires a shared backend/database and authentication, which are not part of this frontend-only build.

## Deploy
You can deploy this static folder to GitHub Pages, Netlify, or Vercel. For the room experience to work across browser sessions, use a shared backend such as Supabase/Firebase or a custom API before presenting it as cross-device collaboration.
