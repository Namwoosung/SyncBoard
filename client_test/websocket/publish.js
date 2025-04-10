// websocket/publish.js

function sendDrawMessage(stompClient, boardId, payload) {
  stompClient.publish({
    destination: `/pub/whiteboard/send.${boardId}`,
    body: JSON.stringify({ ...payload, boardId }),
  });
}

module.exports = { sendDrawMessage };
