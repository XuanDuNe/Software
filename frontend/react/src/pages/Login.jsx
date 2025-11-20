import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { storeAuth } from '../utils/auth.js';
import styles from './Login.module.css'; 
import { useTranslation } from 'react-i18next';


async function seedProfileEmail(userInfo) {
  if (!userInfo?.email) return;
  try {
    if (userInfo.role === 'student') {
      await api.updateStudentProfile({ email: userInfo.email });
    } else if (userInfo.role === 'provider') {
      await api.updateProviderProfile({ email: userInfo.email });
    }
  } catch (err) {
    console.error('Failed to seed profile email', err);
  }
}

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
  
  // OTP state
  const [otpStep, setOtpStep] = useState('form'); // 'form', 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      await seedProfileEmail(user);

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

  async function handleSendOTP(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
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
      await api.sendOTP({
        email: regEmail,
        role: regRole
      });
      
      setOtpSent(true);
      setOtpStep('otp');
      setSuccessMessage(t('loginPage.otp_sent_message', { email: regEmail }));
    } catch (err) {
      setError(err.message || t('loginPage.error_send_otp_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!otpCode || otpCode.length !== 6) {
      setError(t('loginPage.error_otp_invalid'));
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.verifyOTPAndRegister({
        email: regEmail,
        otp_code: otpCode,
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
      await seedProfileEmail(user);

      if (user.role === 'student') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('loginPage.error_verify_otp_failed'));
    } finally {
      setLoading(false);
    }
  }

  function handleBackToForm() {
    setOtpStep('form');
    setOtpCode('');
    setOtpSent(false);
    setError('');
    setSuccessMessage('');
  }

  async function handleResendOTP() {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await api.sendOTP({
        email: regEmail,
        role: regRole
      });
      setSuccessMessage(t('loginPage.otp_sent_message', { email: regEmail }));
    } catch (err) {
      setError(err.message || t('loginPage.error_send_otp_failed'));
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
              setOtpStep('form');
              setOtpCode('');
              setOtpSent(false);
              setSuccessMessage('');
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
          ) : otpStep === 'form' ? (
            // Register Form - Step 1: Enter details
            <form onSubmit={handleSendOTP}>
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
                {loading ? t('loginPage.sendingOTP') : t('loginPage.sendOTP')}
              </button>
            </form>
          ) : (
            // OTP Verification Form - Step 2: Enter OTP
            <form onSubmit={handleVerifyOTP}>
              <h2 className={styles.title}>{t('loginPage.verifyOTPTitle')}</h2>
              
              {successMessage && (
                <div className="alert-success" style={{ marginBottom: 16 }}>
                  {successMessage}
                </div>
              )}
              
              <div className="form-group">
                <label className="label">{t('loginPage.otpCode')}</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(value);
                  }}
                  placeholder={t('loginPage.otpPlaceholder')}
                  className="input"
                  required
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                />
                <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                  {t('loginPage.otpHint')}
                </small>
              </div>

              {error && (
                <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleBackToForm}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  {t('loginPage.back')}
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className={`btn btn-primary ${styles.submitButton}`}
                  style={{ flex: 1 }}
                >
                  {loading ? t('loginPage.verifying') : t('loginPage.verifyAndRegister')}
                </button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: loading ? 'not-allowed' : 'pointer', textDecoration: 'underline', opacity: loading ? 0.6 : 1 }}
                >
                  {t('loginPage.resendOTP')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;