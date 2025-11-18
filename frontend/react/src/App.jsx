import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { getStoredUser } from './utils/auth.js';
import Notifications from './pages/Notifications.jsx';
import Matching from './pages/Matching.jsx';
import Profile from './pages/Profile.jsx';
import NavBar from './components/NavBar.jsx';
import ProviderProfile from './pages/ProviderProfile.jsx';

function App() {
  const user = getStoredUser();

  return (
    <>
    <NavBar />
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/profile" // DÒNG CẬP NHẬT: Route mới
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderProfile />
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
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={["student", "provider"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matching"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Matching />
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
    </>
  );
}

export default App;


