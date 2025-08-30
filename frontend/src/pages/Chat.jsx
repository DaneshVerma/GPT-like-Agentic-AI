import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const Chat = ({ user }) => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Connect to socket server
    socketRef.current = io({
      transports: ["websocket"],
      withCredentials: true, // ensure credentials sent (cookies)
    });

    socketRef.current.on("connect", () => {
      setSocketConnected(true);
      console.log("Socket connected", socketRef.current.id);
    });

    socketRef.current.on("ai-response", (payload) => {
      if (payload.chat === chatId) {
        setMessages((prev) => [
          ...prev,
          { content: payload.content, role: "model", _id: Date.now() },
        ]);
      }
    });

    return () => {
      socketRef.current.disconnect();
      setSocketConnected(false);
    };
  }, [user, chatId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      content: input,
      role: "user",
      _id: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    socketRef.current.emit("ai-message", { chat: chatId, content: input });
    setInput("");
  };

  if (!user) {
    return (
      <div className='text-center py-20'>Please login to view this chat.</div>
    );
  }

  return (
    <div className='flex flex-col max-w-3xl mx-auto h-[80vh] border border-gray-300 rounded-lg overflow-hidden'>
      <header className='bg-indigo-600 text-white px-4 py-3 font-semibold'>
        Chat - {chatId}
      </header>
      <section className='flex-1 overflow-y-auto p-4 space-y-3 bg-white'>
        {messages.length === 0 && (
          <p className='text-gray-400 text-center mt-8'>
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-[70%] p-3 rounded-lg ${
              msg.role === "user"
                ? "bg-indigo-100 self-end text-indigo-900"
                : "bg-gray-200 self-start"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </section>
      <footer className='p-4 bg-gray-100 flex gap-2'>
        <input
          type='text'
          value={input}
          placeholder={
            socketConnected ? "Type your message..." : "Connecting to server..."
          }
          disabled={!socketConnected}
          onChange={(e) => setInput(e.target.value)}
          className='flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400'
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!socketConnected || !input.trim()}
          className='bg-indigo-600 text-white px-4 rounded disabled:bg-indigo-300'
        >
          Send
        </button>
      </footer>
    </div>
  );
};

export default Chat;
