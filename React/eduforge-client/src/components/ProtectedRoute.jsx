// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, role }) => {
  const user = getStoredUser();

  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
