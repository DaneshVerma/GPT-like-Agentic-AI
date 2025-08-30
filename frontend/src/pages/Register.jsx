import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = ({ setUser }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", {
        fullName: { firstName: form.firstName, lastName: form.lastName },
        email: form.email,
        password: form.password,
      });
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold mb-6 text-center text-indigo-700'>
        Register
      </h2>
      {error && (
        <div className='bg-red-100 text-red-700 p-3 mb-4 rounded'>{error}</div>
      )}
      <form className='space-y-4' onSubmit={handleSubmit}>
        <div className='flex gap-4'>
          <input
            type='text'
            placeholder='First Name'
            name='firstName'
            value={form.firstName}
            onChange={handleChange}
            required
            className='flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400'
          />
          <input
            type='text'
            placeholder='Last Name'
            name='lastName'
            value={form.lastName}
            onChange={handleChange}
            required
            className='flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400'
          />
        </div>
        <input
          type='email'
          name='email'
          placeholder='Email'
          value={form.email}
          onChange={handleChange}
          required
          className='w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400'
        />
        <input
          type='password'
          name='password'
          placeholder='Password (min 6 chars)'
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
          className='w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400'
        />
        <button
          type='submit'
          disabled={loading}
          className='w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition'
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;
