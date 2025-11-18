import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser, getToken } from '../utils/auth.js';

function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;


