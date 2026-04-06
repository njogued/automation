const initMondayClient = require('monday-sdk-js');

const getColumnsOnType = async (token, boardId, columnType) => {
    try {
        const mondayClient = initMondayClient();
        mondayClient.setToken(token);
        mondayClient.setApiVersion('2025-01');
        const query = `query($boardId: ID!) {
            boards(ids: [$boardId]) {
              columns {
                id
                title
                type
              }
            }
          }`;
        const response = await mondayClient.api(query, { variables: { boardId } });
        const columns = response?.data?.boards?.[0]?.columns ?? [];
        console.log(`Columns: ${JSON.stringify(columns)}.`);
        const boardRelationColumnsFormatted = columns
            .filter(column => column.type === columnType)
            .map(column => ({
                title: column.title,
                value: column.id
            }));
        return boardRelationColumnsFormatted;
    }
    catch (err) {
        console.error(err);
        return [];
    }
}

module.exports = {
    getColumnsOnType
}