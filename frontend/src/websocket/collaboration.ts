export const connectWebSocket = () => {
    const socket = new WebSocket("ws://localhost:8000/ws")
    socket.onmessage = (event) => {
        console.log("Realtime:", event.data)
    }
    return socket
}