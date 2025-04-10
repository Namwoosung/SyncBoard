// websocket/unsubscribe.js

function unsubscribe(subscription) {
    if (subscription) {
      subscription.unsubscribe();
      console.log("구독 해제 완료");
    }
  }
  
  module.exports = { unsubscribe };
  