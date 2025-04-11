const WebSocket = require("ws");

function disconnectClient(wsClient) {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
      console.log("WebSocket 연결 종료");
    }
  }
  
  module.exports = { disconnectClient };
  