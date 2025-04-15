import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  const url = 'ws://localhost:8080/ws-native';
  let sessionId = `${__VU}-${Date.now()}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ Spring WebSocket 연결 성공");
      sleep(1);  // 연결 후 1초 대기
      let message = {
        type: "draw",
        x: 123,
        y: 456,
        color: "#3366ff",
        sessionId: sessionId,
        boardId: "board1",
      };
      socket.send(JSON.stringify(message));
      sleep(10);
      socket.close();
    });
    socket.on('message', (msg) => {
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
