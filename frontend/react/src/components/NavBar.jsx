import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth } from '../utils/auth.js'; // Import clearAuth

function NavBar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <div className="navbar">
      <div className="navbar-nav">
        <Link to="/" className="navbar-link">Trang chủ</Link>
        {user?.role === 'student' && (
          <>
            <Link to="/student/dashboard" className="navbar-link">Student</Link>
            <Link to="/notifications" className="navbar-link">Thông báo</Link>
            <Link to="/matching" className="navbar-link">Gợi ý</Link>
          </>
        )}
        {user?.role === 'provider' && (
          <>
            <Link to="/provider/dashboard" className="navbar-link">Provider</Link>
            <Link to="/notifications" className="navbar-link">Thông báo</Link>
          </>
        )}
      </div>

      {user && (
        <div className="navbar-user-info">
          {/* Hiển thị ID người dùng */}
          <span>Xin chào, User #{user.id} ({user.role})</span>
          {/* Nút Đăng xuất */}
          <button onClick={handleLogout} className="btn btn-primary btn-sm">
            Đăng xuất
          </button>
        </div>
      )}
      {!user && (
        <Link to="/login" className="btn btn-primary btn-sm">Đăng nhập</Link>
      )}
    </div>
  );
}

export default NavBar;