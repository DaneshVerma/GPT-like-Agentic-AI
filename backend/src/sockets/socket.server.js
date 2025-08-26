const { Server } = require("socket.io");

function initSocketServer(httpServer) {
  const io = new Server(httpServer);
  io.on("connection", (soecket) => {
    console.log("new socket connection:", soecket.id);
  });
}

module.exports = {
  initSocketServer,
};
