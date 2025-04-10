// websocket/subscribe.js

function subscribeToBoard(stompClient, boardId, onMessage) {
  return stompClient.subscribe(`/sub/whiteboard.${boardId}`, (message) => {
    onMessage(JSON.parse(message.body));
  });
}

module.exports = { subscribeToBoard };
