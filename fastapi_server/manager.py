from typing import Dict
from uuid import UUID
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[UUID, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: UUID, board_id: str):
        if board_id not in self.active_connections:
            self.active_connections[board_id] = {}
        self.active_connections[board_id][session_id] = websocket
        print(f"연결됨: sessionId={session_id}, boardId={board_id}")


    def disconnect(self, session_id: UUID, board_id: str):
        if board_id in self.active_connections:
            self.active_connections[board_id].pop(session_id, None)

    async def broadcast(self, board_id: str, message: dict):
        if board_id in self.active_connections:
            for ws in self.active_connections[board_id].values():
                await ws.send_json(message)