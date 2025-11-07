import React from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser, clearAuth } from '../utils/auth.js';

function NavBar() {
  const user = getStoredUser();
  return (
    <div style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #e5e7eb' }}>
      <Link to="/">Trang chủ</Link>
      {user?.role === 'student' && (
        <>
          <Link to="/student/dashboard">Student</Link>
          <Link to="/notifications">Thông báo</Link>
          <Link to="/matching">Gợi ý</Link>
        </>
      )}
      {user?.role === 'provider' && (
        <>
          <Link to="/provider/dashboard">Provider</Link>
          <Link to="/notifications">Thông báo</Link>
        </>
      )}
    </div>
  );
}

export default NavBar;


