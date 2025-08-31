const express = require("express");
const authUserMiddleware = require("../middleware/auth.middleware");
const ChatController = require("../controllers/chat.controller");
const router = express.Router();

router.post("/", authUserMiddleware, ChatController.createChat);

router.get("/", authUserMiddleware, ChatController.getAllChats);

router.get("/messages/:chatId", authUserMiddleware, ChatController.getAllmessages);

module.exports = router;
