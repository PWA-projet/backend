import { Server } from "socket.io";
import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import env from "#start/env";

app.ready(() => {
  const io = new Server(server.getNodeServer(), {
    cors: {
      origin: [env.get("FRONTEND_URL")],
        methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinChannel", (channelId) => {
      const stringChannelId = String(channelId); // Assure que c'est une string
      console.log(`🔹 User ${socket.id} joined channel: ${stringChannelId}`);
      socket.join(stringChannelId);
    });

    socket.on("newMessage", (data) => {
      const stringChannelId = String(data.channelId); // Assure que c'est une string
      console.log(`🔹 Message reçu: ${data.content} (Channel: ${stringChannelId})`);
      io.to(stringChannelId).emit("newMessage", data);
    });

    socket.on("disconnect", () => {
      console.log(`🔻 User disconnected: ${socket.id}`);
    });
  });
})
