import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { initializeWebSocket } from "./lib/websocket";

// Initialize WebSocket connection for real-time updates
initializeWebSocket();

// Render the application
createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <App />
  </ThemeProvider>
);
