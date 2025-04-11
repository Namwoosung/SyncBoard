// websocket/client.js
const { Client } = require("../node_modules/@stomp/stompjs");
const SockJS = require("sockjs-client");

const WS_URL = "http://localhost:8080/ws-stomp";

function createStompClient() {
  const stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: {},
    debug: (str) => console.log("[STOMP DEBUG]", str),
    reconnectDelay: 0,
    onWebSocketError: (err) => {
      console.error("WebSocket 연결 실패:", err.message);
    },
    onStompError: (frame) => {
      console.error("STOMP 오류:", frame.headers["message"]);
      console.error("상세:", frame.body);
    },
  });

  return stompClient;
}

module.exports = { createStompClient };
