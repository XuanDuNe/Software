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
      <div className={styles.nav}> 
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
            <span>{t('nav.welcome', { userId: user.id, role: user.role })}</span>
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