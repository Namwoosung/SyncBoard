const WebSocket = require('ws');
const cluster = require('cluster');
const os = require('os');
const { createClient } = require('redis');

const PORT = 8081;

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`[info] Master process started. Forking ${numCPUs} workers.`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const wss = new WebSocket.Server({ port: PORT });

  const boardSessions = new Map();    // boardId → Set<sessionId>
  const sessions = new Map();         // sessionId → ws
  const sessionBoardMap = new Map();  // sessionId → boardId

  const redisPub = createClient({ url: 'redis://redis:6379' });    // publisher
  const redisSub = createClient({ url: 'redis://redis:6379' });    // subscriber

  redisPub.connect();
  redisSub.connect();

  console.log(`[info] Worker process ${process.pid} started`);

  redisSub.on('message', (channel, message) => {
    const boardId = channel.split(':')[1];
    const targetSessionIds = boardSessions.get(boardId) || [];

    for (const sessionId of targetSessionIds) {
      const ws = sessions.get(sessionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);  // 이미 JSON 문자열로 전달됨
      }
    }
  });

  wss.on('connection', async (ws, req) => {
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
      await redisSub.subscribe(`board:${boardId}`, (message, channel) => {
        const boardId = channel.split(':')[1];
        const targetSessionIds = boardSessions.get(boardId) || [];
      
        for (const sessionId of targetSessionIds) {
          const ws = sessions.get(sessionId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        }
      });
    }
    boardSessions.get(boardId).add(sessionId);

    ws.on('message', async (data) => {
      try {
        JSON.parse(data); // validation
        await redisPub.publish(`board:${boardId}`, data);
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });

    ws.on('close', async () => {
      if (!sessionId) return;

      const boardId = sessionBoardMap.get(sessionId);

      if (boardId && boardSessions.has(boardId)) {
        boardSessions.get(boardId).delete(sessionId);
        if (boardSessions.get(boardId).size === 0) {
          boardSessions.delete(boardId);
          await redisSub.unsubscribe(`board:${boardId}`);
        }
      }

      sessions.delete(sessionId);
      sessionBoardMap.delete(sessionId);
    });
  });
}
