import adonisServer from "@adonisjs/core/services/server";
import { Server } from "socket.io";
import env from "#start/env";

export const io = new Server(adonisServer.getNodeServer(), {
  cors: {
    origin: [env.get("FRONTEND_URL")],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinChannel", (channelId) => {
    console.log(`User joined channel: ${channelId}`);
    socket.join(channelId);
  });

  socket.on("newMessage", (data) => {
    console.log(`🔹 Message reçu: ${data.content} (Canal: ${data.channelId})`);
    io.to(data.channelId).emit("newMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
