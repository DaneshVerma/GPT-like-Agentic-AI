const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const { messageModel } = require("../models/message.model");

function initSocketServer(httpServer) {
  const io = new Server(httpServer);

  //socket auth middelware connection olny establishes when user is authenticated.
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    if (!cookies.token) {
      next(new Error("Authentication erorr: no token provided"));
    }
    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication erorr: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("new socket connection:", socket.id);
    console.log("user:", socket.user);

    socket.on("ai-message", async (payload) => {
      /* payload = {
      chat:chatId
      content:"hellow ai"
      } */
      console.log(payload);
      await messageModel.create({
        chat: payload.chat,
        user: socket.user._id,
        content: payload.content,
        role: "user",
      });
      const response = await aiService.generateResponse(payload.content);
      await messageModel.create({
        chat: payload.chat,
        user: socket.user._id,
        content: response,
        role: "model",
      });
      socket.emit("ai-response", {
        content: response,
        chat: payload.chat,
      });
    });
  });
}

module.exports = {
  initSocketServer,
};
