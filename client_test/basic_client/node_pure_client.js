const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const sessionId = uuidv4();
const boardId = "board1";

// 서버 연결
const socket = new WebSocket("ws://localhost:8081");

let drawInterval;

socket.on("open", () => {
  console.log("✅ 연결 성공");
  console.log("🔐 sessionId:", sessionId);

  // 1초마다 draw 메시지 전송
  drawInterval = setInterval(() => {
    const message = {
      boardId,
      type: "draw",
      x: Math.random() * 800,
      y: Math.random() * 600,
      color: "#00aaff",
      sessionId,
      timestamp: Date.now()
    };

    socket.send(JSON.stringify(message));
  }, 1000);

  // 20초 후 연결 종료
  setTimeout(() => {
    clearInterval(drawInterval);
    if (socket.readyState === WebSocket.OPEN) {
      console.log("⏳ 20초 경과. 연결 종료 시도...");
      socket.close();
    }
  }, 20000);
});

socket.on("message", (data) => {
  const message = JSON.parse(data);
  const latency = Date.now() - message.timestamp;
  console.log(`RTT: ${latency}ms`);
  console.log("📥 수신 메시지:", message);
});

socket.on("close", () => {
  console.log("❌ 연결 종료");
});

socket.on("error", (err) => {
  console.error("❌ 에러 발생:", err.message);
});
