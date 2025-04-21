import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  const url = 'ws://localhost:8080/ws-stomp/websocket';
  let sessionId = `${__VU}-${Date.now()}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ STOMP 연결 성공");

      // 1. STOMP CONNECT 프레임
      const connectFrame = "CONNECT\naccept-version:1.1,1.2\n\n\u0000";
      socket.send(connectFrame);
      sleep(1);

      // 2. SUBSCRIBE 프레임
      const subscribeFrame = "SUBSCRIBE\nid:sub-0\ndestination:/sub/whiteboard.board1\n\n\u0000";
      socket.send(subscribeFrame);
      sleep(1);

      // 3. 1초마다 메시지 전송 (총 20회 = 20초)
      for (let i = 0; i < 20; i++) {
        const body = JSON.stringify({
          type: "draw",
          x: Math.random() * 800,
          y: Math.random() * 600,
          color: "#ff0000",
          sessionId: sessionId,
          boardId: "board1",
          timestamp: Date.now()
        });

        const sendFrame =
          "SEND\ndestination:/pub/whiteboard/send.board1\n" +
          "content-length:" + body.length + "\n\n" +
          body + "\u0000";

        socket.send(sendFrame);
        sleep(1);
      }

      socket.close();
    });

    socket.on('message', function (msg) {
      try {
        // 메시지는 STOMP 프레임이므로 본문 추출 필요
        const bodyIndex = msg.indexOf("\n\n") + 2;
        const body = msg.substring(bodyIndex).replace(/\u0000$/, '');
        const parsed = JSON.parse(body);
        const latency = Date.now() - parsed.timestamp;
        console.log(`RTT: ${latency}ms`);
        console.log("📥 수신 메시지:", parsed);
      } catch (err) {
        console.error("❌ 수신 메시지 처리 오류:", err.message);
      }
    });

    socket.on('close', () => {
      console.log("❌ STOMP 연결 종료됨");
    });

    socket.on('error', (e) => {
      console.error("❌ 에러 발생:", e.message);
    });
  });

  sleep(1);
}
