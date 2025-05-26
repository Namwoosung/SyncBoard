import ws from 'k6/ws';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const rttTrend            = new Trend('custom_rtt_ms');
const expectedRecvCounter = new Counter('custom_expected_receives');
const realRecvCounter     = new Counter('custom_real_receives');

const MESSAGE_INTERVAL_MS = parseInt(__ENV.MESSAGE_INTERVAL_MS) || 1000;
const BOARD_SIZE = 10;

// 전체 테스트 시간(초): 0s + 1m + 0s + 1m + 0s + 1m + 0s + 2m = 300초 (5분)
const TOTAL_TEST_DURATION_MS = 300 * 1000;
const STOP_SENDING_BEFORE_MS = 60 * 1000;  // 마지막 1분 전 정지

export const options = {
  scenarios: {
    websocket_load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '0s',  target: 100 },
        { duration: '1m',  target: 100 },
        { duration: '0s',  target: 300 },
        { duration: '1m',  target: 300 },
        { duration: '0s',  target: 500 },
        { duration: '1m',  target: 500 },
        { duration: '0s',  target: 1000 },
        { duration: '2m',  target: 1000 },
        { duration: '0s', target: 0}
      ]
    }
  }
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'ws://localhost:8080/ws-stomp';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardNum = Math.ceil(__VU / BOARD_SIZE);
  const boardId = `board${boardNum}`;
  const testStart = Date.now();  // 테스트 시작 시각 기록

  const res = ws.connect(baseUrl, {}, function (socket) {
    let isConnected = false;

    socket.on('open', function () {
      const connectFrame = "CONNECT\naccept-version:1.1,1.2\n\n\u0000";
      socket.send(connectFrame);
    });

    socket.on('message', function (msg) {
      try {
        const bodyIndex = msg.indexOf("\n\n") + 2;
        const body = msg.substring(bodyIndex).replace(/\u0000$/, '');
        
        if (msg.startsWith('CONNECTED')) {
          const subscribeFrame = `SUBSCRIBE\nid:sub-0\ndestination:/sub/whiteboard.${boardId}\n\n\u0000`;
          socket.send(subscribeFrame);

          socket.setInterval(function () {
            const now = Date.now();
            const elapsed = now - testStart;

            if (elapsed < TOTAL_TEST_DURATION_MS - STOP_SENDING_BEFORE_MS) {
              const messageBody = JSON.stringify({
                type: "draw",
                drawMode: true,
                strokeColor: "#ff0000",
                strokeWidth: 5,
                sessionId: sessionId,
                boardId: boardId,
                timestamp: now,
                paths: generateSingleStroke()
              });

              const sendFrame = 
                `SEND\ndestination:/pub/whiteboard/send.${boardId}\ncontent-length:${messageBody.length}\n\n${messageBody}\u0000`;

              socket.send(sendFrame);
              expectedRecvCounter.add(BOARD_SIZE);
            }
          }, MESSAGE_INTERVAL_MS);
          
          isConnected = true;
          return;
        }

        if (isConnected && body) {
          const parsed = JSON.parse(body);
          if (parsed.timestamp) {
            const rtt = Date.now() - parsed.timestamp;
            rttTrend.add(rtt);
            realRecvCounter.add(1);
          }
        }
      } catch (_) {}
    });

    socket.on('close', () => {});
    socket.on('error', () => {});
  });

  check(res, { '[info] WebSocket 연결 성공': (r) => r && r.status === 101 });
}

function generateSingleStroke() {
  const stroke = [];
  const points = Math.floor(Math.random() * 90) + 10; // 10 ~ 99개의 좌표
  for (let j = 0; j < points; j++) {
    stroke.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
    });
  }

  return [stroke];
}
