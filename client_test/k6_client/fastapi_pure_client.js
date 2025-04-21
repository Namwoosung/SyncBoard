import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  const url = 'ws://localhost:8083/ws';
  let sessionId = `${__VU}-${Date.now()}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ FastAPI WebSocket 연결 성공");
      // 20초 동안 1초마다 메시지 전송
      for (let i = 0; i < 20; i++) {
        let message = {
          sessionId: sessionId,
          boardId: "board1",
          type: "draw",
          x: Math.random() * 800,
          y: Math.random() * 600,
          color: "#00ccff",
          timestamp: Date.now()
        };
        socket.send(JSON.stringify(message));
        sleep(1);
      }
      socket.close();
    });
    socket.on('message', function (msg) {
      const latency = Date.now() - msg.timestamp;
      console.log(`RTT: ${latency}ms`);
      console.log("📥 수신 메시지:", msg);
    });
    socket.on('close', () => {
      console.log("❌ 연결 종료됨");
    });
    socket.on('error', (e) => {
      console.error("❌ 에러 발생:", e.message);
    });
  });
  sleep(1);
}
