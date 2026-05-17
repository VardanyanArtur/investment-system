import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import { login as apiLogin } from "../api/auth";

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password });
      console.log(response);
      localStorage.setItem("token", response.token);
      setToken(response.token);
      notification.success({
        message: "Login Successful",
        description: `Welcome back, ${response.user.name}!`,
      });
      navigate("/dashboard");
    } catch (error) {
      alert("ERROR")
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
    notification.info({
      message: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const isAuthenticated = !!token;

  return {
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
