import { useEffect } from "react";
import { connectWebSocket } from "../websocket/collaboration";

export default function Dashboard() {
  useEffect(() => {
    connectWebSocket();
  }, []);

  return <h2>Dashboard</h2>;
}
