// 사실 필요한 module은 아니지만, 전체 client test 구조를 통합하기 위해 단순히 로그르 찍는 용도로 만듦

function unsubscribe() {
    console.log("구독 해제 완료 (WebSocket은 단일 채널이므로 별도 unsubscribe 필요 없음)");
  }
  
  module.exports = { unsubscribe };