const { Client } = require("@stomp/stompjs");
const SockJS = require("sockjs-client");
const { v4: uuidv4 } = require("uuid");

const WS_URL = "http://localhost:8080/ws-stomp";
const sessionId = uuidv4();
const boardId = "board1";
let subscription;

console.log("🔐 세션 ID:", sessionId);

// STOMP 클라이언트 생성
const stompClient = new Client({
  webSocketFactory: () => new SockJS(WS_URL),
  connectHeaders: {},
  debug: (str) => console.log("[STOMP DEBUG]", str),
  reconnectDelay: 0,
  onWebSocketError: (err) => {
    console.error("WebSocket 연결 실패:", err.message);
  },
  onStompError: (frame) => {
    console.error("STOMP 오류:", frame.headers["message"]);
    console.error("상세:", frame.body);
  },
});

// 연결 성공 시 처리
stompClient.onConnect = () => {
  console.log("✅ 연결 성공");

  // 메시지 수신 구독
  subscription = stompClient.subscribe(`/sub/whiteboard.${boardId}`, (message) => {
    const payload = JSON.parse(message.body);
    console.log("📥 수신 메시지:", payload);
  });

  // 메시지 전송
  stompClient.publish({
    destination: `/pub/whiteboard/send.${boardId}`,
    body: JSON.stringify({
      type: "draw",
      x: 100,
      y: 150,
      color: "#ff0000",
      sessionId,
      boardId,
    }),
  });
};

// 연결 시작
stompClient.activate();

// 10초 후 연결 해제
setTimeout(() => {
  if (subscription) {
    subscription.unsubscribe();
    console.log("구독 해제 완료");
  }

  if (stompClient && stompClient.active) {
    stompClient.deactivate();
    console.log("WebSocket 연결 종료");
  }
}, 10000);
