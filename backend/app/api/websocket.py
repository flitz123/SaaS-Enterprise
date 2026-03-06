from fastapi import APIRouter, WebSocket

router = APIRouter()

connections = []

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            for conn in connections:
                await conn.send_text(data)
    except:
        connections.remove(websocket) 