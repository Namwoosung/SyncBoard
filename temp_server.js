const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = 8082;

console.log('[info] Socket.IO 서버 실행 중 (포트: 8082)');

io.on('connection', (socket) => {
  let sessionId = null;

  socket.on('join', ({ boardId, clientSessionId }) => {
    sessionId = clientSessionId;
    socket.join(boardId);
    socket.data.boardId = boardId;
    console.log(`[info] 연결 등록 완료: sessionId=${sessionId}, boardId=${boardId}`);
  });

  socket.on('draw', (data) => {
    const boardId = socket.data.boardId;
    if (!boardId || !sessionId) return;
    console.log(data);
    io.to(boardId).emit('draw', { ...data, sessionId });
  });

  socket.on('disconnect', () => {
    console.log(`[info] 연결 종료: sessionId=${sessionId}`);
  });
});

server.listen(PORT, () => {
  console.log('[info] Socket.IO 서버 리스닝 시작');
});

