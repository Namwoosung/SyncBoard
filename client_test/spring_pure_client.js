const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const WS_URL = "ws://localhost:8080/ws-native";
const sessionId = uuidv4();
const boardId = "board1";

console.log("🔐 세션 ID:", sessionId);

// WebSocket 연결
const wsClient = new WebSocket(WS_URL);

// 연결 이벤트 처리
wsClient.on("open", () => {
  console.log("✅ 연결 성공");

  // 메시지 전송: 연결 후 1초 지연
  setTimeout(() => {
    const message = {
      type: "draw",
      x: 123,
      y: 456,
      color: "#3366ff",
      sessionId,
      boardId,
    };
    wsClient.send(JSON.stringify(message));
  }, 1000);
});

// 메시지 수신
wsClient.on("message", (data) => {
  const message = JSON.parse(data);
  console.log("📥 수신 메시지:", message);
});

// 에러 처리
wsClient.on("error", (err) => {
  console.error("❌ 연결 실패:", err.message);
});

// 연결 종료
wsClient.on("close", () => {
  console.log("❌ 연결 종료됨");
});

// 종료 처리: 10초 후 연결 종료
setTimeout(() => {

  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.close();
    console.log("WebSocket 연결 종료");
  }
}, 10000);
