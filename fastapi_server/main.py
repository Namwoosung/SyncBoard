from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from manager import ConnectionManager

app = FastAPI()
manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = None
    board_id = None

    try:
        # 연결 시 query string으로 sessionId, boardId를 추출
        query_params = websocket.query_params
        session_id = query_params.get("sessionId")
        board_id = query_params.get("boardId")

        if not session_id or not board_id:
            print("[error] 연결 시 필요한 정보 부족 (sessionId 또는 boardId 누락)")
            await websocket.close()
            return

        # 연결 등록
        await manager.connect(websocket, session_id, board_id)

        print(f"[info] 연결 등록 완료: sessionId={session_id}, boardId={board_id}")

        # 연결 이후 메시지 수신 루프
        while True:
            data = await websocket.receive_json()
            print(data)
            await manager.broadcast(board_id, data)

    except WebSocketDisconnect:
        if session_id and board_id:
            manager.disconnect(session_id, board_id)
            print(f"[info] 연결 종료: sessionId={session_id}")
