import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Get port from environment variable or use default
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  // Use 0.0.0.0 on Replit, 127.0.0.1 locally
  const host = process.env.REPL_ID ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');

  // Create HTTP server
  const httpServer = createServer(app);

  // Try to start the server
  const startServer = (attemptPort: number) => {
    httpServer.listen(attemptPort, host, () => {
      log(`Server running at http://${host}:${attemptPort}`);
    }).on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${attemptPort} is in use. Trying next port...`);
        startServer(attemptPort + 1);
      } else {
        log(`Error starting server: ${err.message}`);
        if (err.code === 'EACCES') {
          log('Permission denied. Try running with sudo or using a different port.');
        } else if (err.code === 'EADDRNOTAVAIL') {
          log(`Address ${host} is not available. Try using a different host.`);
        }
        process.exit(1);
      }
    });
  };

  startServer(port);
})();

// Add error handling for port issues
process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ENOTSUP' || err.code === 'EADDRINUSE') {
    const errorPort = process.env.PORT || 3333;
    console.error(`\nError: Port ${errorPort} is blocked or in use. Please try one of these solutions:
    1. Temporarily disable your antivirus/firewall
    2. Add an exception for port ${errorPort} in your security software
    3. Try a different port by modifying server/index.ts
    4. Check if another application is using port ${errorPort}
    `);
  }
  process.exit(1);
});
