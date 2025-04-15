const { io } = require("socket.io-client");
const { v4: uuidv4 } = require("uuid");

const sessionId = uuidv4();
const boardId = "board2";

// Socket.IO 서버에 연결
const socket = io("http://localhost:8082");

let drawInterval;

socket.on("connect", () => {
  console.log("✅ 연결 성공:", socket.id);
  console.log("🔐 세션 ID:", sessionId);

  // 보드 참가
  socket.emit("join", {
    boardId,
    clientSessionId: sessionId,
  });

  // draw 이벤트 반복 전송
  drawInterval = setInterval(() => {
    const message = {
      boardId,
      type: "draw",
      x: Math.random() * 800,
      y: Math.random() * 600,
      color: "#ff3366",
      sessionId,
    };

    socket.emit("draw", message);
  }, 1000);

  // 20초 후 연결 종료
  setTimeout(() => {
    clearInterval(drawInterval);
    console.log("⏳ 20초 경과. 연결 종료 시도...");
    socket.disconnect();
  }, 20000);
});

// 서버로부터 수신 이벤트 처리
socket.on("draw", (message) => {
  console.log("📥 수신 메시지:", message);
});

socket.on("disconnect", () => {
  console.log("❌ 연결 종료됨");
});
