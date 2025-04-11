const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = 8081;

// 클라이언트 저장소
const boardSessions = new Map();    // boardId → Set<sessionId>
const sessions = new Map();         // sessionId → ws
const sessionBoardMap = new Map();  // sessionId → boardId

const wss = new WebSocket.Server({ port: PORT });

console.log('🟢 pure WebSocket 서버 실행 중 (포트: 8081)');

wss.on('connection', (ws) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, ws);
  console.log(`✅ 연결됨: sessionId=${sessionId}`);

  ws.on('message', (data) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      console.error('❌ JSON 파싱 오류:', err.message);
      ws.send(JSON.stringify({ error: "Invalid JSON format" }));
      return;
    }

    const boardId = parsed.boardId;
    if (!boardId) {
      ws.send(JSON.stringify({ error: "Missing boardId" }));
      return;
    }

    // 최초 등록 시에만 boardId 등록
    if (!sessionBoardMap.has(sessionId)) {
      sessionBoardMap.set(sessionId, boardId);
      if (!boardSessions.has(boardId)) {
        boardSessions.set(boardId, new Set());
      }
      boardSessions.get(boardId).add(sessionId);
    }

    // 해당 board의 세션들에게만 메시지 전송
    const targetSessionIds = boardSessions.get(boardId) || [];
    for (const targetSessionId of targetSessionIds) {
      const targetWs = sessions.get(targetSessionId);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify({ ...parsed, sessionId }));
      }
    }
  });

  ws.on('close', () => {
    const boardId = sessionBoardMap.get(sessionId);

    if (boardId && boardSessions.has(boardId)) {
      boardSessions.get(boardId).delete(sessionId);
      if (boardSessions.get(boardId).size === 0) {
        boardSessions.delete(boardId);
      }
    }

    sessions.delete(sessionId);
    sessionBoardMap.delete(sessionId);
    console.log(`❌ 연결 종료: sessionId=${sessionId}`);
  });
});
