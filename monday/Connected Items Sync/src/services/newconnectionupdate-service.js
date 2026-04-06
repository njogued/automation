const initMondayClient = require('monday-sdk-js');

const findConnectedItems = async (token, itemId) => {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);
      mondayClient.setApiVersion('2025-01');

      // Step 1: Get all connected columns for the board
      const columnsQuery = `query ($itemId: ID!) {
        items (ids:[ $itemId ]) {
          column_values {
            ... on BoardRelationValue {
              linked_item_ids
            }
          }
        }
      }`;

      const columnsResponse = await mondayClient.api(columnsQuery, { variables: { itemId } });
      const columnVals = columnsResponse.data.items[0].column_values;
      const connectedItems = columnVals
        .filter(cv => Array.isArray(cv.linked_item_ids) && cv.linked_item_ids.length > 0)
        .map(cv => cv.linked_item_ids)
        .flat();
      return connectedItems;
    } catch (err) {
      console.error(err);
      return null;
    }
  };


const findConnectedItemUpdates = async (token, itemId) => {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);
      mondayClient.setApiVersion('2025-01');

      // Step 1: Get all updates from connected items
      const updatesQuery = `query ($itemId: ID!) {
        items (ids:[ $itemId ]) {
          id
          name
          board {
            id
            name
          }
          updates {
            id
            body
            created_at
            creator {
              id
              name
            }
          }
        }
      }`;

      const updatesResponse = await mondayClient.api(updatesQuery, { variables: { itemId } });
      const itemsUpdates = updatesResponse?.data?.items || [];

      if (itemsUpdates.length === 0) {
        console.log("No items found!");
        throw new Error("No items found for the provided ID!");
      } else {
        const item = itemsUpdates[0];
        const boardId = item.board?.id;
        const boardName = item.board?.name;
        const itemId = item.id;
        const itemName = item.name;
        const updatesArray = item.updates.map(update => {
          return {
            boardId,
            boardName,
            itemId,
            itemName,
            updateId: update.id,
            body: update.body,
            creatorId: update.creator?.id,
            creatorName: update.creator?.name
          };
        });
        return updatesArray;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
}

const makeUpdateOnItem = async (token, originalItemId, updatesDict) => {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);
      mondayClient.setApiVersion('2025-01');

      const userId = updatesDict.creatorId;
      // Get user details
      const userQuery = `query ($userId: ID!) {
        users(ids: [$userId]) {
          id
          name
          photo_small
        }
      }`;

      const userVariables = { userId };
      const userResponse = await mondayClient.api(userQuery, { variables: userVariables });
      if (!userResponse.data.users || userResponse.data.users.length === 0) {
        console.error('User not found');
        throw new Error('User not found');
      }

      const item_id = String(originalItemId);
      const originalBody = updatesDict.body;
      const itemName = updatesDict.itemName;
      // Need to fix why item Id is undefined
      const itemId = updatesDict.itemId;
      const username = updatesDict.creatorName;
      const boardName = updatesDict.boardName;
      const board_id = updatesDict.boardId;
      // Need to fix why updateId is undefined
      const update_id = updatesDict.updateId;
      const userAvatar = userResponse.data.users[0].photo_small;
      const updateLink = `https://storiedinc.monday.com/boards/${board_id}/pulses/${itemId}/posts/${update_id}`;
      const itemLink = `https://storiedinc.monday.com/boards/${board_id}/pulses/${itemId}`;
      const boardLink = `https://storiedinc.monday.com/boards/${board_id}`;
      
      // const body = `This update was created by ${username}.\n\n${originalBody}`
      const body = `<p><img src="${userAvatar}" style="border-radius: 50%; width: 40px; height: 40px !important;">&nbsp;&nbsp;<a href="https://storiedinc.monday.com/users/${userId}" target="_blank" rel="noopener noreferrer">${username}</a></p><p style="background-color: #efefef !important;"><a href="${updateLink}" target="_blank" rel="noopener noreferrer">Original update</a> on item: <a href="${itemLink}" target="_blank" rel="noopener noreferrer">${itemName}</a> on board: <a href="${boardLink}" target="_blank" rel="noopener noreferrer">${boardName}</a></p><hr><p>${originalBody}</p><hr><p><em>Created by <strong>Updates Sync App</strong></em></p>`;

      const query = `mutation ($item_id: ID!, $body: String!) {
        create_update(item_id: $item_id, body: $body) {
          id
        }
      }`;
  
      // Corrected variable names
      const variables = { item_id, body };
  
      // Execute the query
      const response = await mondayClient.api(query, { variables });
      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

const connectedItemsUpdater = async (token, itemId) => {
    try {
      // 1) Find all connected item IDs for the given item
      const connectedItems = await findConnectedItems(token, itemId);
      if (!connectedItems || connectedItems.length === 0) {
        console.log("No connected items found.");
        return false;
      }

      // 2) Loop over each connected item
      for (const connectedItemId of connectedItems) {
        const updatesArray = await findConnectedItemUpdates(token, connectedItemId);
        if (!updatesArray || updatesArray.length === 0) {
          console.log(`No updates found for connected item ${connectedItemId}`);
          continue;
        }
        // 3) For each update, call makeUpdateOnItem (on the original item).
        for (const updateInfo of updatesArray) {
          await makeUpdateOnItem(token, itemId, updateInfo);
        }
      }
      return true;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  module.exports = {
    connectedItemsUpdater,
  };
