const { Server } = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const PORT = 8082;

io.on('connection', (socket) => {
  const sessionId = uuidv4();
  console.log(`✅ Socket.IO 연결됨: sessionId=${sessionId}`);

  socket.on('join', (boardId) => {
    socket.join(boardId);
    console.log(`🔗 sessionId=${sessionId} → boardId=${boardId}`);
  });

  socket.on('draw', (data) => {
    const { boardId } = data;
    socket.to(boardId).emit('draw', { ...data, sessionId });
  });

  socket.on('disconnect', () => {
    console.log(`❌ 연결 종료: sessionId=${sessionId}`);
  });
});

server.listen(PORT, () => {
  console.log(`🟢 Socket.IO 서버 실행 중 (포트: ${PORT})`);
});
