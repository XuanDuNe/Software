import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth } from '../utils/auth.js';
import styles from './NavBar.module.css'; 

function NavBar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.navbar}> 
      <div className={styles.nav}> 
        <Link to="/" className={styles.link}>Trang chủ</Link> 
        {user?.role === 'student' && (
          <>
            <Link to="/student/dashboard" className={styles.link}>Học sinh</Link> 
            <Link to="/student/profile" className={styles.link}>Hồ sơ</Link> 
            <Link to="/notifications" className={styles.link}>Thông báo</Link> 
            <Link to="/matching" className={styles.link}>Gợi ý</Link> 
          </>
        )}
        {user?.role === 'provider' && (
          <>
            <Link to="/provider/dashboard" className={styles.link}>Nhà cung cấp</Link> 
            <Link to="/notifications" className={styles.link}>Thông báo</Link> 
          </>
        )}
      </div>

      {user && (
        <div className={styles.userInfo}> 
          <span>Xin chào, Người dùng #{user.id} ({user.role})</span>
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