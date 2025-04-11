package com.SyncBoard.spring_server.config;

import com.SyncBoard.spring_server.handler.NativeWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Pure WebSocket 을 위한 엔드포인트 및 핸들러 등의 설정을 관리
 */
@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketNativeConfig implements WebSocketConfigurer {


    private final NativeWebSocketHandler nativeWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(nativeWebSocketHandler, "/ws-native")
                .setAllowedOrigins("*");
    }
}
