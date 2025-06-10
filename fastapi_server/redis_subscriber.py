import asyncio
import json

async def start_redis_subscriber(redis_client, manager):
    pubsub = redis_client.pubsub()
    await pubsub.psubscribe("board:*")

    async def reader():
        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                channel = message["channel"]  # e.g., "board:123"
                board_id = channel.split(":")[1]
                try:
                    payload = json.loads(message["data"])
                    await manager.broadcast(board_id, payload)
                except Exception as e:
                    print("[error] Redis message parse error:", e)

    asyncio.create_task(reader())
