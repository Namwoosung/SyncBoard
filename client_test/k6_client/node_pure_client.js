import ws from 'k6/ws';
import { Trend, Gauge, Counter } from 'k6/metrics';

/* ───── custom metrics ───── */
const rttTrend            = new Trend('custom_rtt_ms');
const maxRttGauge         = new Gauge('custom_max_rtt_ms');         // 최대 RTT (시계열로 지속 보고)
const expectedRecvCounter = new Counter('custom_expected_receives');
const realRecvCounter     = new Counter('custom_real_receives');

const MESSAGE_INTERVAL_MS = parseInt(__ENV.MESSAGE_INTERVAL_MS) || 1000;
const BOARD_SIZE = 10;

export const options = {
  scenarios: {
    websocket_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 30 },
        { duration: '1m',  target: 30 },
        { duration: '20s', target: 0 },
      ],
    },
  },
};

export default function () {
  const baseUrl   = __ENV.TARGET_URL || 'ws://localhost:8081';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardNum  = Math.ceil(__VU / BOARD_SIZE);
  const boardId   = `board${boardNum}`;
  const url       = `${baseUrl}?sessionId=${sessionId}&boardId=${boardId}`;
  const tags      = { boardId };

  let maxRtt = 0;

  ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      socket.setInterval(() => {
        const msg = {
          boardId,
          type: 'draw',
          drawMode: true,
          strokeColor: '#00aaff',
          strokeWidth: 5,
          sessionId,
          timestamp: Date.now(),
          paths: generateSingleStroke(),
        };
        socket.send(JSON.stringify(msg));
        expectedRecvCounter.add(BOARD_SIZE, tags);
        maxRttGauge.add(maxRtt, tags);
      }, MESSAGE_INTERVAL_MS);
    });

    socket.on('message', (raw) => {
      realRecvCounter.add(1, tags);
      try {
        const p = JSON.parse(raw);
        if (p?.sessionId === sessionId && typeof p.timestamp === 'number') {
          const rtt = Date.now() - p.timestamp;
          rttTrend.add(rtt, tags);
          
          if (rtt > maxRtt) {
            maxRtt = rtt;
          }
        }
      } catch (_) {}
    });

    socket.on('close', () => {});
    socket.on('error', () => {});
  });
}

/* demo stroke generator */
function generateSingleStroke() {
  const pts = Array.from({ length: 50 }, (_, j) => ({
    x: (j / 50) * 800,
    y: Math.random() * 600,
  }));
  return [pts];
}
