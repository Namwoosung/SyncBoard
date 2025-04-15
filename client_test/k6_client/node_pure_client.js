import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  const url = 'ws://localhost:8081';
  // __VU 는 k6 내장 변수로 가상 사용자를 식별할 때 유용합니다.
  let sessionId = `${__VU}-${Date.now()}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ 연결 성공");
      // 20번(20초 동안) 1초마다 메시지 전송
      for (let i = 0; i < 20; i++) {
        let message = {
          boardId: "board1",
          type: "draw",
          x: Math.random() * 800,
          y: Math.random() * 600,
          color: "#00aaff",
          sessionId: sessionId,
        };
        socket.send(JSON.stringify(message));
        sleep(1);
      }
      socket.close();
    });
    socket.on('message', function (msg) {
      console.log("📥 수신 메시지:", msg);
    });
    socket.on('close', function () {
      console.log("❌ 연결 종료");
    });
    socket.on('error', function (e) {
      console.error("❌ 에러 발생:", e);
    });
  });
  // 연결이 끝날 때까지 잠시 대기
  sleep(1);
}
