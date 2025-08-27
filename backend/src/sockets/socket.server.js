const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const { messageModel } = require("../models/message.model");
const { createMemonry, queryMemory } = require("../services/vector.service");

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

    socket.on("ai-message", async (payload) => {
      /* payload = {
      chat:chatId
      content:"hellow ai"
      } */

      await messageModel.create({
        chat: payload.chat,
        user: socket.user._id,
        content: payload.content,
        role: "user",
      });

      const vectores = await aiService.generateVector(payload.content);
      console.log(vectores);
      await createMemonry({
        vectores,
        messageId: "23rfe32",
        metadata: {
          chat: payload.chat,
          user: socket.user.id, 
        },
      });

      const chatHistory = (
        await messageModel
          .find({
            chat: payload.chat,
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
      ).reverse();
      const history = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });
      const response = await aiService.generateResponse(history);

      // await messageModel.create({
      //   chat: payload.chat,
      //   user: socket.user._id,
      //   content: response,
      //   role: "model",
      // });
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
