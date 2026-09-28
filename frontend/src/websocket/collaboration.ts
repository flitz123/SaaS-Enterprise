export const connectWebSocket = (onOpen?: () => void) => {
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV
        ? "http://localhost:8000"
        : "https://saa-s-enterprise-oabb.vercel.app")
    const socketUrl = apiUrl.replace(/^http/, "ws") + "/ws"
    const socket = new WebSocket(socketUrl)
    if (onOpen) socket.addEventListener("open", onOpen)
    socket.onmessage = (event) => {
        console.log("Realtime:", event.data)
    }
    return socket
}