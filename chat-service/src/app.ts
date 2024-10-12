import http from "http";
import express from "express";
import cors from "cors";

import { server as WebSocketServer } from "websocket";

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
const server = http.createServer(app);

server.listen(8080, function () {
  console.log(new Date() + " Server is listening on port 8080");
});

const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

export { wsServer, app };
