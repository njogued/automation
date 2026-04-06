const initMondayClient = require('monday-sdk-js');

async function makeUpdates(token, itemId, updates) {
    // Make the updates to the connected item
    // params: token, itemId, updates
    // returns the updates
    try {
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const query = `mutation ($itemId: ID!, $updates: [UpdateInput!]!) {
            create_update(item_id: $itemId, updates: $updates) {
                id
                body
                created_at
                creator {
                    id
                    name
                    photo_url
                }
            }
        }`;
        const variables = {
            "itemId": String(itemId),
            "updates": updates
        };
        const response = await mondayClient.api(query, { variables });
        const newUpdateId = String(response.data.create_update.id);
        console.log('New update ID:', newUpdateId);
        return newUpdateId;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function getUpdates(token, itemId) {
    // Get the updates from the connected item
    // params: token, itemId
    // returns the updates
    try {
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const query = `query ($itemIds: [ID!]!) {
            items (ids: $itemIds) {
                updates {
                    id
                    body
                    created_at
                    creator {
                        id
                        name
                        photo_url
                    }
                }
            }
        }`;
        const variables = {
            "itemIds": [String(itemId)]
        };
        const response = await mondayClient.api(query, { variables });
        const updates = response?.data?.items?.[0]?.updates ?? [];
        console.log('Updates:', updates);
        return updates;
    } catch (err) {
        console.error(err);
        return [];
    }
}