const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const { messageModel } = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

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
      // saving input message to db and convrting message to vectors
      const [message, vectores] = await Promise.all([
        messageModel.create({
          chat: payload.chat,
          user: socket.user._id,
          content: payload.content,
          role: "user",
        }),
        aiService.generateVector(payload.content),
      ]);

      const [memory, chatHistory, _ignore] = await Promise.all([
        queryMemory({
          queryVector: vectores,
          limit: 3,
          metadata: {},
        }),
        messageModel
          .find({
            chat: payload.chat,
          })
          .sort({ createdAt: -1 })


           
          .limit(20)
          .lean()
          .then((docs) => docs.reverse()),
        createMemory({
          vectores: vectores,
          messageId: message._id,
          metadata: {
            chat: payload.chat,
            user: socket.user.id,
            text: payload.content,
          },
        }),
      ]);

      // short term memory
      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });

      // long term memory
      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `
          these are some previous messages from the chat use them to generate response
          ${memory
            .map((item) => {
              return item.metadata.text;
            })
            .join("\n")}`,
            },
          ],
        },
      ];
      //generating response from ai model
      const response = await aiService.generateResponse([...ltm, ...stm]);

      //saving response to db and converting response to vectors
      const [responseMessage, responseVectors] = await Promise.all([
        messageModel.create({
          chat: payload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        }),
        aiService.generateVector(response),
      ]);

      //saving response to pinecone memory
      await createMemory({
        vectores: responseVectors,
        messageId: responseMessage._id,
        metadata: {
          chat: payload.chat,
          user: socket.user._id,
          text: response,
        },
      });
      //emiting response to client
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
