import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import ChatMobileBar from "../components/chat/ChatMobileBar.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import ChatMessages from "../components/chat/ChatMessages.jsx";
import ChatComposer from "../components/chat/ChatComposer.jsx";
import "../components/chat/ChatLayout.css";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/api.js";
import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats,
  addAIMessage,
  addUserMessage,
} from "../store/chatSlice.js";

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingMsg, setStreamingMsg] = useState(""); // 🟢 local streaming state
  const socketRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  // create new chat
  const handleNewChat = async () => {
    const title = window.prompt("Enter chat title:")?.trim();
    if (!title) return;

    const { data } = await axios.post(
      "/api/chat",
      { title },
      { withCredentials: true }
    );

    dispatch(
      startNewChat({
        title: response.data.chat.title,
        id: response.data.chat.id,
      })
    );
    setSidebarOpen(false);
  };

  // fetch chats initially + socket connection (runs once)
  useEffect(() => {
    axios
      .get("/api/chat", { withCredentials: true })
      .then((res) => dispatch(setChats(res.data.chats)))
      .catch((err) => console.error("Error fetching chats:", err));

    const socket = io({
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected"));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    // 🟣 streaming response
    socket.on("ai-response-stream", ({ chat, content, isFinal }) => {
      console.log("Streaming AI response:", { chat, content, isFinal });
      if (chat !== activeChatId) return;
      if (isFinal) return; // skip final flag here

      setStreamingMsg((prev) => prev + content);
      dispatch(sendingFinished()); // stop loading
    });

    // final response
    socket.on("ai-response", ({ chat, content }) => {
      console.log("Final AI response:", { chat, content });
      if (chat !== activeChatId) return;

      dispatch(addAIMessage(chat, content)); // save final to redux
      setStreamingMsg(""); // clear local buffer
    });

    return () => socket.disconnect();
  }, [dispatch, activeChatId]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.error("Socket not connected yet");
      return;
    }

    dispatch(addUserMessage(activeChatId, trimmed));
    dispatch(setInput(""));
    dispatch(sendingStarted());
    setStreamingMsg(""); // clear old buffer before new request

    socket.emit("ai-message", { chat: activeChatId, content: trimmed });
  };

  const getMessages = async (id) => {
    const { data } = await axios.get(`/api/chat/messages/${id}`);
    data.messages.forEach((msg) => {
      if (msg.role === "user") {
        dispatch(addUserMessage(id, msg.content));
      } else {
        dispatch(addAIMessage(id, msg.content));
      }
    });
  };

  return (
    <div className='chat-layout minimal'>
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onNewChat={handleNewChat}
      />

      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />

      <main className='chat-main' role='main'>
        {messages.length === 0 && (
          <div className='chat-welcome' aria-hidden='true'>
            <div className='chip'>Early Preview</div>
            <h1>I'm HeyAroura</h1>
            <p>
              Ask me anything. Paste text, brainstorm ideas, or get quick
              explanations. Your chats stay in the sidebar so you can pick up
              where you left off.
            </p>
            <footer>
              [<i>&copy; Danesh</i>]
            </footer>
          </div>
        )}

        {/* 🟢 Merge normal messages + live streaming buffer */}
        <ChatMessages
          messages={[
            ...messages,
            ...(streamingMsg
              ? [{ id: "stream", role: "ai", content: streamingMsg }]
              : []),
          ]}
          isSending={isSending}
        />

        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>

      {sidebarOpen && (
        <button
          className='sidebar-backdrop'
          aria-label='Close sidebar'
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
