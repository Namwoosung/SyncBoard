function sendDrawMessage(wsClient, boardId, payload) {
    const message = {
      ...payload,
      boardId
    };
  
    wsClient.send(JSON.stringify(message));
  }
  
  module.exports = { sendDrawMessage };
  