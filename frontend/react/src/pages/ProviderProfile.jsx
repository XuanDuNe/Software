import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Profile.module.css'; // Reusing Student Profile styles
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function ProviderProfile() {
  const { t } = useTranslation();
  const user = getStoredUser();
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: user?.email || '',
    phone: '',
    website: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getProviderProfile();
        if (mounted && data) {
          setForm({
            company_name: data.company_name || '',
            contact_name: data.contact_name || '',
            email: data.email || user?.email || '',
            phone: data.phone || '',
            website: data.website || '',
            description: data.description || ''
          });
        } else if (mounted && user?.email) {
          setForm((prev) => ({ ...prev, email: user.email }));
        }
      } catch (_) {
        if (mounted && user?.email) {
          setForm((prev) => ({ ...prev, email: user.email }));
        }
      }
    })();
    return () => {
      mounted = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [user?.email]);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  const redirectToDashboard = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    redirectTimeoutRef.current = setTimeout(() => {
      navigate('/provider/dashboard', { replace: true });
    }, 1500);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const saved = await api.updateProviderProfile(form);
      setMessage(t('providerProfilePage.successRedirectMessage'));
      setForm({
        company_name: saved.company_name || '',
        contact_name: saved.contact_name || '',
        email: saved.email || '',
        phone: saved.phone || '',
        website: saved.website || '',
        description: saved.description || ''
      });
      redirectToDashboard();
    } catch (err) {
      setError(err.message || t('providerProfilePage.errorUpdate'));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className={styles.container}> 
      <h1 className={styles.title}>{t('providerProfilePage.title')}</h1> 
      <p className={styles.subtitle}> 
        {t('providerProfilePage.subtitle')}
      </p>

      {error && <div className={styles.error}>{error}</div>} 
      {message && <div className={styles.message}>{message}</div>} 

      <form onSubmit={handleSubmit} className={styles.form}> 
        <section className={styles.section}> 
          <div className={styles.field}> 
            <label>{t('providerProfilePage.companyName')}</label>
            <input className={styles.input} value={form.company_name} onChange={handleChange('company_name')} placeholder={t('providerProfilePage.companyNamePlaceholder')} required />
          </div>
          <div className={styles.field}> 
            <label>{t('providerProfilePage.contactName')}</label>
            <input className={styles.input} value={form.contact_name} onChange={handleChange('contact_name')} placeholder={t('providerProfilePage.contactNamePlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('common.email')}</label>
            <input className={styles.input} type="email" value={form.email} onChange={handleChange('email')} placeholder={t('providerProfilePage.emailPlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('providerProfilePage.phone')}</label>
            <input className={styles.input} value={form.phone} onChange={handleChange('phone')} placeholder={t('providerProfilePage.phonePlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('providerProfilePage.website')}</label>
            <input className={styles.input} value={form.website} onChange={handleChange('website')} placeholder={t('providerProfilePage.websitePlaceholder')} />
          </div>
        </section>

        <div className={styles.field}> 
          <label>{t('providerProfilePage.description')}</label>
          <textarea
            className={styles.textarea} 
            value={form.description}
            onChange={handleChange('description')}
            placeholder={t('providerProfilePage.descriptionPlaceholder')}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !form.company_name}
            className={styles.submitButton} 
          >
            {loading ? t('providerProfilePage.savingButton') : t('providerProfilePage.saveButton')}
          </button>
        </div>
      </form>

      <div 
        className={styles.note}
        dangerouslySetInnerHTML={{ __html: t('providerProfilePage.note') }}
      />

    </div>
  );
}

export default ProviderProfile;