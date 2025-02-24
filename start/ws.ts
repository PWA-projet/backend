import adonisServer from '@adonisjs/core/services/server';
import { Server } from 'socket.io';
import env from "#start/env";

export const io = new Server(adonisServer.getNodeServer(), {
  cors: {
    origin: [env.get('FRONTEND_URL')],  // Remplacez par l'URL de votre frontend Angular
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  socket.on('joinChannel', (channelId) => {
    console.log('User joined channel:', channelId);
    socket.join(channelId);  // L'utilisateur rejoint un canal spécifique
  });

  socket.on('msgFromFE', (data) => {
    console.log('Message from frontend:', data);
  });
});
