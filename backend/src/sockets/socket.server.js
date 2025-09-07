const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      transports: ["websocket", "polling"],
      credentials: true,
    },
  });

  //socket auth middleware
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

    socket.on("hellow", (payload) => {
      console.log("Received hello message:", payload);
    });

    socket.on("ai-message", async (payload) => {
      console.log("Received ai-message:", payload);
      // stroring user message in db and generating vectors
      const [message, vectores] = await Promise.all([
        messageModel.create({
          chat: payload.chat,
          user: socket.user._id,
          content: payload.content,
          role: "user",
        }),
        aiService.generateVector(payload.content),
      ]);
      // querying in pinecon for ltm, storing new vectors in pinecone, fetching recent 20 messages for stm
      const [memory, chatHistory, _ignore] = await Promise.all([
        queryMemory({
          queryVector: vectores,
          limit: 3,
          metadata: {},
        }),
        messageModel
          .find({ chat: payload.chat })
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
      // creating formatted stm
      const stm = chatHistory.map((item) => ({
        role: item.role,
        parts: [{ text: item.content }],
      }));
      // creating formatted ltm
      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `
          these are some previous messages from the chat use them to generate response
          ${memory.map((item) => item.metadata.text).join("\n")}`,
            },
          ],
        },
      ];

      const stream = await aiService.generateResponse([...ltm, ...stm]);
      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk;
        socket.emit("ai-response-stream", {
          content: chunk,
          chat: payload.chat,
          isFinal: false,
        });
      }

      const [responseMessage, responseVectors] = await Promise.all([
        messageModel.create({
          chat: payload.chat,
          user: socket.user._id,
          content: fullResponse,
          role: "model",
        }),
        aiService.generateVector(fullResponse),
      ]);

      await createMemory({
        vectores: responseVectors,
        messageId: responseMessage._id,
        metadata: {
          chat: payload.chat,
          user: socket.user._id,
          text: fullResponse,
        },
      });

      // emiting final full response
      console.log("Emitting ai-response:", fullResponse);
      socket.emit("ai-response", {
        content: fullResponse,
        chat: payload.chat,
      });
    });
  });
}

module.exports = {
  initSocketServer,
};
