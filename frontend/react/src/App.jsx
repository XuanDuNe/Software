import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { getStoredUser } from './utils/auth.js';

function App() {
  const user = getStoredUser();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          user?.role === 'student' ? (
            <Navigate to="/student/dashboard" replace />
          ) : user?.role === 'provider' ? (
            <Navigate to="/provider/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


