let ioInstance = null;

function initSocketService(io) {
  ioInstance = io;
  
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocketService, getIO };
