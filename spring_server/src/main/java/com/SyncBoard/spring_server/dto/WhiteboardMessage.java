package com.SyncBoard.spring_server.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WhiteboardMessage {
    private String boardId;
    private String type; // "draw", "pointer", "text"
    private double x;
    private double y;
    private String color;
    private String sessionId;
    private Long timestamp;
}
