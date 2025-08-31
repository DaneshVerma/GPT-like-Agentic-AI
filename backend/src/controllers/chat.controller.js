const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");
async function createChat(req, res) {
  const { title } = req.body;
  if (!title)
    return res.status(400).json({
      message: "invalid or empty data",
    });
  const user = req.user;
  const chat = await chatModel.create({ title, user: user._id });
  res.status(201).json({
    message: "chat created succesfully",
    chat: {
      id: chat._id,
      title: chat.title,
      lastActivity: chat.lastActivity,
      chat: chat.user,
    },
  });
}

async function getAllChats(req, res) {
  const user = req.user;
  const chats = await chatModel.find({ user: user._id });
  res.status(200).json({
    message: "chats fetched successfully",
    chats: chats.map((chat) => ({
      id: chat._id,
      title: chat.title,
      lastActivity: chat.lastActivity,
      user: chat.user,
    })),
  });
}

async function getAllmessages(req, res) {
  const { chatId } = req.params;
  const messages = await messageModel.find({ chat: chatId });
  res.status(200).json({
    message: "messsages fetched successfully",
    messages: messages,
  });
}

module.exports = {
  createChat,
  getAllChats,
  getAllmessages,
};
