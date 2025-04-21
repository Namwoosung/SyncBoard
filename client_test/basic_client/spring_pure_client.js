const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const WS_URL = "ws://localhost:8080/ws-native";
const sessionId = uuidv4();
const boardId = "board1";

console.log("🔐 세션 ID:", sessionId);

// WebSocket 연결
const wsClient = new WebSocket(WS_URL);

let intervalId;

wsClient.on("open", () => {
  console.log("✅ 연결 성공");

  // 메시지 전송: 1초마다 반복
  intervalId = setInterval(() => {
    const message = {
      type: "draw",
      x: Math.random() * 800,
      y: Math.random() * 600,
      color: "#3366ff",
      sessionId,
      boardId,
      timestamp: Date.now()
    };
    wsClient.send(JSON.stringify(message));
  }, 1000);

  // 20초 후 연결 종료
  setTimeout(() => {
    clearInterval(intervalId);
    if (wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
      console.log("⏳ 20초 경과. 연결 종료 시도...");
    }
  }, 20000);
});

// 메시지 수신 처리
wsClient.on("message", (data) => {
  const message = JSON.parse(data);
  const latency = Date.now() - message.timestamp;
  console.log(`RTT: ${latency}ms`);
  console.log("📥 수신 메시지:", message);
});

// 에러 처리
wsClient.on("error", (err) => {
  console.error("❌ 연결 실패:", err.message);
});

// 연결 종료 처리
wsClient.on("close", () => {
  console.log("❌ 연결 종료됨");
});
