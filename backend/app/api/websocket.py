import asyncio
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models.tenant_membership import TenantMembership
from app.models.user import User

router = APIRouter()

connections: dict[int, set[WebSocket]] = {}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    protocols = websocket.scope.get("subprotocols", [])
    if len(protocols) != 2 or protocols[0] != "bearer":
        await websocket.close(code=4401)
        return

    try:
        payload = decode_token(protocols[1])
        email = payload.get("sub")
        tenant_id = payload.get("tenant_id")
        expires_at = float(payload["exp"])
        if not isinstance(email, str) or not isinstance(tenant_id, int):
            raise ValueError("Invalid token claims")
    except Exception:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        membership_id = await db.scalar(
            select(TenantMembership.id)
            .join(User, User.id == TenantMembership.user_id)
            .where(User.email == email, TenantMembership.tenant_id == tenant_id)
        )
    if membership_id is None:
        await websocket.close(code=4403)
        return

    await websocket.accept(subprotocol="bearer")
    tenant_connections = connections.setdefault(tenant_id, set())
    tenant_connections.add(websocket)
    try:
        while True:
            remaining = expires_at - time.time()
            if remaining <= 0:
                await websocket.close(code=4401, reason="Token expired")
                break
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=remaining)
            except asyncio.TimeoutError:
                await websocket.close(code=4401, reason="Token expired")
                break
            stale_connections = set()
            for connection in tuple(tenant_connections):
                try:
                    await connection.send_text(data)
                except (RuntimeError, WebSocketDisconnect):
                    stale_connections.add(connection)
            tenant_connections.difference_update(stale_connections)
    except WebSocketDisconnect:
        pass
    finally:
        tenant_connections.discard(websocket)
        if not tenant_connections:
            connections.pop(tenant_id, None)