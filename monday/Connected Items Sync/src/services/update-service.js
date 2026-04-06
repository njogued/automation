const initMondayClient = require('monday-sdk-js');

const getConnectedColumnsAndItems = async (token, boardId, itemId) => {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);
      mondayClient.setApiVersion('2025-01');
  
      // Step 1: Get all connected columns for the board
      const columnsQuery = `query($boardId: ID!) {
        boards(ids: [$boardId]) {
          columns {
            id
            title
            type
          }
        }
      }`;
  
      const columnsResponse = await mondayClient.api(columnsQuery, { variables: { boardId } });
      const connectedColumns = columnsResponse.data.boards[0].columns.filter(
        (column) => column.type === "board_relation"
      );
  
      if (connectedColumns.length === 0) {
        console.log("No connected columns found.");
        return [];
      }
      // Step 2: Fetch the values in connected columns for the specified item
      const columnIds = connectedColumns.map((col) => col.id);

      const connectedItemsQuery = `query($itemId: [ID!], $columnIds: [String!]) {
        items(ids: $itemId) {
          column_values(ids: $columnIds) {
            id
            value
          }
        }
      }`;
  
      const connectedItemsResponse = await mondayClient.api(connectedItemsQuery, {
        variables: { itemId, columnIds },
      });
  
      const columnValues = connectedItemsResponse.data.items[0].column_values;
  
      // Step 3: Extract and return the IDs of connected items
      const connectedItemIds = [];
      columnValues.forEach((column) => {
        if (column.value) {
          const parsedValue = JSON.parse(column.value);
          if (parsedValue.linkedPulseIds) {
            parsedValue.linkedPulseIds.forEach((pulse) => {
              connectedItemIds.push(pulse.linkedPulseId);
            });
          }
        }
      });
      return connectedItemIds;
    } catch (err) {
      console.error("Error:", err);
      return [];
    }
  };

  const updateConnectedItems = async (token, boardId, itemId, originalBody, originalUserId, originalBodyPlain, updateId, originalItemId) => {
    try {
      // to be removed
      if (originalBodyPlain && originalBodyPlain.includes('Created by Updates Sync App') && originalBodyPlain.includes('Original update on') && originalBody.includes('storiedinc.monday.com/users/')) {
        console.log('Update already created by app. Skipping update.');
        return false;
      }

      // check if update was created by the app
      if (originalBody && originalBody.includes('data-app="UpdatesSyncApp"')) {
        console.log('Update already created by the app. Skipping update.');
        return false;
    }
      
      const mondayClient = initMondayClient({ token });
      mondayClient.setApiVersion("2025-01");

      const item_id = String(itemId);
      const userId = String(originalUserId);
      const update_id = String(updateId);
      const board_id = String(boardId);
      const originalItem = String(originalItemId);

      // Get user details
      const userQuery = `query ($userId: ID!) {
        users(ids: [$userId]) {
          id
          name
          photo_small
        }
      }`;

      const boardQuery = `query ($boardId: [ID!]) {
        boards(ids: $boardId) {
          name
        }
      }`;

      const itemQuery = `query ($itemId: [ID!]!) {
        items(ids: $itemId) {
          name
        }
      }`;

      const itemVariables = { "itemId": originalItem };
      const boardVariables = { "boardId": board_id };
      const userVariables = { userId };
      const boardResponse = await mondayClient.api(boardQuery, { variables: boardVariables });
      if (!boardResponse.data.boards || boardResponse.data.boards.length === 0) {
        console.error('Board not found');
        throw new Error('Board not found');
      }
      const userResponse = await mondayClient.api(userQuery, { variables: userVariables });
      if (!userResponse.data.users || userResponse.data.users.length === 0) {
        console.error('User not found');
        throw new Error('User not found');
      }
      const itemResponse = await mondayClient.api(itemQuery, { variables: itemVariables });
      if (!itemResponse.data.items || itemResponse.data.items.length === 0) {
        console.error('Item not found');
        throw new Error('Item not found');
      }
      const itemName = itemResponse.data.items[0].name;
      const username = userResponse.data.users[0].name;
      const boardName = boardResponse.data.boards[0].name;
      const userAvatar = userResponse.data.users[0].photo_small;
      const updateLink = `https://storiedinc.monday.com/boards/${board_id}/pulses/${itemId}/posts/${update_id}`;
      const itemLink = `https://storiedinc.monday.com/boards/${board_id}/pulses/${itemId}`;
      const boardLink = `https://storiedinc.monday.com/boards/${board_id}`;
      // const body = `This update was created by ${username}.\n\n${originalBody}`
      const body = `<p><img src="${userAvatar}" style="border-radius: 50%; width: 40px; height: 40px !important;">&nbsp;&nbsp;<a href="https://storiedinc.monday.com/users/${userId}" target="_blank" rel="noopener noreferrer">${username}</a></p><p style="background-color: #efefef !important;"><a href="${updateLink}" target="_blank" rel="noopener noreferrer">Original update</a> on item: <a href="${itemLink}" target="_blank" rel="noopener noreferrer">${itemName}</a> on board: <a href="${boardLink}" target="_blank" rel="noopener noreferrer">${boardName}</a></p><hr><p>${originalBody}</p><hr><p><em>Created by <strong>Updates Sync App</strong></em></p>`;
  
      // Corrected mutation query
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
      console.error('Error updating connected items:', err);
      throw err;
    }
  };

module.exports = {
  getConnectedColumnsAndItems,
  updateConnectedItems,
  // getStoredUpdates,
  // setStoredUpdates,
};

// const getStoredUpdates = async (token, updateId) => {
//   try {
//     const mondayClient = initMondayClient();
//     mondayClient.setToken(token);
//     mondayClient.setApiVersion('2025-01');
//     allUpdates = [];
//     const key = 'allUpdates';
//     allUpdatesResponse = await mondayClient.storage.getItem(key);
//     allUpdatesValue = allUpdatesResponse.data.value || [];
//     if (allUpdates && allUpdates.includes(updateId)) {
//       console.log('Update created by app. Skipping update.');
//       return allUpdatesValue;
//     } else if (allUpdatesValues && !allUpdatesValues.includes(updateId)) {
//       return allUpdatesValues;
//     }
//   } catch (err) {
//     console.error('Error getting stored updates:', err);
//   }
// };

// const setStoredUpdates = async (token, updateId) => {
//   try {
//     // get stored updates
//     let allUpdates = [];
//     const key = 'allUpdates';
//     const storedUpdates = getStoredUpdates(token, updateId);
//     if (storedUpdates && storedUpdates.includes(updateId)) {
//       console.log('Update created by app. Skipping update.');
//       return False;
//     } else if (storedUpdates && !storedUpdates.includes(updateId)) {
//       // set stored updates
//       const mondayClient = initMondayClient();
//       mondayClient.setToken(token);
//       mondayClient.setApiVersion('2025-01');
//       allUpdates.push(storedUpdates);
//       allUpdates.push(updateId);
//       allUpdatesResponse = await mondayClient.storage.setItem(key, allUpdates);
//       return allUpdatesResponse;
//     }
//   } catch (err) {
//     console.error('Error setting stored updates:', err);
//   }
// };