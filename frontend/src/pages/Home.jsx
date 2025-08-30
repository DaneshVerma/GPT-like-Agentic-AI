import React, { useState } from "react";
import ChatMobileBar from "../components/chat/ChatMobileBar.jsx";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import ChatMessages from "../components/chat/ChatMessages.jsx";
import ChatComposer from "../components/chat/ChatComposer.jsx";
import "../components/chat/ChatLayout.css";

const Home = () => {
  // Local state only (no Redux, no API)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([
    { id: 1, title: "Sample Chat 1" },
    { id: 2, title: "Test Chat 2" },
  ]);
  const [activeChatId, setActiveChatId] = useState(
    chats.length > 0 ? chats[0].id : null
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    { type: "ai", content: "Hi there! How can I help?" },
  ]); // Find active chat object from chats list

  const activeChat = chats.find((c) => c.id === activeChatId) || null; // Handle new chat creation locally

  const handleNewChat = () => {
    let title = window.prompt("Enter a title for the new chat:", "");
    if (title) title = title.trim();
    if (!title) return;
    const newId = Date.now();
    const newChat = { id: newId, title };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
    setSidebarOpen(false);
    setMessages([]);
  }; // Handle sending user message

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;
    setIsSending(true);

    setMessages([...messages, { type: "user", content: trimmed }]);
    setInput(""); // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "AI reply to: " + trimmed },
      ]);
      setIsSending(false);
    }, 600);
  }; // Simulate fetching messages for a chat

  const getMessages = (chatId) => {
    setMessages([
      {
        type: "ai",
        content:
          "Welcome to " + (chats.find((c) => c.id === chatId)?.title || "Chat"),
      },
    ]);
  };

  return (
    <div className='chat-layout minimal'>
           {" "}
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onNewChat={handleNewChat}
      />
           {" "}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
           {" "}
      <main className='chat-main' role='main'>
               {" "}
        {messages.length === 0 && (
          <div className='chat-welcome' aria-hidden='true'>
                        <div className='chip'>Early Preview</div>           {" "}
            <h1>ChatGPT Clone</h1>           {" "}
            <p>
                            Ask anything. Paste text, brainstorm ideas, or get
              quick               explanations. Your chats stay in the sidebar
              so you can pick up               where you left off.            {" "}
            </p>
                     {" "}
          </div>
        )}
                <ChatMessages messages={messages} isSending={isSending} />     
         {" "}
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
             {" "}
      </main>
           {" "}
      {sidebarOpen && (
        <button
          className='sidebar-backdrop'
          aria-label='Close sidebar'
          onClick={() => setSidebarOpen(false)}
        />
      )}
         {" "}
    </div>
  );
};

export default Home;
