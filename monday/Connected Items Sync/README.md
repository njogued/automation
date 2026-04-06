# Connected Items Sync

A Monday.com integration app that automatically syncs updates across connected items. When a user posts an update on any item, the app propagates it to all items linked via board relation columns — keeping distributed teams and cross-board workflows in sync without manual copy-pasting.

Built with Node.js, Express, the Monday SDK, and deployed via Monday Apps.

---

## What it does

Monday.com supports "connected boards" via board relation columns, but updates posted on one item don't automatically appear on the items it's linked to. This app solves that:

- **Update sync**: When an update is posted on an item, the app finds all connected items (across any board relation columns) and posts a mirrored update on each one. The synced update includes a link back to the original, the author's name and avatar, and a source attribution footer to prevent infinite loops.
- **Bidirectional connection sync**: When a new connection is made between two items, the app ensures the reverse connection is also created on the linked item's board — keeping relationships consistent in both directions.
- **New connection update pull**: When a connection is first established, the app fetches existing updates from the newly connected item and posts them on the original, so no context is lost.
- **Dynamic relation column picker**: The integration recipe exposes a custom dropdown that shows only board-relation columns, making configuration intuitive for end users.

---

## Architecture

```
src/
├── app.js                              # Express server entry point
├── controllers/
│   └── monday-controller.js            # Route handlers; orchestrates service calls
├── middlewares/
│   └── authentication.js               # JWT verification using Monday signing secret
├── routes/
│   ├── index.js
│   └── monday.js                       # All integration endpoints
└── services/
    ├── update-service.js               # Fetches connected items, posts synced updates
    ├── connection-service.js           # Handles bidirectional item connection logic
    ├── newconnectionupdate-service.js  # Pulls updates from newly connected items
    ├── subscription-service.js         # Webhook subscribe/unsubscribe lifecycle
    └── filtercolumns-service.js        # Filters board columns by type for UI options
```

### API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/monday/update` | Sync update to all connected items |
| POST | `/monday/connect` | Create bidirectional item connection |
| POST | `/monday/newconnect` | On new connection, pull and sync existing updates |
| POST | `/monday/connecttrigger/subscribe` | Subscribe to connection-change webhook |
| POST | `/monday/connecttrigger/unsubscribe` | Unsubscribe from connection-change webhook |
| POST | `/monday/getrelationoptions` | Return board-relation columns for recipe dropdown |

---

## Setup

### Prerequisites

- Node.js v16.16+
- A Monday.com developer account with an app created
- The [Monday Apps CLI](https://developer.monday.com/apps/docs/monday-cli) (`mapps`) installed

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env` and fill in your values:

```
PORT=8302
MONDAY_SIGNING_SECRET=your_monday_signing_secret_here
TUNNEL_SUBDOMAIN=your_tunnel_subdomain_here
WEBHOOK_TRIGGER_URL=your_deployed_app_url_here/monday/connectwebhookaction
```

To get your `MONDAY_SIGNING_SECRET`: Monday.com > Developers > your app > Basic Information > Signing Secret.

### Run locally (with tunnel)

```bash
npm run dev
```

This starts the server and opens a Monday tunnel. Paste the tunnel URL as the Base URL of your integration feature in the Monday app editor.

---

## Deployment

Push to Monday Apps hosting:

```bash
mapps code:push
```

Then set environment variables via CLI:

```bash
mapps code:env -m set -k MONDAY_SIGNING_SECRET -v <your_secret> -i <your_app_id>
mapps code:env -m set -k WEBHOOK_TRIGGER_URL -v <your_deployed_url>/monday/connectwebhookaction -i <your_app_id>
```

---

## Key design decisions

**Loop prevention**: Before posting a synced update, the app checks whether the update body was already created by itself (via a `data-app="UpdatesSyncApp"` marker and text patterns). This prevents infinite loops when two connected items both trigger the webhook.

**Seamless auth**: All routes use Monday's short-lived tokens extracted from a signed JWT, so the app never stores or manages API keys on behalf of users.

**Webhook lifecycle**: The custom subscribe/unsubscribe pattern registers a Monday webhook scoped to the specific relation column the user selects in the recipe, rather than listening to all board events.
