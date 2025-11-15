import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { storeAuth } from '../utils/auth.js';
import styles from './Login.module.css'; 

function Login() {
  const navigate = useNavigate();
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
      if (!token) throw new Error('Phản hồi không hợp lệ');

      const verified = await api.verifyToken(token);
      const user = {
        id: verified?.user_id,
        role: verified?.role
      };

      storeAuth(token, user);

      if (user.role === 'student') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    
    // Validation
    if (regPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (!regRole) {
      setError('Vui lòng chọn vai trò');
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
      if (!token) throw new Error('Phản hồi không hợp lệ');

      const verified = await api.verifyToken(token);
      const user = {
        id: verified?.user_id,
        role: verified?.role
      };

      storeAuth(token, user);

      if (user.role === 'student') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
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
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`${styles.tabButton} ${isRegister ? styles.tabButtonActive : ''}`} 
          >
            Đăng ký
          </button>
        </div>

        <div className={styles.formContainer}> 
          {!isRegister ? (
            // Login Form
            <form onSubmit={handleLogin}>
              <h2 className={styles.title}>Đăng nhập</h2> 
              <div className="form-group"> {}
                <label className="label">Email</label> {}
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your@email.com"
                  className="input" 
                  required
                />
              </div>
              <div className="form-group"> {}
                <label className="label">Mật khẩu</label> {}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegister}>
              <h2 className={styles.title}>Đăng ký tài khoản</h2> 
              
              <div className="form-group"> {}
                <label className="label">Email</label> {}
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input" 
                  required
                />
              </div>

              <div className="form-group"> {}
                <label className="label">Mật khẩu (tối thiểu 8 ký tự)</label> {}
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input" 
                  required
                  minLength={8}
                />
                {regPassword && regPassword.length < 8 && (
                  <small className={styles.errorText}> 
                    Mật khẩu phải có ít nhất 8 ký tự
                  </small>
                )}
              </div>

              <div className="form-group"> {}
                <label className="label">Xác nhận mật khẩu</label> {}
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input" 
                  required
                />
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <small className={styles.errorText}> 
                    Mật khẩu xác nhận không khớp
                  </small>
                )}
              </div>

              <div className="form-group"> {}
                <label className="label">Vai trò</label> {}
                <div className={styles.roleContainer}> 
                  <button
                    type="button"
                    onClick={() => setRegRole('student')}
                    className={`${styles.roleButton} ${regRole === 'student' ? styles.roleButtonActive : ''}`} 
                  >
                    👨‍🎓 Sinh viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('provider')}
                    className={`${styles.roleButton} ${regRole === 'provider' ? styles.roleButtonActive : ''}`} 
                  >
                    🏢 Nhà cung cấp
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div> 
              )}

              <button
                type="submit"
                disabled={loading || regPassword.length < 8 || regPassword !== regConfirmPassword}
                className={`btn btn-primary ${
                  (regPassword.length < 8 || regPassword !== regConfirmPassword) 
                    ? styles.submitButtonDisabled 
                    : styles.submitButton
                }`} 
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;