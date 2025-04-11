const WebSocket = require("ws");

const WS_URL = "ws://localhost:8080/ws-native";

function createWsClient() {
  const socket = new WebSocket(WS_URL);
  return socket;
}

module.exports = { createWsClient };