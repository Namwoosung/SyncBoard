import ws from 'k6/ws';
import { sleep } from 'k6';

export default function () {
  // STOMP 서버의 웹소켓 엔드포인트 (실제 환경에 맞게 수정 필요)
  const url = 'ws://localhost:8080/ws-stomp/websocket';
  let sessionId = `${__VU}-${Date.now()}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      console.log("✅ STOMP 연결 성공");
      // CONNECT 프레임 전송
      let connectFrame = "CONNECT\naccept-version:1.1,1.2\n\n\u0000";
      socket.send(connectFrame);
      sleep(1);
      
      // SUBSCRIBE 프레임 전송: 구독 ID와 destination 설정
      let subscribeFrame = "SUBSCRIBE\nid:sub-0\ndestination:/sub/whiteboard.board1\n\n\u0000";
      socket.send(subscribeFrame);
      sleep(1);
      
      // SEND 프레임 전송: 메시지 본문 포함
      let body = JSON.stringify({
        type: "draw",
        x: 100,
        y: 150,
        color: "#ff0000",
        sessionId: sessionId,
        boardId: "board1"
      });
      let publishFrame = "SEND\ndestination:/pub/whiteboard/send.board1\ncontent-length:" + body.length + "\n\n" + body + "\u0000";
      socket.send(publishFrame);
      sleep(10);
      socket.close();
    });
    socket.on('message', function (msg) {
      console.log("📥 수신 메시지:", msg);
    });
    socket.on('close', () => {
      console.log("❌ STOMP 연결 종료됨");
    });
    socket.on('error', (e) => {
      console.error("❌ 에러 발생:", e.message);
    });
  });
  sleep(1);
}
