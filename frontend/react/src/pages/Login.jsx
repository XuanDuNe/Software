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
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="card" style={{ width: 360, padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Đăng nhập</h2>
        <div className="form-group">
          <label className="label">Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
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
          <div className="alert-error">{error}</div>
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
    </div>
  );
}

export default Login;