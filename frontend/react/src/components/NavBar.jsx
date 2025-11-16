import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth } from '../utils/auth.js';
import styles from './NavBar.module.css'; 
import { useTranslation } from 'react-i18next';



function NavBar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

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
      {/* PHẦN BÊN TRÁI (NAV LINKS) */}
      <div className={styles.nav}> 
        <Link to="/" className={styles.link}>{t('common.home')}</Link> 
        {user?.role === 'student' && (
          <>
            <Link to="/student/dashboard" className={styles.link}>{t('nav.student')}</Link> 
            <Link to="/student/profile" className={styles.link}>{t('nav.profile')}</Link> 
            <Link to="/notifications" className={styles.link}>{t('nav.notifications')}</Link> 
            <Link to="/matching" className={styles.link}>{t('nav.matching')}</Link> 

          </>
        )}
        {user?.role === 'provider' && (
          <>

            <Link to="/provider/dashboard" className={styles.link}>{t('nav.provider')}</Link> 
            <Link to="/notifications" className={styles.link}>{t('nav.notifications')}</Link> 
          </>
        )}
      </div>


      {/* PHẦN BÊN PHẢI (USER INFO & ACTIONS) */}
      <div className={styles.userInfo}> 
        
        {/* === THAY ĐỔI BẮT ĐẦU TỪ ĐÂY === */}
        {/* 1. Nút chuyển ngôn ngữ được đưa ra ngoài để luôn hiển thị */}
        <div className={styles.langSwitcher}>
          <button 
            onClick={handleChangeLanguage} 
            title="Change Language"
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: '#475569', minWidth: '50px' }} // Đổi màu
          >
            {currentLang.startsWith('vi') ? 'EN' : 'VI'}
          </button>
        </div>

        {/* 2. Hiển thị thông tin user HOẶC nút Login */}
        {user ? (
          // Nếu đã đăng nhập
          <>
            <span>{t('nav.welcome', { userId: user.id, role: user.role })}</span>
            <button onClick={handleLogout} className="btn btn-primary btn-sm"> 
              {t('common.logout')}
            </button>
          </>
        ) : (
          // Nếu ở trang Login (chưa đăng nhập)
          <Link to="/login" className="btn btn-primary btn-sm">{t('common.login')}</Link> 
        )}
        {/* === KẾT THÚC THAY ĐỔI === */}

      </div>
    </div>
  );
}

export default NavBar;