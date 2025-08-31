import React, { useEffect, useState } from "react";
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
} from "../store/chatSlice.js";

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleNewChat = async () => {
    let title = window.prompt("Enter chat title:");
    if (!title) return;
    title = title.trim();
    console.log("Creating new chat with title:", title);
    const response = await axios.post(
      "/api/chat",
      { title },
      { withCredentials: true }
    );
    getMessages(response.data.chat.id);
    console.log("Created new chat:", response.data);
    dispatch(
      startNewChat({
        title: response.data.chat.title,
        id: response.data.chat.id,
      })
    );
    setSidebarOpen(false);
  };

  // fetch chats and connect socket
  useEffect(() => {
    axios
      .get("/api/chat", { withCredentials: true })
      .then((response) => {
        console.log("Fetched chats:", response.data);
        dispatch(setChats(response.data.chats));
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
      });

    const connection = io("http://localhost:3000", {
      transports: ["websocket"],
      withCredentials: true,
    });

    connection.on("connect", () => {
      console.log("Socket connected:", connection.id);
    });

    connection.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    connection.on("ai-response", (messagePayload) => {
      dispatch(addAIMessage(activeChatId, messagePayload.content));
      dispatch(sendingFinished());
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: messagePayload.content,
        },
      ]);

      setMessages(newMessages);
    });
    setSocket(connection);
    return () => {
      connection.disconnect();
    };
  }, [dispatch]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    console.log("Sending message:", trimmed);
    if (!trimmed || !activeChatId || isSending) return;
    if (!socket || socket.disconnected) {
      console.error("Socket not connected yet");
      return;
    }

    dispatch(sendingStarted());

    const newMessages = [
      ...messages,
      {
        type: "user",
        content: trimmed,
      },
    ];

    console.log("New messages:", newMessages);

    dispatch(setInput(""));

    // send to server (matches server "ai-message" listener)
    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed,
    });
  };

  const getMessages = async (id) => {
    const response = await axios.get(`/api/chat/messages/${id}`);
    const allMessages = response.data.messages.map((e) => {
      return {
        type: e.role,
        content: e.content,
      };
    });
    console.log(allMessages);

    setMessages(allMessages);
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
            <h1>ChatGPT Clone</h1>
            <p>
              Ask anything. Paste text, brainstorm ideas, or get quick
              explanations. Your chats stay in the sidebar so you can pick up
              where you left off.
            </p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
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
