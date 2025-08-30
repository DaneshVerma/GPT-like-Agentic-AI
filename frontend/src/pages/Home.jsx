import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import ChatMobileBar from "../components/chat/ChatMobileBar.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import ChatMessages from "../components/chat/ChatMessages.jsx";
import ChatComposer from "../components/chat/ChatComposer.jsx";
import "../components/chat/ChatLayout.css";
import { fakeAIReply } from "../components/chat/aiClient.js";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  ensureInitialChat,
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats,
} from "../store/chatSlice.js";

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [socket, setSocket] = useState(null);

  const [messages, setMessages] = useState([
    // {
    //   type: 'user',
    //   content: 'Hello, how can I help you today?'
    // },
    // {
    //   type: 'ai',
    //   content: 'Hi there! I need assistance with my account.'
    // }
  ]);

  const handleNewChat = async () => {
    let title = window.prompt("Enter chat title:");
    if (!title) return;
    title = title.trim();
    console.log("Creating new chat with title:", title);
    const response = await axios.post(
      "http://localhost:3000/api/chat",
      {
        title,
      },
      {
        withCredentials: true,
      }
    );
    console.log("Created new chat:", response.data);
    dispatch(startNewChat({ title: response.data.chat.title, id: response.data.chat.id }));
    setSidebarOpen(false);
  };

  //fatching chats
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/chat", { withCredentials: true })
      .then((response) => {
        console.log("Fetched chats:", response.data);
        dispatch(setChats(response.data.chats));
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
      });
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    console.log("Sending message:", trimmed);
    if (!trimmed || !activeChatId || isSending) return;
    dispatch(sendingStarted());

    const newMessages = [
      ...messages,
      {
        type: "user",
        content: trimmed,
      },
    ];

    console.log("New messages:", newMessages);

    setMessages(newMessages);
    dispatch(setInput(""));

    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed,
    });

    // try {
    //   const reply = await fakeAIReply(trimmed);
    //   dispatch(addAIMessage(activeChatId, reply));
    // } catch {
    //   dispatch(addAIMessage(activeChatId, 'Error fetching AI response.', true));
    // } finally {
    //   dispatch(sendingFinished());
    // }
  };

  const getMessages = async (chatId) => {
    const response = await axios.get(`h/api/chat/messages/${chatId}`, {
      withCredentials: true,
    });

    console.log("Fetched messages:", response.data.messages);

    setMessages(
      response.data.messages.map((m) => ({
        type: m.role === "user" ? "user" : "ai",
        content: m.content,
      }))
    );
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
