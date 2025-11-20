// src/components/NavBar.jsx

import React, { useState, useEffect } from 'react'; // THAY ĐỔI: Thêm useState, useEffect
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth } from '../utils/auth.js';
import styles from './NavBar.module.css'; 
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js'; // THAY ĐỔI: Import api


function NavBar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [hasUnread, setHasUnread] = useState(false); // THAY ĐỔI: Trạng thái thông báo chưa đọc
  const [userName, setUserName] = useState(user?.email || `User #${user?.id}`);
  
  // NEW: Hàm kiểm tra thông báo chưa đọc
  const checkUnreadNotifications = async () => {
    if (!user?.id || user.role === 'admin') {
        setHasUnread(false);
        return;
    }
    try {
        const notifications = await api.listNotifications(user.id);
        const unreadCount = (notifications || []).filter(n => !n.read_status).length;
        setHasUnread(unreadCount > 0);
    } catch (err) {
        console.error("Failed to fetch unread notifications count:", err);
        setHasUnread(false);
    }
  };
  
  useEffect(() => {
    // 1. Kiểm tra khi component mount
    checkUnreadNotifications();
    
    // 2. Lắng nghe sự kiện tùy chỉnh từ Notifications.jsx (để cập nhật trạng thái chấm đỏ)
    window.addEventListener('unreadCountUpdated', checkUnreadNotifications);

    // 3. Fetch user profile để lấy tên
    const fetchUserName = async () => {
      if (!user?.id) return;
      try {
        if (user.role === 'student') {
          const profile = await api.getStudentProfile();
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
        } else if (user.role === 'provider') {
          const profile = await api.getProviderProfile();
          if (profile) {
            const name = profile.company_name || profile.contact_name;
            if (name) {
              setUserName(name);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUserName();

    // 4. Cleanup listener
    return () => {
        window.removeEventListener('unreadCountUpdated', checkUnreadNotifications);
    };
  }, [user?.id, user?.role]); // Phụ thuộc vào user.id và user.role

  const handleChangeLanguage = () => {
    const newLang = currentLang.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.navbar}> 
      <div className={styles.nav}> 

        <Link to="/" className={styles.logo}>
          EduMatch
        </Link>

{user?.role === 'student' && (
          <>
            <Link to="/student/profile" className={styles.link}>{t('nav.profile')}</Link> 
            {/* THAY ĐỔI: Thêm chấm đỏ vào link Notifications */}
            <Link to="/notifications" className={styles.link}>
                {t('nav.notifications')}
                {hasUnread && <span className={styles.unreadDot}></span>}
            </Link> 
          </>
        )}
{user?.role === 'provider' && (
          <>
            <Link to="/provider/profile" className={styles.link}>{t('nav.profile')}</Link>
            {/* THAY ĐỔI: Thêm chấm đỏ vào link Notifications */}
            <Link to="/notifications" className={styles.link}>
                {t('nav.notifications')}
                {hasUnread && <span className={styles.unreadDot}></span>}
            </Link>
          </>
        )}
      </div>


      <div className={styles.userInfo}> 
        
        <div className={styles.langSwitcher}>
          <button 
            onClick={handleChangeLanguage} 
            title="Change Language"
            className={`${styles.langButton} btn btn-primary btn-sm`}
          >
            {currentLang.startsWith('vi') ? 'EN' : 'VI'}
          </button>
        </div>

        {user ? (
          <>
            <span>{t('nav.welcomeNamed', { name: userName, role: user.role })}</span>
            <button onClick={handleLogout} className="btn btn-primary btn-sm"> 
              {t('common.logout')}
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">{t('common.login')}</Link> 
        )}

      </div>
    </div>
  );
}

export default NavBar;