import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  const url = 'ws://localhost:8080/ws-native';
  let sessionId = `${__VU}-${Date.now()}`;

  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ Spring WebSocket 연결 성공");

      // 20회 반복 (1초마다 전송 → 20초)
      for (let i = 0; i < 20; i++) {
        const message = {
          type: "draw",
          x: Math.random() * 800,
          y: Math.random() * 600,
          color: "#3366ff",
          sessionId: sessionId,
          boardId: "board1",
          timestamp: Date.now(),
        };
        socket.send(JSON.stringify(message));
        sleep(1);
      }

      socket.close();
    });

    socket.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg);
        const latency = Date.now() - parsed.timestamp;
        console.log(`RTT: ${latency}ms`);
        console.log("📥 수신 메시지:", parsed);
      } catch (err) {
        console.error("❌ 메시지 파싱 오류:", err.message);
      }
    });

    socket.on('close', () => {
      console.log("❌ 연결 종료됨");
    });

    socket.on('error', (e) => {
      console.error("❌ 에러 발생:", e.message);
    });
  });

  // 연결 종료까지 기다리기
  sleep(1);
}
