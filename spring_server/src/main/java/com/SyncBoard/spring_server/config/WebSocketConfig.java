package com.SyncBoard.spring_server.config;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 엔트포인트와 핸들러 등록을 위한 Config
 * 즉 클라이언트가 WebSocket 연결을 위한 엔드포인트를 설정하는 역할
 * STOMP 프로토콜을 사용할 예정이니 메시지 브로커 설정을 구현
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // SockJS fallback
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 보낼 경로 prefix
        registry.setApplicationDestinationPrefixes("/pub");
        // 서버에서 클라이언트에게 보내는 메시지 prefix
        registry.enableSimpleBroker("/sub");
    }
}
