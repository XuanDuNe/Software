import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { clearAuth, getStoredUser } from '../utils/auth.js';

function ProviderDashboard() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getProviderInfo();
        if (mounted) setInfo(data);
      } catch (err) {
        if (mounted) setError(err.message || 'Lỗi tải dữ liệu');
      }
    })();
    return () => { mounted = false; };
  }, []);

  function logout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  const user = getStoredUser();

  return (
    <div style={{ padding: 24 }}>
      <h2>Trang nhà cung cấp</h2>
      <div style={{ marginBottom: 12 }}>Xin chào, {user?.id ? `User #${user.id}` : 'Nhà cung cấp'}</div>
      <button onClick={logout} style={{ marginBottom: 16 }}>Đăng xuất</button>
      {error && <div style={{ color: '#c0392b' }}>{error}</div>}
      {info ? (
        <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>{JSON.stringify(info, null, 2)}</pre>
      ) : (
        <div>Đang tải thông tin...</div>
      )}
    </div>
  );
}

export default ProviderDashboard;


