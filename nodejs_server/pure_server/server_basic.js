const WebSocket = require('ws');

const PORT = 8081;

// 클라이언트 저장소
const boardSessions = new Map();    // boardId → Set<sessionId>
const sessions = new Map();         // sessionId → ws
const sessionBoardMap = new Map();  // sessionId → boardId

const wss = new WebSocket.Server({ port: PORT });

console.log('[info] pure WebSocket 서버 실행 중 (포트: 8081)');
console.log('[info] 서버 시작 시간:', new Date().toISOString());

wss.on('connection', (ws, req) => {
  let sessionId = null;
  let boardId = null;

  const url = new URL(req.url, `ws://${req.headers.host}`);
  sessionId = url.searchParams.get('sessionId');
  boardId = url.searchParams.get('boardId');

  if (!sessionId || !boardId) {
    ws.close();
    return;
  }
  
  sessions.set(sessionId, ws);
  sessionBoardMap.set(sessionId, boardId);
  
  if (!boardSessions.has(boardId)) {
    boardSessions.set(boardId, new Set());
  }
  boardSessions.get(boardId).add(sessionId);

  ws.on('message', (data) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid JSON format" }));
      return;
    }

    const targetSessionIds = boardSessions.get(boardId) || [];
    for (const targetSessionId of targetSessionIds) {
      const targetWs = sessions.get(targetSessionId);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify({ ...parsed }));
      }
    }
  });

  ws.on('close', () => {
    if (!sessionId) return;

    const boardId = sessionBoardMap.get(sessionId);

    if (boardId && boardSessions.has(boardId)) {
      boardSessions.get(boardId).delete(sessionId);
      if (boardSessions.get(boardId).size === 0) {
        boardSessions.delete(boardId);
      }
    }

    sessions.delete(sessionId);
    sessionBoardMap.delete(sessionId);
  });
});
