import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';

function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) return;
        const list = await api.listNotifications(user.id);
        if (mounted) setItems(list || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Lỗi tải thông báo');
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function markRead(id) {
    try {
      await api.markNotificationRead(id);
      const user = getStoredUser();
      const list = await api.listNotifications(user.id);
      setItems(list || []);
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Thông báo</h2>
      {error && <div style={{ color: '#c0392b' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {(items || []).map(n => (
          <div key={n.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div>{n.content}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(n.created_at).toLocaleString()}</div>
            <div style={{ marginTop: 8 }}>
              {!n.read_status && <button onClick={() => markRead(n.id)}>Đánh dấu đã đọc</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;


