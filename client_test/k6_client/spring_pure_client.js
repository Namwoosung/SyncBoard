import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 1000,         // 총 1000명 (board당 10명)
  duration: '10s',   // 테스트 시간
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'ws://localhost:8080/ws-native';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardNum = Math.ceil(__VU / 10); // board1 ~ board100
  const boardId = `board${boardNum}`;

  const url = `${baseUrl}?sessionId=${sessionId}&boardId=${boardId}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log(`[info] 연결 성공 [mySessionId: ${sessionId}]`);

      let count = 0;
      const maxMessages = 2;

      socket.setTimeout(function () {
        const intervalId = socket.setInterval(function () {
          if (count >= maxMessages) {
            socket.close();
            return;
          }

          const message = {
            boardId: boardId,
            type: "draw",
            drawMode: true,
            strokeColor: "#3366ff",
            strokeWidth: 5,
            sessionId: sessionId,
            timestamp: Date.now(),
            paths: generateSingleStroke()
          };

          socket.send(JSON.stringify(message));
          count++;
        }, 4000);
      }, 1000);
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

// 단일 stroke 생성
function generateSingleStroke() {
  const stroke = [];
  const points = Math.floor(Math.random() * 90) + 10; // 10 ~ 99개의 좌표
  for (let j = 0; j < points; j++) {
    stroke.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
    });
  }

  return [stroke]; // stroke 배열
}
