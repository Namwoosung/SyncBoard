from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from uuid import UUID
from manager import ConnectionManager

app = FastAPI()
manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = None
    board_id = None

    try:
        while True:
            data = await websocket.receive_json()
            session_id = data.get("sessionId")
            board_id = data.get("boardId")

            if not session_id or not board_id:
                await websocket.send_json({"error": "Missing sessionId or boardId"})
                continue

            # 연결 및 등록
            await manager.connect(websocket, session_id, board_id)
            await manager.broadcast(board_id, data)
    except WebSocketDisconnect:
        if session_id and board_id:
            manager.disconnect(session_id, board_id)