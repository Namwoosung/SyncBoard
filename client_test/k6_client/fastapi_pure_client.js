import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'ws://localhost:8083/ws';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardId = "board1";

  const url = `${baseUrl}?sessionId=${sessionId}&boardId=${boardId}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log(`[info] 연결 성공 [mySessionId: ${sessionId}]`);

      let count = 0;
      const maxMessages = 2;

      // 연결 후 1초 대기 후 메시지 전송 시작
      socket.setTimeout(function () {
        const intervalId = socket.setInterval(function () {
          if (count >= maxMessages) {
            socket.close();
            return;
          }

          const message = {
            boardId: boardId,
            type: "draw",
            x: Math.random() * 800,
            y: Math.random() * 600,
            color: "#00ccff",
            sessionId: sessionId,
            timestamp: Date.now()
          };

          socket.send(JSON.stringify(message));
          count++;
        }, 4000);  // 4초마다 전송
      }, 1000);    // 최초 연결 후 1초 대기
    });

    socket.on('message', function (msg) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.timestamp) {
          const latency = Date.now() - parsed.timestamp;
          console.log(`[info] [mySessionId: ${sessionId}] & [senderSessionId: ${parsed.sessionId}] RTT: ${latency}ms`);
        }
      } catch (e) {
        console.error(`[error] [mySessionId: ${sessionId}] 수신 메시지 파싱 실패:`, e.message);
      }
    });

    socket.on('close', () => {
      console.log(`[info] [mySessionId: ${sessionId}] 연결 종료`);
    });

    socket.on('error', (e) => {
      console.error(`[error] [mySessionId: ${sessionId}] 에러 발생:`, e.message);
    });
  });

  check(res, { '[info] WebSocket 연결 성공': (r) => r && r.status === 101 });
}
