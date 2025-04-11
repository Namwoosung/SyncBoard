const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// 클라이언트 저장소
const clients = new Map(); // key: ws, value: { sessionId, boardId }

const wss = new WebSocket.Server({ port: 8081 });

console.log("🟢 Node.js WebSocket 서버 실행 중 (포트: 8081)");

wss.on('connection', (ws) => {
  const sessionId = uuidv4(); // 고유 세션 ID
  clients.set(ws, { sessionId, boardId: null });

  console.log(`✅ 사용자 연결됨: ${sessionId}`);

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);

      // boardId 최초 설정
      if (!clients.get(ws).boardId && parsed.boardId) {
        clients.get(ws).boardId = parsed.boardId;
        console.log(`📌 사용자 ${sessionId} → boardId 설정: ${parsed.boardId}`);
      }

      // 브로드캐스트: 같은 boardId 사용자에게만 전송
      for (const [client, info] of clients.entries()) {
        if (client.readyState === WebSocket.OPEN && info.boardId === parsed.boardId) {
          client.send(JSON.stringify({
            ...parsed,
            sessionId: sessionId // 현재 세션에서 보낸 메시지로 구분
          }));
        }
      }

    } catch (err) {
      console.error("❌ 메시지 처리 오류:", err.message);
    }
  });

  ws.on('close', () => {
    console.log(`❌ 사용자 연결 종료: ${sessionId}`);
    clients.delete(ws);
  });
});
