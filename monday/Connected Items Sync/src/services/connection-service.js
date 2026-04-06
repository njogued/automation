const initMondayClient = require('monday-sdk-js');

const getConnectedItems = async (token, itemId, columnId) => {
    // Get the connected item id from the connected column (if it exists)
    // params: token, itemId, columnId
    // returns the connected item id
    try {
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const query = `query ($itemIds: [ID!]) {
            items (ids: $itemIds) {
                column_values {
                    ... on BoardRelationValue {
                        id
                        linked_item_ids
                    }
                }
            }
        }`
        const variables = {
            "itemIds": [String(itemId)]
        }
        const response = await mondayClient.api(query, { variables });
        const columnValues = response?.data?.items?.[0]?.column_values ?? [];
        let connectedItemIds = [];
        if (!columnValues || columnValues.length === 0) {
            return [];
        }

        for (const column of columnValues) {
            if (column.id === columnId) {
                if (column.linked_item_ids && column.linked_item_ids.length > 0) {
                    connectedItemIds = column.linked_item_ids;
                    break;
                }
            }
        }
        console.log('Connected item IDs:', connectedItemIds);
        return connectedItemIds;
    }
    catch (err) {
        console.error(err);
        return [];
    }
}

const getConnectBoardColumn = async (token, boardId, itemId, oldItemId) => {
    // Get the connected column and boardId from the connected board
    // params: token, columnId, boardId
    // returns the connected board id
    try {
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const query = `query ($itemIds: [ID!]!) {
            items (ids: $itemIds) {
                board {
                    id
                }
                column_values {
                    ... on BoardRelationValue {
                        id
                        linked_item_ids
                        column{
                            settings_str
                        }
                    }
                }
            }
        }`
        const variables = {
            "itemIds": [String(itemId)]
        }
        const response = await mondayClient.api(query, { variables });
        
        // Ensure response data exists and is valid
        if (!response.data || !response.data.items || !response.data.items.length) {
            throw new Error('Failed to get a response');
        }

        const columnValues = response.data.items[0].column_values;
        const newBoardId = response.data.items[0]?.board?.id;
        if (!newBoardId) {
            throw new Error('No board ID found in response');
        }
        let connectionExists = false;
        let newColumnId = null;
        for (const col of columnValues) {
            if (!col.id || !col.linked_item_ids || !col.column || !col.column.settings_str) {
                continue;
            }
            const settings = JSON.parse(col.column.settings_str || '{}');
            const boardIds = Array.isArray(settings.boardIds) ? settings.boardIds : [];
            if (boardIds.includes(Number(boardId))) {
                newColumnId = col.id;
                if (col.linked_item_ids.includes(oldItemId)) {
                    connectionExists = true;
                    console.log('Connected board and column, connection exists:', newBoardId, newColumnId, connectionExists);
                    return { newBoardId, newColumnId, connectionExists };
                } else {
                    break;
                }
            }
        }
        console.log('Connected board and column, connection exists:', newBoardId, newColumnId, connectionExists);
        return { newBoardId, newColumnId, connectionExists };
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}

const connectItems = async (token, connectedBoardAndCol, itemId, connectedItemId) => {
    // Connect the two items if not already connected
    // params: token, connectedBoardAndCol, itemId, boardId
    // returns the connected item id
    try {
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const newColumnId = connectedBoardAndCol.newColumnId;
        const newBoardId = connectedBoardAndCol.newBoardId;
        const query = `mutation ($item_id: ID!, $board_id: ID!, $column_values: JSON!) {
            change_multiple_column_values(item_id: $item_id, board_id: $board_id, column_values: $column_values) {
                id
            }
        }`
        const variables = {
            item_id: connectedItemId,
            board_id: newBoardId,
            column_values: JSON.stringify({
                [newColumnId]: {"item_ids": [String(itemId)]},
            }),
        };
        const response = await mondayClient.api(query, { variables });
        const responseId = response?.data?.change_multiple_column_values?.id;
        if (!responseId) {
            throw new Error('No response ID found');
        }
        return responseId;
    }
    catch (err) {
        console.error(err);
        return null
    }
}

const makeConnection = async (token, itemId, columnId, boardId) => {
    // steps to accomplish in this
    // Get the connected item id from the connected column (if it exists)
    // params: token, itemId, columnId
    // Get the connected column and boardId from the connected board
    // Connect the two items if not already connected **

    try {
        const connectedItems = await getConnectedItems(token, itemId, columnId);
        if (connectedItems.length === 0) {
            return [];
        } 
        for (const connectedItem of connectedItems) {
            const connectedBoardAndCol = await getConnectBoardColumn(token, boardId, connectedItem, itemId);
        
            if (connectedBoardAndCol.connectionExists) {
                console.log('Connection already exists for item:', connectedItem);
                if (connectedBoardAndCol.length == 1) {
                    break;
                }
                continue;
            }
            try {
                const connectedItemResult = await connectItems(token, connectedBoardAndCol, itemId, connectedItem);
                console.log('Connected item successfully:', connectedItemResult);
            } catch (err) {
                console.error('Error connecting item:', connectedItem, err);
            }
        }
        return connectedItems;        
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    makeConnection,
};