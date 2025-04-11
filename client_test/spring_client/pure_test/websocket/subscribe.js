function subscribeToBoard(wsClient, onMessage) {
    wsClient.on("message", (data) => {
      const message = JSON.parse(data);
      onMessage(message);
    });
  
    wsClient.on("open", () => {
      console.log("✅ 연결 성공");
    });
  
    wsClient.on("error", (err) => {
      console.error("❌ 연결 실패:", err.message);
    });
  
    wsClient.on("close", () => {
      console.log("❌ 연결 종료됨");
    });
  }
  
  module.exports = { subscribeToBoard };