import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Profile.module.css'; 
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { t } = useTranslation();
  const user = getStoredUser();
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);

  const [form, setForm] = useState({
    full_name: '',
    email: user?.email || '',
    phone: '',
    gpa: '',
    education_level: '',
    major: '',
    skills: '',
    achievements: '',
    research_interests: '',
    thesis_topic: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [cvFileId, setCvFileId] = useState(null);
  const [uploadingCv, setUploadingCv] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getStudentProfile();
        if (mounted && data) {
          setForm({
            full_name: data.full_name || '',
            email: data.email || user?.email || '',
            phone: data.phone || '',
            gpa: data.gpa ?? '',
            education_level: data.education_level || '',
            major: data.major || '',
            skills: data.skills || '',
            achievements: data.achievements || '',
            research_interests: data.research_interests || '',
            thesis_topic: data.thesis_topic || ''
          });
          setCvFileId(data.cv_file_id || null);
        } else if (mounted && user?.email) {
          setForm((prev) => ({ ...prev, email: user.email }));
        }
      } catch (err) {
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
      navigate('/student/dashboard', { replace: true });
    }, 1500);
  };

  async function handleUploadCv() {
    if (!cvFile) {
      setError(t('profilePage.errorChooseFile'));
      return;
    }

    setUploadingCv(true);
    setError('');
    setMessage('');
    try {
      const uploadResult = await api.uploadFile(cvFile);
      const fileId = uploadResult.file_id;
      setCvFileId(fileId);
      
      const payload = {
        ...form,
        gpa: form.gpa === '' ? null : Number(form.gpa),
        cv_file_id: fileId
      };
      await api.updateStudentProfile(payload);
      setMessage(t('profilePage.successMessage'));
      setCvFile(null); 
    } catch (err) {
      setError(err.message || t('profilePage.errorUpload'));
    } finally {
      setUploadingCv(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        gpa: form.gpa === '' ? null : Number(form.gpa),
        cv_file_id: cvFileId 
      };
      const saved = await api.updateStudentProfile(payload);
      setMessage(t('profilePage.successRedirectMessage'));
      setForm({
        full_name: saved.full_name || '',
        email: saved.email || '',
        phone: saved.phone || '',
        gpa: saved.gpa ?? '',
        education_level: saved.education_level || '',
        major: saved.major || '',
        skills: saved.skills || '',
        achievements: saved.achievements || '',
        research_interests: saved.research_interests || '',
        thesis_topic: saved.thesis_topic || ''
      });
      setCvFileId(saved.cv_file_id || null);
      redirectToDashboard();
    } catch (err) {
      setError(err.message || t('profilePage.errorUpdate'));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className={styles.container}> 
      <h1 className={styles.title}>{t('profilePage.title')}</h1> 
      <p className={styles.subtitle}> 
        {t('profilePage.subtitle')}
      </p>

      {error && <div className={styles.error}>{error}</div>} 
      {message && <div className={styles.message}>{message}</div>} 

      <form onSubmit={handleSubmit} className={styles.form}> 
        <section className={styles.section}> 
          <div className={styles.field}> 
            <label>{t('profilePage.fullName')}</label>
            <input className={styles.input} value={form.full_name} onChange={handleChange('full_name')} placeholder={t('profilePage.fullNamePlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('common.email')}</label>
            <input className={styles.input} type="email" value={form.email} onChange={handleChange('email')} placeholder={t('profilePage.emailPlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('profilePage.phone')}</label>
            <input className={styles.input} value={form.phone} onChange={handleChange('phone')} placeholder={t('profilePage.phonePlaceholder')} />
          </div>
        </section>

        <section className={styles.section}> 
          <div className={styles.field}> 

            <label>{t('profilePage.gpa')}</label>
            <input className={styles.input} type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={handleChange('gpa')} placeholder={t('profilePage.gpaPlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('profilePage.educationLevel')}</label>
            <input className={styles.input} value={form.education_level} onChange={handleChange('education_level')} placeholder={t('profilePage.educationLevelPlaceholder')} />
          </div>
          <div className={styles.field}> 
            <label>{t('profilePage.major')}</label>
            <input className={styles.input} value={form.major} onChange={handleChange('major')} placeholder={t('profilePage.majorPlaceholder')} />

          </div>
        </section>

        <div className={styles.field}> 

          <label>{t('profilePage.skills')}</label>
          <input className={styles.input} value={form.skills} onChange={handleChange('skills')} placeholder={t('profilePage.skillsPlaceholder')} />
        </div>

        <div className={styles.field}> 
          <label>{t('profilePage.achievements')}</label>

          <textarea
            className={styles.textarea} 
            value={form.achievements}
            onChange={handleChange('achievements')}
            placeholder={t('profilePage.achievementsPlaceholder')}
          />
        </div>

        <div className={styles.field}> 

          <label>{t('profilePage.researchInterests')}</label>
          <input className={styles.input} value={form.research_interests} onChange={handleChange('research_interests')} placeholder={t('profilePage.researchInterestsPlaceholder')} />
        </div>

        <div className={styles.field}> 
          <label>{t('profilePage.thesisTopic')}</label>
          <input className={styles.input} value={form.thesis_topic} onChange={handleChange('thesis_topic')} placeholder={t('profilePage.thesisTopicPlaceholder')} />
        </div>

        <div className={styles.cvSection}> 
          <label className={styles.cvLabel}>{t('profilePage.cvLabel')}</label> 

          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            onChange={(e) => setCvFile(e.target.files[0])} 
            className={styles.input} 
          />
          {cvFile && (

            <div 
              className={styles.cvFileSelected}
              dangerouslySetInnerHTML={{ __html: t('profilePage.cvFileSelected', { fileName: cvFile.name }) }}
            />
          )}
          {cvFileId && (
            <div className={styles.cvFileSaved}> 
              {t('profilePage.cvFileSaved', { fileId: cvFileId.substring(0, 8) })}

            </div>
          )}
          <button
            type="button"
            onClick={handleUploadCv}
            disabled={uploadingCv || !cvFile}
            className={styles.uploadButton} 
          >
            {uploadingCv ? t('profilePage.uploadingButton') : t('profilePage.uploadButton')}
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton} 
          >
            {loading ? t('profilePage.savingButton') : t('profilePage.saveButton')}
          </button>
        </div>
      </form>

      <div 
        className={styles.note}
        dangerouslySetInnerHTML={{ __html: t('profilePage.note') }}
      />

    </div>
  );
}

export default Profile;