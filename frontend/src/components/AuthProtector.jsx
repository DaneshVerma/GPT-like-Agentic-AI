import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../api/api.js";

const AuthProtector = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Call backend API to verify token cookie
    axios
      .get("/api/auth/validate", { withCredentials: true })
      .then(() => {
        setAuthenticated(true);
      })
      .catch(() => {
        setAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!authenticated) {
    return <Navigate to='/login' replace />;
  }

  return children;
};

export default AuthProtector;
