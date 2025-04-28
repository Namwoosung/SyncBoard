import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'ws://localhost:8080/ws-stomp';
  const sessionId = `${__VU}-${Date.now()}`;
  const boardId = "board1";

  const res = ws.connect(baseUrl, {}, function (socket) {
    let isConnected = false;
    let count = 0;
    const maxMessages = 2;

    socket.on('open', function () {
      console.log(`[info] 연결 성공 [mySessionId: ${sessionId}]`);
      // CONNECT 프레임 전송
      const connectFrame = "CONNECT\naccept-version:1.1,1.2\n\n\u0000";
      socket.send(connectFrame);
    });

    socket.on('message', function (msg) {
      try {
        // STOMP 메시지 파싱
        const bodyIndex = msg.indexOf("\n\n") + 2;
        const body = msg.substring(bodyIndex).replace(/\u0000$/, '');
        
        if (msg.startsWith('CONNECTED')) {
          console.log(`[info] [mySessionId: ${sessionId}] 서버로부터 CONNECTED 수신`);
          
          // CONNECTED 수신하면 SUBSCRIBE
          const subscribeFrame = `SUBSCRIBE\nid:sub-0\ndestination:/sub/whiteboard.${boardId}\n\n\u0000`;
          socket.send(subscribeFrame);

          // 이후 주기적으로 메시지 전송 시작
          socket.setInterval(function () {
            if (count >= maxMessages) {
              socket.close();
              return;
            }

            const messageBody = JSON.stringify({
              type: "draw",
              x: Math.random() * 800,
              y: Math.random() * 600,
              color: "#ff0000",
              sessionId: sessionId,
              boardId: boardId,
              timestamp: Date.now()
            });

            const sendFrame = 
              `SEND\ndestination:/pub/whiteboard/send.${boardId}\ncontent-length:${messageBody.length}\n\n${messageBody}\u0000`;

            socket.send(sendFrame);
            count++;
          }, 4000);
          
          isConnected = true;
          return;
        }

        // 그 외에는 수신된 일반 메시지
        if (isConnected && body) {
          const parsed = JSON.parse(body);
          if (parsed.timestamp) {
            const latency = Date.now() - parsed.timestamp;
            console.log(`[info] [mySessionId: ${sessionId}] & [senderSessionId: ${parsed.sessionId}] RTT: ${latency}ms`);
          }
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
