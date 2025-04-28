from typing import Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # boardId -> { sessionId: WebSocket }
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, board_id: str):
        if board_id not in self.active_connections:
            self.active_connections[board_id] = {}
        self.active_connections[board_id][session_id] = websocket

    def disconnect(self, session_id: str, board_id: str):
        if board_id in self.active_connections:
            self.active_connections[board_id].pop(session_id, None)
            if not self.active_connections[board_id]:
                del self.active_connections[board_id]

    async def broadcast(self, board_id: str, message: dict):
        if board_id in self.active_connections:
            for ws in self.active_connections[board_id].values():
                await ws.send_json(message)
