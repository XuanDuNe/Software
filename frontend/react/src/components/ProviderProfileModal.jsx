import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import styles from './ProviderProfileModal.module.css'; 

function ProviderProfileModal({ providerId, onClose }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!providerId) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    
    api.getProviderProfileById(providerId)
      .then(data => {
        setProfile(data);
      })
      .catch(err => {
        console.error("Failed to fetch provider profile:", err);
        setError(t('providerProfileModal.errorFetch'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [providerId, t]); // Tái tải khi providerId thay đổi

  if (!providerId) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <h2 className={styles.title}>{t('providerProfileModal.title')}</h2>
        
        {loading && <p>{t('common.loading')}</p>}
        {error && <p className={styles.error}>{error}</p>}
        
        {profile && (
          <div className={styles.profileDetails}>
            <div className={styles.detailItem}>
              <strong>{t('providerProfileModal.companyName')}:</strong> {profile.company_name}
            </div>
            <div className={styles.detailItem}>
              <strong>{t('providerProfileModal.contactName')}:</strong> {profile.contact_name || t('common.notAvailable')}
            </div>
            <div className={styles.detailItem}>
              <strong>{t('common.email')}:</strong> {profile.email || t('common.notAvailable')}
            </div>
            <div className={styles.detailItem}>
              <strong>{t('providerProfileModal.phone')}:</strong> {profile.phone || t('common.notAvailable')}
            </div>
            <div className={styles.detailItem}>
              <strong>{t('providerProfileModal.website')}:</strong> 
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a>
              ) : t('common.notAvailable')}
            </div>
            <div className={styles.detailItem}>
              <strong>{t('providerProfileModal.description')}:</strong> 
              <p className={styles.descriptionText}>{profile.description || t('common.noDescription')}</p>
            </div>
          </div>
        )}
        {!profile && !loading && !error && <p>{t('providerProfileModal.noProfileFound')}</p>}
      </div>
    </div>
  );
}

export default ProviderProfileModal;