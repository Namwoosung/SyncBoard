const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = 8082;

io.on('connection', (socket) => {
  let sessionId = null;

  // 클라이언트가 보낸 sessionId와 boardId를 join 이벤트로 수신
  socket.on('join', ({ boardId, clientSessionId }) => {
    sessionId = clientSessionId;
    socket.join(boardId);
    socket.data.boardId = boardId;
    console.log(`✅ 연결됨: sessionId=${sessionId}, boardId=${boardId}`);
  });

  // draw 이벤트 수신
  socket.on('draw', (data) => {
    const boardId = socket.data.boardId;
    if (!boardId || !sessionId) return;

    io.to(boardId).emit('draw', { ...data, sessionId });
  });

  socket.on('disconnect', () => {
    console.log(`❌ 연결 종료: sessionId=${sessionId}`);
  });
});

server.listen(PORT, () => {
  console.log(`🟢 Socket.IO 서버 실행 중 (포트: ${PORT})`);
});
