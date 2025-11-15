import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Notifications.module.css'; 

function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const setSafeItems = (list) => {
    setItems(Array.isArray(list) ? list : []);
  };
    
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) return;
        const list = await api.listNotifications(user.id);
        if (mounted) setSafeItems(list); 
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
      setSafeItems(list); 
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật');
    }
  }

  return (
    <div className="container p-6"> {}
      <h2>Thông báo</h2>
      {error && <div className="alert-error">{error}</div>} 
      <div className="grid gap-4"> {}
        {(Array.isArray(items) ? items : []).map(n => ( 
          <div key={n.id} className={styles.item}> 
            <div>{n.content}</div>
            <div className={styles.date}>{new Date(n.created_at).toLocaleString()}</div> 
            <div className={styles.action}> 
              {!n.read_status && (
                <button 
                  onClick={() => markRead(n.id)} 
                  className="btn btn-primary btn-sm" 
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;