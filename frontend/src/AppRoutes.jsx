import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AuthProtector from "./components/AuthProtector";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={
            <AuthProtector>
              <Home />
            </AuthProtector>
          }
        />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
