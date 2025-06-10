import ws from 'k6/ws';
import { Trend, Counter } from 'k6/metrics';

const rttTrend            = new Trend('custom_rtt_ms');
const expectedRecvCounter = new Counter('custom_expected_receives');
const realRecvCounter     = new Counter('custom_real_receives');

const MESSAGE_INTERVAL_MS = parseInt(__ENV.MESSAGE_INTERVAL_MS) || 1000;
const BOARD_SIZE = 10;


const TOTAL_TEST_DURATION_MS = 360 * 1000;
const STOP_SENDING_BEFORE_MS = 60 * 1000;  // 마지막 1분 전 정지

// Global test start time
const GLOBAL_TEST_START = Date.now();


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
        { duration: '0s',  target: 700 },
        { duration: '1m',  target: 700 },
        { duration: '0s',  target: 1000 },
        { duration: '2m',  target: 1000 },
        { duration: '0s', target: 0}
      ]
    }
  }
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'ws://3.38.44.208:8080/ws-native';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardNum = Math.ceil(__VU / BOARD_SIZE);
  const boardId = `board${boardNum}`;
  const url = `${baseUrl}?sessionId=${sessionId}&boardId=${boardId}`;

  ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      let startTime = Date.now();
      let intervalId = socket.setInterval(() => {
        const now = Date.now();
        const elapsed = now - GLOBAL_TEST_START;
        const timeSinceStart = now - startTime;

        // 3초가 지난 후에만 메시지 전송 시작
        if (timeSinceStart >= 3000) {
          // 테스트 종료 1분 전부터는 메시지 전송 중단(보냈던 메시지에 대해서만 수신 대기)
          if (elapsed < TOTAL_TEST_DURATION_MS - STOP_SENDING_BEFORE_MS) {
            const msg = {
              boardId,
              type: 'draw',
              drawMode: true,
              strokeColor: '#3366ff',
              strokeWidth: 5,
              sessionId,
              timestamp: now,
              paths: generateSingleStroke(),
            };
            socket.send(JSON.stringify(msg));
            expectedRecvCounter.add(BOARD_SIZE);
          }
        }
      }, MESSAGE_INTERVAL_MS);
    });

    socket.on('message', (raw) => {
      realRecvCounter.add(1);
      try {
        const p = JSON.parse(raw);
        if (p?.sessionId === sessionId && typeof p.timestamp === 'number') {
          const rtt = Date.now() - p.timestamp;
          rttTrend.add(rtt);
        }
      } catch (_) {}
    });

    socket.on('close', () => {});
    socket.on('error', () => {});
  });
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
