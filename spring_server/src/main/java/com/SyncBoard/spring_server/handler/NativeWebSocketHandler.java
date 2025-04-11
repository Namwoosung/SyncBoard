package com.SyncBoard.spring_server.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Pure WebSocket 연결을 받아서 처리하는 핸들러
 */
@Slf4j
@Component
public class NativeWebSocketHandler extends TextWebSocketHandler {


    // boardId 에 연결된 세션 리스트
    private final Map<String, Set<WebSocketSession>> boardSessions = new ConcurrentHashMap<>();
    // 해당 세션이 연결된 board 저장
    private final Map<String, String> sessionBoardMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info(" pure WS 연결됨: sessionId={}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        try {
            String payload = message.getPayload();
            log.info(" 수신 메시지: {}", payload);

            // 메시지 파싱
            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(payload);
            String boardId = json.get("boardId").asText();

            // boardId 세션 등록
            boardSessions.putIfAbsent(boardId, ConcurrentHashMap.newKeySet());
            boardSessions.get(boardId).add(session);
            sessionBoardMap.put(session.getId(), boardId);

            // boardId에 연결된 세션에게만 브로드캐스트
            for (WebSocketSession s : boardSessions.get(boardId)) {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(payload));
                }
            }
        } catch (Exception e) {
            log.error(" 메시지 처리 실패: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sessionId = session.getId();
        String boardId = sessionBoardMap.get(sessionId);

        if (boardId != null && boardSessions.containsKey(boardId)) {
            boardSessions.get(boardId).remove(session);
            if (boardSessions.get(boardId).isEmpty()) {
                boardSessions.remove(boardId);
            }
        }

        sessionBoardMap.remove(sessionId);
        log.info(" 순수 WS 종료: sessionId={}, boardId={}", sessionId, boardId);
    }
}
