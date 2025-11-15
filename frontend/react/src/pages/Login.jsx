import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { storeAuth } from '../utils/auth.js';

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="card" style={{ width: 420, padding: 0, overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '16px',
              background: isRegister ? 'transparent' : '#2563eb',
              color: isRegister ? '#64748b' : '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 16,
              transition: 'all 0.2s'
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '16px',
              background: isRegister ? '#2563eb' : 'transparent',
              color: isRegister ? '#fff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 16,
              transition: 'all 0.2s'
            }}
          >
            Đăng ký
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {!isRegister ? (
            // Login Form
            <form onSubmit={handleLogin}>
              <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 24 }}>Đăng nhập</h2>
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Mật khẩu</label>
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
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegister}>
              <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 24 }}>Đăng ký tài khoản</h2>
              
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Mật khẩu (tối thiểu 8 ký tự)</label>
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
                  <small style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                    Mật khẩu phải có ít nhất 8 ký tự
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="label">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  required
                />
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <small style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                    Mật khẩu xác nhận không khớp
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="label">Vai trò</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRegRole('student')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: regRole === 'student' ? '#2563eb' : '#f1f5f9',
                      color: regRole === 'student' ? '#fff' : '#1f2937',
                      border: `2px solid ${regRole === 'student' ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      transition: 'all 0.2s'
                    }}
                  >
                    👨‍🎓 Sinh viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('provider')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: regRole === 'provider' ? '#2563eb' : '#f1f5f9',
                      color: regRole === 'provider' ? '#fff' : '#1f2937',
                      border: `2px solid ${regRole === 'provider' ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      transition: 'all 0.2s'
                    }}
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
                className="btn btn-primary"
                style={{ 
                  width: '100%',
                  opacity: (regPassword.length < 8 || regPassword !== regConfirmPassword) ? 0.6 : 1,
                  cursor: (regPassword.length < 8 || regPassword !== regConfirmPassword) ? 'not-allowed' : 'pointer'
                }}
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