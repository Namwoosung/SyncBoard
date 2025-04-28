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
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Pure WebSocket 연결을 받아서 처리하는 핸들러
 */
@Slf4j
@Component
public class NativeWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, Set<WebSocketSession>> boardSessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionBoardMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri == null) {
                log.error("[error] 연결 요청에 URI 없음");
                session.close();
                return;
            }

            // URL 파라미터 파싱
            String query = uri.getQuery(); // e.g., sessionId=abc123&boardId=board1
            if (query == null) {
                log.error("[error] 연결 요청에 query 파라미터 없음");
                session.close();
                return;
            }

            Map<String, String> params = parseQueryString(query);
            String sessionId = params.get("sessionId");
            String boardId = params.get("boardId");

            if (sessionId == null || boardId == null) {
                log.error("[error] sessionId 또는 boardId 누락");
                session.close();
                return;
            }

            // 세션 등록
            boardSessions.putIfAbsent(boardId, ConcurrentHashMap.newKeySet());
            boardSessions.get(boardId).add(session);
            sessionBoardMap.put(session.getId(), boardId);

            log.info("[info] 연결 등록 완료: sessionId={}, boardId={}", sessionId, boardId);
        } catch (Exception e) {
            log.error("[error] 연결 등록 중 오류: {}", e.getMessage());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        try {
            String payload = message.getPayload();
            log.info("[info] 수신 메시지: {}", payload);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(payload);
            String boardId = json.get("boardId").asText();

            if (boardId == null || !boardSessions.containsKey(boardId)) {
                log.error("[error] 잘못된 boardId로 메시지 수신");
                return;
            }

            // 같은 board에 연결된 모든 세션에게 브로드캐스트
            for (WebSocketSession s : boardSessions.get(boardId)) {
                if (s.isOpen()) {
                    synchronized (s) { // 세션별로 동기화, 하나의 세션에 대해 동시에 요청이 들어오면 순차적으로 처리, 추후 이 부분에 대해 성능 문제가 발생할 수 있다고 판단되면, 다른 방식으로 동기화 문제 해결
                        s.sendMessage(new TextMessage(payload));
                    }
                }
            }
        } catch (Exception e) {
            log.error("[error] 메시지 처리 실패: {}", e.getMessage());
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
        log.info("[info] 연결 종료: sessionId={}, boardId={}", sessionId, boardId);
    }

    private Map<String, String> parseQueryString(String query) {
        Map<String, String> map = new ConcurrentHashMap<>();
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length == 2) {
                map.put(kv[0], kv[1]);
            }
        }
        return map;
    }
}