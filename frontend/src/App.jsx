import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

const App = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check if user logged in by calling an auth check endpoint or decode cookie token via backend
  // Here simple call to get user info - you may create /api/auth/me backend endpoint for this
  // For demo, just checking login success on app start is skipped, assume login sets cookie

  // Logout handler
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout"); // Implement logout route to clear cookie on backend if needed
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  // Optional: on mount, you can implement user info fetch to auto detect logged in user

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col'>
      <nav className='bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-10'>
        <Link to='/' className='font-bold text-xl text-indigo-600'>
          ChatGPT App
        </Link>
        <div className='space-x-4'>
          {user ? (
            <>
              <span className='text-gray-700'>{user.fullName?.firstName}</span>
              <button
                onClick={logout}
                className='text-indigo-600 hover:text-indigo-800 font-semibold'
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to='/login'
                className='text-indigo-600 hover:text-indigo-800 font-semibold'
              >
                Login
              </Link>
              <Link
                to='/register'
                className='text-indigo-600 hover:text-indigo-800 font-semibold'
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className='flex-1 container mx-auto px-4 py-6'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/register' element={<Register setUser={setUser} />} />
          <Route path='/login' element={<Login setUser={setUser} />} />
          <Route path='/dashboard' element={<Dashboard user={user} />} />
          <Route path='/chat/:chatId' element={<Chat user={user} />} />
          <Route
            path='*'
            element={<h2 className='text-center'>Page Not Found</h2>}
          />
        </Routes>
      </main>
    </div>
  );
};
export default App;
