const initMondayClient = require('monday-sdk-js');
const { Storage } = require('@mondaycom/apps-sdk');

async function subscribeWebhook(token, payload, headers, webhookTriggerUrl) {
    try {
        const mondayClient = initMondayClient();
        const storage = new Storage(token);
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const webhookUrl = payload["webhookUrl"]
        const subscriptionId = payload["subscriptionId"]
        const connectCol = payload["inboundFieldValues"]["customRelationColumn"]["value"]
        const connectBoard = payload["inboundFieldValues"]["boardId"]
        const recipeId = payload["recipeId"]
        const integrationId = payload["integrationId"]
        const data2save = {
            "webhookUrl": webhookUrl,
            "webhookTriggerUrl": webhookTriggerUrl,
            "subscriptionId": subscriptionId,
            "connectCol": connectCol,
            "connectBoard": connectBoard,
            "recipeId": recipeId,
            "integrationId": integrationId
        };

        const query = `mutation ($boardId: ID!, $url: String!, $config: JSON!) {
            create_webhook(
                board_id: $boardId,
                url: $url,
                event: change_specific_column_value,
                config: $config
            ) {
                id
                board_id
            }
        }`;

        const variables = {
            "boardId": connectBoard,
            "url": webhookTriggerUrl,
            "config": JSON.stringify({"columnId": connectCol})
        };

        const response = await mondayClient.api(query, { variables });
        console.log(response);
        const webhookId = response.data.create_webhook.id;
        try {
            const { version, success, error } = await storage.set(webhookId, data2save);
            console.log(`Webhook data stored successfully: ${version}, ${success}, ${error}`);
        } catch (storageErr) {
            console.error('Failed to store webhook data:', storageErr);
        }
        console.log('Webhook stored successfully.');
        return webhookId;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function unsubscribeWebhook(token, payload) {
    try {
        const webhookId = payload.webhookId;
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
    
        // Step 1: Remove webhook from monday.com
        const mutation = `mutation ($id: ID!) {
            delete_webhook (id: $id) {
                id
            }
        }`;
        const response = await mondayClient.api(mutation, { variables: { id: webhookId } });
        console.log(`Deleted webhook from monday.com:`, response);
        // Remove webhook data from storage
        const storage = new Storage(token);
        const delResponse = await storage.deleteItem(webhookId);
        console.log(delResponse);
        return;
    } catch (err) {
        console.error(`Error unsubscribing webhook ${webhookId}:`, err);
        throw err;
        // return res.status(500).send({ message: "Error removing webhook" });
    }
}

module.exports = {
    subscribeWebhook,
    unsubscribeWebhook,
};