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
    console.log(`🔹 User ${socket.id} joined channel: ${channelId}`);
    socket.join(channelId);
  });

  socket.on("newMessage", (data) => {
    const stringChannelId = String(data.channelId); // Assure que c'est une string
    console.log(`🔹 Message reçu: ${data.content} (Channel: ${data.channelId})`);

    io.to(stringChannelId).emit("newMessage", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔻 User disconnected: ${socket.id}`);
  });
});
