/**
 * Process entry: env + Mongo + HTTP listener (mirrors zlss `server.js`).
 * Route/middleware composition lives in `app.js`.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const seedAdmin = require("./seedAdmin");
const { setSocketIo, buildUserRoom } = require("./realtime/socketHub");
const { attachLivePlayHandlers } = require("./realtime/livePlayHandler");

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seedAdmin();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          "http://192.168.1.31:5173",
          process.env.CLIENT_URL || "http://localhost:3000",
        ],
        credentials: true,
      },
    });
    setSocketIo(io);

    io.use((socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
        if (!token || !process.env.JWT_SECRET)
          return next(new Error("Unauthorized"));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded.id;
        return next();
      } catch {
        return next(new Error("Unauthorized"));
      }
    });

    io.on("connection", (socket) => {
      const userId = socket.data?.userId;
      if (userId) {
        socket.join(buildUserRoom(userId));
        console.log(`User ${userId} connected`);

        // Broadcast user online status
        io.emit("user:online", { userId, isOnline: true, ts: Date.now() });

        // Handle message read event
        socket.on("message:markRead", async (data) => {
          try {
            const { messageId } = data || {};
            if (!messageId) return;

            const Message = require("./models/Message");
            const updated = await Message.findByIdAndUpdate(
              messageId,
              { readAt: new Date() },
              { new: true },
            ).lean();

            if (updated) {
              // Notify sender that message was read
              io.to(buildUserRoom(String(updated.senderId))).emit(
                "message:read",
                {
                  messageId: updated._id,
                  readAt: updated.readAt,
                  ts: Date.now(),
                },
              );
            }
          } catch (err) {
            console.error("Error marking message as read:", err);
          }
        });

        // Handle typing indicator
        socket.on("message:typing", (data) => {
          const { recipientId } = data || {};
          if (!recipientId) return;
          io.to(buildUserRoom(String(recipientId))).emit("message:typing", {
            userId,
            ts: Date.now(),
          });
        });

        // Handle stop typing
        socket.on("message:stopTyping", (data) => {
          const { recipientId } = data || {};
          if (!recipientId) return;
          io.to(buildUserRoom(String(recipientId))).emit("message:stopTyping", {
            userId,
            ts: Date.now(),
          });
        });

        attachLivePlayHandlers(io, socket);

        // Handle disconnect
        socket.on("disconnect", () => {
          console.log(`User ${userId} disconnected`);
          io.emit("user:offline", { userId, isOnline: false, ts: Date.now() });
        });
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
