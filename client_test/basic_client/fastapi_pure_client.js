const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const WS_URL = "ws://localhost:8083/ws";
const sessionId = uuidv4();
const boardId = "board1";

console.log("🔐 세션 ID:", sessionId);

const socket = new WebSocket(WS_URL);

let interval;

socket.on("open", () => {
  console.log("✅ 연결 성공");

  // 1초마다 draw 메시지 전송
  interval = setInterval(() => {
    const message = {
      sessionId,
      boardId,
      type: "draw",
      x: Math.random() * 800,
      y: Math.random() * 600,
      color: "#00ccff"
    };
    socket.send(JSON.stringify(message));
  }, 1000);

  // 20초 후 연결 종료
  setTimeout(() => {
    clearInterval(interval);
    if (socket.readyState === WebSocket.OPEN) {
      console.log("⏳ 20초 경과. 연결 종료 시도...");
      socket.close();
    }
  }, 20000);
});

socket.on("message", (data) => {
  const message = JSON.parse(data);
  console.log("📥 수신 메시지:", message);
});

socket.on("close", () => {
  console.log("❌ 연결 종료됨");
});

socket.on("error", (err) => {
  console.error("❌ 에러 발생:", err.message);
});
