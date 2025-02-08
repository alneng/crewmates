import { createServer } from "http";
import app from "./app";
import { SocketService } from "./socket/socket.service";

const port = process.env.PORT || 3000;

const httpServer = createServer(app);

// Initialize Socket service
new SocketService(httpServer);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
