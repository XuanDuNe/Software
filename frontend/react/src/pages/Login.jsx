import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { storeAuth } from '../utils/auth.js';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email: username, password });
      const token = data?.access_token;
      if (!token) throw new Error('Phản hồi không hợp lệ');

      // Verify token to get role and user_id
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f7fb'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 360, padding: 24, borderRadius: 12, background: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Đăng nhập</h2>
        <div style={{ marginBottom: 12 }}>
          <label>Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            style={{ width: '100%', padding: 10, marginTop: 6 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: 10, marginTop: 6 }}
            required
          />
        </div>
        {error && (
          <div style={{ color: '#c0392b', marginBottom: 12 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, border: 0, background: '#2563eb', color: '#fff', borderRadius: 8 }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}

export default Login;


