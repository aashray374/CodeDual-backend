import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";

import configureSocket from "./config/socket.js";

const port = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

configureSocket(io);

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});