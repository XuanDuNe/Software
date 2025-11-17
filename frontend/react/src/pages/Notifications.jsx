import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Notifications.module.css'; 
import { useTranslation } from 'react-i18next';

const translateDynamicNotification = (content, t) => {
    const statusUpdateMatch = content.match(/Trạng thái hồ sơ của bạn cho '([^']*)' đã được cập nhật: (.*)/);
    if (statusUpdateMatch) {
        const title = statusUpdateMatch[1];
        const statusRaw = statusUpdateMatch[2].trim();
        
        const statusKey = `studentDashboardPage.status_${statusRaw}`;
        const translatedStatus = t(statusKey, statusRaw); 
        
        return t('notificationsPage.app_status_update_template', { title, status: translatedStatus });
    }

    const newAppMatch = content.match(/Bạn có hồ sơ ứng tuyển mới cho cơ hội '([^']*)'\./);
    if (newAppMatch) {
        const title = newAppMatch[1];
        return t('notificationsPage.new_application_template', { title });
    }

    return t(content, content); 
};


function Notifications() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const setSafeItems = (list) => {
    const sortedList = (list || []).sort((a, b) => {
        if (!a.read_status && b.read_status) return -1;
        if (a.read_status && !b.read_status) return 1;
        return new Date(b.created_at) - new Date(a.created_at); 
    });
    setItems(sortedList);
  };
    
  async function fetchNotifications() {
    try {
        const user = getStoredUser();
        if (!user?.id) return;
        const list = await api.listNotifications(user.id);
        setSafeItems(list); 
        window.dispatchEvent(new Event('unreadCountUpdated'));

    } catch (err) {
        setError(err.message || t('notificationsPage.loadError'));
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchNotifications();
    return () => { mounted = false; };
  }, [t]); 

  async function markAsRead(id) { 
    try {
      setItems(prevItems => 
          prevItems.map(n => n.id === id ? { ...n, read_status: true } : n)
      );
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      setError(err.message || t('notificationsPage.updateError'));
    }
  }
  
  async function handleItemClick(n) {
    if (!n.read_status) {
        await markAsRead(n.id);
    }
    
    if (n.link_url) {
        window.location.href = n.link_url; 
    }
  }
  
  async function markAllAsRead() {
    setError('');
    const unreadItems = items.filter(n => !n.read_status);
    
    setItems(prevItems => prevItems.map(n => ({ ...n, read_status: true })));

    if (unreadItems.length === 0) return;
    
    try {
        await Promise.all(unreadItems.map(n => api.markNotificationRead(n.id)));
        fetchNotifications();
    } catch (err) {
        setError(err.message || t('notificationsPage.updateError'));
        fetchNotifications(); 
    }
  }
  
  const hasUnreadNotifications = items.some(n => !n.read_status);

  return (
    <div className="container p-6">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h2 style={{margin: 0}}>{t('notificationsPage.title')}</h2>
        {hasUnreadNotifications && (
            <button 
                onClick={markAllAsRead} 
                className="btn btn-primary btn-sm"
            >
                {t('notificationsPage.markAllRead')}
            </button>
        )}
      </div>
      {error && <div className="alert-error">{error}</div>} 
      <div className="grid gap-4">

        {(Array.isArray(items) ? items : []).map(n => ( 
          <div 
            key={n.id} 
            className={`${styles.item} ${!n.read_status ? styles.unread : ''}`} 
            onClick={() => handleItemClick(n)}
          > 
            {!n.read_status && <div className={styles.unreadDot}></div>}
            
            <div className={styles.itemContent}> 
                <div style={{fontWeight: !n.read_status ? '600' : 'normal'}}>
                    {translateDynamicNotification(n.content, t)}
                </div>
                <div className={styles.date}>{new Date(n.created_at).toLocaleString()}</div> 
            </div>
          </div>
        ))}
        
        {items.length === 0 && !error && !hasUnreadNotifications && (
            <div className="card" style={{ textAlign: 'center', color: '#64748b' }}>
                {t('notificationsPage.noNotifications')}
            </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;