import React from "react";
import { Navigate } from "react-router-dom";

// Mock authentication check
const isAuthenticated = () => {
  return localStorage.getItem("token") !== null; // Assuming token is stored in localStorage
};

const ProtectedRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
