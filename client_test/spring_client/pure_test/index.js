const { createWsClient } = require("./websocket/client");
const { subscribeToBoard } = require("./websocket/subscribe");
const { sendDrawMessage } = require("./websocket/publish");
const { unsubscribe } = require("./websocket/unsubscribe");
const { disconnectClient } = require("./websocket/disconnect");
const { v4: uuidv4 } = require("uuid");

const sessionId = uuidv4();
const boardId = "board1";
const wsClient = createWsClient();

console.log("🔐 세션 ID:", sessionId);

// 연결 및 메시지 처리 설정
subscribeToBoard(wsClient, (message) => {
  console.log("📥 수신 메시지:", message);
});

// 메시지 전송: 연결 후 1초 지연 뒤 실행
setTimeout(() => {
  sendDrawMessage(wsClient, boardId, {
    type: "draw",
    x: 123,
    y: 456,
    color: "#3366ff",
    sessionId: sessionId
    
  });
}, 1000);

// 종료 처리
setTimeout(() => {
  unsubscribe();
  disconnectClient(wsClient);
}, 10000);
