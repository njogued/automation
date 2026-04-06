const updateService = require('../services/update-service');
const connectionService = require('../services/connection-service');
const newConnectionUpdateService = require('../services/newconnectionupdate-service');
const subscriptionService = require('../services/subscription-service');
const filterColsService = require('../services/filtercolumns-service');
const getPostService = require('../services/getpost-service');
const { Storage } = require('@mondaycom/apps-sdk');
const { get } = require('http');
const fs = require('fs').promises;


async function updateConnectedItems(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    const { boardId, itemId, body, userId, updateId, textBody } = inputFields;
    // console.log(`Board ID: ${boardId}, Item ID: ${itemId}, Body: ${body}, User ID: ${userId}, Update ID: ${updateId}, textBody: ${textBody}.`);

    // Get all connected items
    const connectedItemIds = await updateService.getConnectedColumnsAndItems(shortLivedToken, boardId, itemId);
    if (connectedItemIds.length === 0) {
      console.log("No connected items found or errored in execution.");
      return res.status(200).send({ message: "No connected items found or errors in execution." });
    }
    console.log(`Connected Items: ${JSON.stringify(connectedItemIds)}.`);

    // Update each connected item with the provided value
    for (const connectedItemId of connectedItemIds) {
      const updateResult = await updateService.updateConnectedItems(shortLivedToken, boardId, connectedItemId, body, userId, textBody, updateId, itemId);
      
      if (!updateResult) {
        console.log(`Skipping update for item ${connectedItemId} and stopping process.`);
        return res.status(200).send({ message: "Update already exists, stopping execution." });
      }
      const newUpdateId = String(updateResult.data.create_update.id);
    }
    return res.status(200).send({
      message: "Connected items updated successfully.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: err });
  }
}

async function connectItems(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId } = inputFields;
        
    // Ensure the column is connected to a board
    // Get all connected board, and connect with correct column on that board
    const connectedItemIds = await connectionService.makeConnection(shortLivedToken, String(itemId), String(columnId), String(boardId));
    if (!connectedItemIds) {
      return res.status(500).send({ message: "Errors in execution." });
    }
    if (connectedItemIds && connectedItemIds.length === 0) {
      console.log("No connected items found.");
      return res.status(200).send({ message: "No connected items found for the specified item." });
    }
    console.log(`Connected Items: ${JSON.stringify(connectedItemIds)}.`);
    return res.status(200).send({ message: "Items connected successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function newConnectItems(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    const { boardId, itemId } = inputFields;
    await sleep(5000);
    const connectedSuccess = await newConnectionUpdateService.connectedItemsUpdater(shortLivedToken, itemId);
    return res.status(200).send({ message: "Connection service execution successful." });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Connection service execution unsuccessful" });
  }
}

async function updateColumn(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId } = inputFields;
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

async function customSubscribe(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  const headers = req.headers;
  const webhookTriggerUrl = process.env.WEBHOOK_TRIGGER_URL;
  try {
    const webhookId = await subscriptionService.subscribeWebhook(shortLivedToken, payload, headers, webhookTriggerUrl);
    return res.status(200).send({ "webhookId": webhookId });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
};

async function connectWebhookAction(req, res) {
  try {
    const { challenge } = req.body;
    if (challenge) return res.send({ challenge });
    const { shortLivedToken } = req.session;
    const { pulseId, pulseName, boardId } = req.body;
    const updateResult = await updateService.updateConnectedItems(shortLivedToken, boardId, connectedItemId, body, userId, textBody, updateId, itemId);
    return res.status(200).send();
  } catch (err) {
    console.log(err);
    return res.status(400).send();
  }
};

async function customUnsubscribe(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  const headers = req.headers;
  try {
    console.log(payload);
    console.log(headers);
    await subscriptionService.unsubscribeWebhook(shortLivedToken, payload);
    return res.status(200).send({ message: "Webhook removed successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

async function updateConnectedColumn(req, res) {
  // const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    console.log(`Payload: ${JSON.stringify(payload)}`);
    // const itemId = payload["itemId"];
    // console.log(`Board ID: ${boardId}, Item ID: ${itemId}, Body: ${body}, User ID: ${userId}, Update ID: ${updateId}, textBody: ${textBody}.`);
    return res.status(200).send({ message: "Connected columns webhook set up." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

async function getRelationOptions(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    console.log(`Payload: ${JSON.stringify(payload)}`);
    // Payload: {"boardId":6038686507,"recipeId":30429328,"integrationId":396573066,"automationId":396573066,"pageRequestData":{},"dependencyData":{"boardId":6038686507}}
    const boardId = payload?.boardId ?? payload?.dependencyData?.boardId ?? null;
    if (!boardId) {
      return res.status(400).send({ message: "Board ID not found in payload." });
    }
    const relationOptions = await filterColsService.getColumnsOnType(shortLivedToken, boardId, "board_relation");
    // console.log(`Relation Options: ${JSON.stringify(relationOptions)}`);
    if (relationOptions.length === 0) {
      return res.status(200).send([{ title: "No connected boards found", value: "0" }]);
    }
    return res.status(200).send(relationOptions);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

async function subItemUpdateSubscribe(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  const headers = req.headers;
  try {
    const webhookId = await subscriptionService.subscribeWebhook(payload, headers);
    console.log(payload)
    return res.status(200).send({ "webhoodId": webhookId });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

async function subItemUpdateUnsubscribe(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  const headers = req.headers;
  try {
    await subscriptionService.unsubscribeWebhook(payload, headers);
    return res.status(200).send({ message: "Webhook removed successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Internal server error" });
  }
}

module.exports = {
  updateConnectedItems,
  connectItems,
  newConnectItems,
  updateColumn,
  customSubscribe,
  customUnsubscribe,
  getRelationOptions,
  subItemUpdateSubscribe,
  subItemUpdateUnsubscribe,
  updateConnectedColumn,
  connectWebhookAction,
};


// const key = 'allUpdates';
// // const serviceGetItems = await updateService.getStoredUpdates(shortLivedToken, updateId);
// // console.log(`serviceGetItems: ${serviceGetItems}`);
// // console.log(`********************************`);
// const storage = new Storage(shortLivedToken);
// const storedUpdatesResponse = await storage.get(key);
// const allUpdatesValue = storedUpdatesResponse.value || [];
// let allUpdates = [];
// if (allUpdatesValue === null || typeof allUpdatesValue === 'string') {
//   console.log('All updates is null or a string. Initializing as an empty array.');
//   allUpdates.push(allUpdatesValue);
// } else {
//   allUpdates = allUpdatesValue;
// }
// // storage structure
// // { allUpdates: success: true, value: [ 'updateId1', 'updateId2', ... ] }
// if (allUpdates.includes(String(updateId))) {
//   console.log('Update created by app. Skipping update.');
//   return res.status(200).send({message: "Skipping update."});
// }