import ws from 'k6/ws';
import { Trend, Counter } from 'k6/metrics';

/* ───── custom metrics ───── */
const rttTrend            = new Trend('custom_rtt_ms');
const expectedRecvCounter = new Counter('custom_expected_receives');
const realRecvCounter     = new Counter('custom_real_receives');

const MESSAGE_INTERVAL_MS = parseInt(__ENV.MESSAGE_INTERVAL_MS) || 1000;
const BOARD_SIZE = 10;

// 전체 테스트 시간(초): 0s + 1m + 0s + 1m + 0s + 1m + 0s + 1m = 240초 (4분)
const TOTAL_TEST_DURATION_MS = 300 * 1000;
const STOP_SENDING_BEFORE_MS = 60 * 1000;  // 마지막 10초 전 정지

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
  const baseUrl   = __ENV.TARGET_URL || 'ws://localhost:8081';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardNum  = Math.ceil(__VU / BOARD_SIZE);
  const boardId   = `board${boardNum}`;
  const url       = `${baseUrl}?sessionId=${sessionId}&boardId=${boardId}`;

  const testStart = Date.now();  // 테스트 시작 시각 기록

  ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      socket.setInterval(() => {
        const now = Date.now();
        const elapsed = now - testStart;

        // 테스트 종료 1분 전부터는 메시지 전송 중단(보냈던 메시지에 대해서만 수신 대기)
        if (elapsed < TOTAL_TEST_DURATION_MS - STOP_SENDING_BEFORE_MS) {
          const msg = {
            boardId,
            type: 'draw',
            drawMode: true,
            strokeColor: '#00aaff',
            strokeWidth: 5,
            sessionId,
            timestamp: now,
            paths: generateSingleStroke(),
          };

          socket.send(JSON.stringify(msg));
          expectedRecvCounter.add(BOARD_SIZE);
        }
      }, MESSAGE_INTERVAL_MS);
    });

    socket.on('message', (raw) => {
      realRecvCounter.add(1);
      try {
        const p = JSON.parse(raw);
        const rtt = Date.now() - p.timestamp;
        rttTrend.add(rtt);
      } catch (_) {}
    });

    socket.on('close', () => {});
    socket.on('error', () => {});
  });
}

function generateSingleStroke() {
  const stroke = [];
  const points = Math.floor(Math.random() * 90) + 10;
  for (let j = 0; j < points; j++) {
    stroke.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
    });
  }

  return [stroke];
}