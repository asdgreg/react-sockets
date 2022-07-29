const io = require('socket.io')();

io.on('connection', socket => {
  console.log(`connect: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`disconnect: ${socket.id}`);
  });
});

io.listen(3001, {
  cors: {
    origin: ["http://localhost:3000"]
  }
});

setInterval(() => {
  io.emit('message', new Date().toISOString());
  console.log("mensaje enviado")
}, 1000);