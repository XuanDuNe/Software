import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { storeAuth } from '../utils/auth.js';
import styles from './Login.module.css'; 
import { useTranslation } from 'react-i18next';


function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email: username, password });
      const token = data?.access_token;
      if (!token) throw new Error(t('loginPage.error_invalid_response'));

      const verified = await api.verifyToken(token);
      const user = {
        id: verified?.user_id,
        role: verified?.role,
        email: verified?.email
      };

      storeAuth(token, user);

      if (user.role === 'student') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('loginPage.error_login_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    
    // Validation
    if (regPassword.length < 8) {
      setError(t('loginPage.error_pw_length'));
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setError(t('loginPage.error_pw_mismatch'));
      return;
    }
    
    if (!regRole) {
      setError(t('loginPage.error_no_role'));
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.register({
        email: regEmail,
        password: regPassword,
        role: regRole
      });
      
      const token = data?.access_token;
      if (!token) throw new Error(t('loginPage.error_invalid_response'));

      const verified = await api.verifyToken(token);
      const user = {
        id: verified?.user_id,
        role: verified?.role,
        email: verified?.email
      };

      storeAuth(token, user);

      if (user.role === 'student') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('loginPage.error_register_failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}> 
      <div className={styles.card}> 
        {/* Tabs */}
        <div className={styles.tabContainer}> 
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`${styles.tabButton} ${!isRegister ? styles.tabButtonActive : ''}`} 
          >
            {/* 3. Thay thế string */}
            {t('common.login')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`${styles.tabButton} ${isRegister ? styles.tabButtonActive : ''}`} 
          >
            {/* 3. Thay thế string */}
            {t('common.register')}
          </button>
        </div>

        <div className={styles.formContainer}> 
          {!isRegister ? (
            // Login Form
            <form onSubmit={handleLogin}>
              <h2 className={styles.title}>{t('loginPage.loginTitle')}</h2> 
              <div className="form-group">
                <label className="label">{t('common.email')}</label>

                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('loginPage.emailPlaceholder')}
                  className="input" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">{t('common.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('loginPage.passwordPlaceholder')}
                  className="input" 
                  required
                />
              </div>
              {error && (
                <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div> 
              )}
              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary ${styles.submitButton}`} 
              >
                {loading ? t('loginPage.loginButtonLoading') : t('loginPage.loginButton')}
              </button>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegister}>
              <h2 className={styles.title}>{t('loginPage.registerTitle')}</h2> 
              <div className="form-group">
                <label className="label">{t('common.email')}</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder={t('loginPage.emailPlaceholder')}
                  className="input" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">{t('loginPage.passwordMinLength')}</label>

                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder={t('loginPage.passwordPlaceholder')}
                  className="input" 
                  required
                  minLength={8}
                />
                {regPassword && regPassword.length < 8 && (
                  <small className={styles.errorText}> 
                    {t('loginPage.error_pw_length')}

                  </small>
                )}
              </div>


              <div className="form-group">
                <label className="label">{t('loginPage.confirmPassword')}</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}

                  placeholder={t('loginPage.passwordPlaceholder')}

                  className="input" 
                  required
                />
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <small className={styles.errorText}> 
                    {t('loginPage.error_pw_mismatch')}

                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="label">{t('loginPage.role')}</label>

                <div className={styles.roleContainer}> 
                  <button
                    type="button"
                    onClick={() => setRegRole('student')}
                    className={`${styles.roleButton} ${regRole === 'student' ? styles.roleButtonActive : ''}`} 
                  >
                    {t('loginPage.role_student')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('provider')}
                    className={`${styles.roleButton} ${regRole === 'provider' ? styles.roleButtonActive : ''}`} 
                  >
                    {t('loginPage.role_provider')}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div> 
              )}

              <div className={styles.infoBox}>
                {t('loginPage.adminNotice')}
              </div>

              <button
                type="submit"
                disabled={loading || regPassword.length < 8 || regPassword !== regConfirmPassword}
                className={`btn btn-primary ${
                  (regPassword.length < 8 || regPassword !== regConfirmPassword) 
                    ? styles.submitButtonDisabled 
                    : styles.submitButton
                }`} 
              >
                {loading ? t('loginPage.registerButtonLoading') : t('loginPage.registerButton')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;