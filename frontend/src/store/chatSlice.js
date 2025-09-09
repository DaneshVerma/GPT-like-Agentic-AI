import { createSlice, nanoid } from "@reduxjs/toolkit";

// helper
const createEmptyChat = (id = nanoid(), title = "New Chat") => ({
  id,
  title,
  messages: [],
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    activeChatId: null,
    isSending: false,
    input: "",
  },
  reducers: {
    ensureInitialChat(state) {
      if (state.chats.length === 0) {
        const chat = createEmptyChat();
        state.chats.unshift(chat);
        state.activeChatId = chat.id;
      }
    },
    startNewChat: {
      reducer(state, action) {
        const { id, title } = action.payload;
        state.chats.unshift(createEmptyChat(id, title));
        state.activeChatId = id;
      },
      prepare({ id = nanoid(), title }) {
        return { payload: { id, title: title || "New Chat" } };
      },
    },
    selectChat(state, action) {
      state.activeChatId = action.payload;
    },
    setInput(state, action) {
      state.input = action.payload;
    },
    sendingStarted(state) {
      state.isSending = true;
    },
    sendingFinished(state) {
      state.isSending = false;
    },
    setChats(state, action) {
      // make sure each chat has messages array
      state.chats = action.payload.map((c) => ({
        ...c,
        messages: c.messages || [],
      }));
    },

    // 🟢 USER MESSAGE
    addUserMessage: {
      reducer(state, action) {
        const { chatId, message } = action.payload;
        let chat = state.chats.find((c) => c.id === chatId);

        // auto-create chat if missing
        if (!chat) {
          chat = createEmptyChat(chatId);
          state.chats.unshift(chat);
        }

        if (chat.messages.length === 0) {
          chat.title =
            message.content.slice(0, 40) +
            (message.content.length > 40 ? "…" : "");
        }

        chat.messages.push(message);
      },
      prepare(chatId, content) {
        return {
          payload: {
            chatId,
            message: { id: nanoid(), role: "user", content, ts: Date.now() },
          },
        };
      },
    },

    // 🟣 AI MESSAGE
    addAIMessage: {
      reducer(state, action) {
        const { chatId, message } = action.payload;
        let chat = state.chats.find((c) => c.id === chatId);

        // auto-create chat if missing
        if (!chat) {
          chat = createEmptyChat(chatId);
          state.chats.unshift(chat);
        }

        if (chat.messages.length === 0) {
          chat.title =
            message.content.slice(0, 40) +
            (message.content.length > 40 ? "…" : "");
        }

        chat.messages.push(message);
      },
      prepare(chatId, content, error = false) {
        return {
          payload: {
            chatId,
            message: {
              id: nanoid(),
              role: "ai",
              content,
              ts: Date.now(),
              ...(error ? { error: true } : {}),
            },
          },
        };
      },
    },

    // ✍️ Update last AI message (for streaming)
    updateLastAIMessage(state, action) {
      const { chatId, content } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat || chat.messages.length === 0) return;

      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.role === "ai" && !lastMessage.error) {
        lastMessage.content += content;
      }
    },
    clearMessages: {
      reducer(state, action) {
        const chat = state.chats.find((c) => c.id === action.payload);
        if (chat) chat.messages = [];
      },
    },
  },
});

export const {
  ensureInitialChat,
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  updateLastAIMessage,
  setChats,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
