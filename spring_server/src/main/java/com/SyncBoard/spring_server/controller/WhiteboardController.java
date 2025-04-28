package com.SyncBoard.spring_server.controller;

import com.SyncBoard.spring_server.dto.WhiteboardMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class WhiteboardController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/whiteboard/send.{boardId}")
    public void handleMessage(@DestinationVariable String boardId,
                              @Payload WhiteboardMessage message,
                              SimpMessageHeaderAccessor headerAccessor) {

        // 보드 ID 확인 및 메시지 전송
        message.setBoardId(boardId);
        log.info("message {}", message);

        messagingTemplate.convertAndSend("/sub/whiteboard." + boardId, message);
    }
}
