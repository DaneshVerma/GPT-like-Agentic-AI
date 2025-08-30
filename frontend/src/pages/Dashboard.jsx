import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    // Implement an endpoint or GET /api/chat to fetch user's chats
    // For now, skip or assume chat list is empty
    // You can implement it in backend to get chats for logged in user
  };

  const createChat = async () => {
    setError("");
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/chat",
        { title },
        { withCredentials: true }
      );
      setTitle("");
      setChats((prev) => [...prev, res.data.chat]);
      navigate(`/chat/${res.data.chat.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-xl mx-auto'>
      <h2 className='text-2xl font-bold text-indigo-700 mb-6'>Your Chats</h2>
      <div className='mb-4 flex gap-2'>
        <input
          type='text'
          className='flex-grow border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400'
          placeholder='New chat title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={createChat}
          disabled={loading}
          className='bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition'
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
      {error && <div className='text-red-600 mb-4'>{error}</div>}

      {chats.length === 0 ? (
        <p className='text-gray-600'>No chats yet. Create one to start!</p>
      ) : (
        <ul>
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                to={`/chat/${chat.id}`}
                className='block p-3 mb-2 rounded border border-gray-300 hover:bg-indigo-50 transition'
              >
                {chat.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
