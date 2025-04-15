import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  // 아래와 같은 URL 형식으로 연결
  const url = 'ws://localhost:8082/socket.io/?EIO=4&transport=websocket';
  let sessionId = `${__VU}-${Date.now()}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ Socket.IO 연결 성공");
      // Socket.IO는 이벤트 기반 메시지를 전송하는데 보통 42와 같은 접두어 사용
      // 먼저 join 이벤트 전송 (실제 구현에 따라 payload 포맷은 다를 수 있음)
      let joinPayload = JSON.stringify(["42", "join", { boardId: "board2", clientSessionId: sessionId }]);
      socket.send(joinPayload);
      sleep(1);

      // 20번 반복하면서 draw 이벤트 전송
      for (let i = 0; i < 20; i++) {
        let drawPayload = JSON.stringify(["42", "draw", {
          boardId: "board2",
          type: "draw",
          x: Math.random() * 800,
          y: Math.random() * 600,
          color: "#ff3366",
          sessionId: sessionId,
        }]);
        socket.send(drawPayload);
        sleep(1);
      }
      socket.close();
    });
    socket.on('message', (msg) => {
      console.log("📥 수신 메시지:", msg);
    });
    socket.on('close', () => {
      console.log("❌ Socket.IO 연결 종료됨");
    });
    socket.on('error', (e) => {
      console.error("❌ 에러 발생:", e.message);
    });
  });
  sleep(1);
}
