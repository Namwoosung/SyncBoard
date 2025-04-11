// websocket/disconnect.js

function disconnectClient(stompClient) {
    if (stompClient && stompClient.active) {
      stompClient.deactivate();
      console.log("WebSocket 연결 종료");
    }
  }
  
  module.exports = { disconnectClient };
  