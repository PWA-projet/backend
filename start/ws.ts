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
    const stringChannelId = String(channelId); // Assure que c'est une string
    console.log(`🔹 User ${socket.id} joined channel: ${stringChannelId}`);
    socket.join(stringChannelId);
  });

  socket.on("newMessage", (data) => {
    const stringChannelId = String(data.channelId); // Assure que c'est une string
    console.log(`🔹 Message reçu: ${data.content} (Canal: ${stringChannelId})`);

    const usersInRoom = io.sockets.adapter.rooms.get(stringChannelId);
    console.log(`📌 Vérification - Users dans channel ${stringChannelId}:`, usersInRoom || "Aucun");

    if (usersInRoom && usersInRoom.size > 0) {
      console.log(`📡 Message envoyé au channel ${stringChannelId} à ${usersInRoom.size} utilisateurs.`);
      io.to(stringChannelId).emit("newMessage", data);
    } else {
      console.warn(`⚠️ Aucun utilisateur trouvé dans la room ${stringChannelId}, message non envoyé.`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔻 User disconnected: ${socket.id}`);

    // Vérifier s'il quitte bien les rooms
    for (const room of socket.rooms) {
      console.log(`⚠️ User ${socket.id} a quitté la room ${room}`);
    }
  });
});
