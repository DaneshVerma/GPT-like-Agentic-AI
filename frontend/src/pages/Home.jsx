import React from "react";
import { Link } from "react-router-dom";

const Home = () => (
  <div className='text-center py-16 max-w-lg mx-auto'>
    <h1 className='text-4xl font-extrabold mb-4 text-indigo-700'>
      Welcome to the Chat App
    </h1>
    <p className='mb-8 text-gray-600'>
      AI powered real-time chat app. Please login or register to create chats
      and start messaging.
    </p>
    <div className='flex justify-center gap-4'>
      <Link
        to='/login'
        className='px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition'
      >
        Login
      </Link>
      <Link
        to='/register'
        className='px-6 py-3 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-100 transition'
      >
        Register
      </Link>
    </div>
  </div>
);

export default Home;
