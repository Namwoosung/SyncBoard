const { createStompClient } = require("./websocket/client");
const { subscribeToBoard } = require("./websocket/subscribe");
const { sendDrawMessage } = require("./websocket/publish");
const { unsubscribe } = require("./websocket/unsubscribe");
const { disconnectClient } = require("./websocket/disconnect");
const { v4: uuidv4 } = require("uuid");

const sessionId = uuidv4();
const boardId = "board1";
const stompClient = createStompClient();
let subscription;

console.log("🔐 세션 ID:", sessionId);

stompClient.onConnect = () => {
  console.log("✅ 연결 성공");

  subscription = subscribeToBoard(stompClient, boardId, (message) => {
    console.log("📥 수신 메시지:", message);
  });

  sendDrawMessage(stompClient, boardId, {
    type: "draw",
    x: 100,
    y: 150,
    color: "#ff0000",
    sessionId: sessionId
  });
};

stompClient.activate();

// 10초 후 연결 종료
setTimeout(() => {
  unsubscribe(subscription);
  disconnectClient(stompClient);
}, 10000);
