from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from manager import ConnectionManager
import redis.asyncio as redis
import json

app = FastAPI()
manager = ConnectionManager()

# Redis 클라이언트 초기화
redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

@app.on_event("startup")
async def startup():
    from redis_subscriber import start_redis_subscriber
    await start_redis_subscriber(redis_client, manager)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = None
    board_id = None

    try:
        query_params = websocket.query_params
        session_id = query_params.get("sessionId")
        board_id = query_params.get("boardId")

        if not session_id or not board_id:
            await websocket.close()
            return

        await manager.connect(websocket, session_id, board_id)

        while True:
            data = await websocket.receive_json()
            data["boardId"] = board_id
            await redis_client.publish(f"board:{board_id}", json.dumps(data))

    except WebSocketDisconnect:
        if session_id and board_id:
            manager.disconnect(session_id, board_id)
