import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Matching.module.css'; 
// 1. Import hook
import { useTranslation } from 'react-i18next';



function Matching() {
  // 2. Khởi tạo hook
  const { t } = useTranslation();
  const user = getStoredUser();

  const [profile, setProfile] = useState({
    gpa: '',
    skills: '',
    goals: '',
    strengths: '',
    interests: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runMatch() {
    if (!user?.id) {
      setError(t('matchingPage.errorLogin'));
      return;
    }

    setError('');
    setLoading(true);
    setResults(null);

    try {
      const studentProfile = {
        user_id: user.id,
        gpa: profile.gpa ? parseFloat(profile.gpa) : null,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
        goals: profile.goals.split(',').map(g => g.trim()).filter(Boolean),
        strengths: profile.strengths.split(',').map(s => s.trim()).filter(Boolean),
        interests: profile.interests.split(',').map(i => i.trim()).filter(Boolean)
      };

      const res = await api.matchOpportunities(user.id, studentProfile);
      setResults(res);
    } catch (err) {
      setError(err.message || t('matchingPage.errorMatch'));
    } finally {
      setLoading(false);
    }
  }

  const getScoreClass = (score) => {
    if (score >= 0.7) return styles.scoreHigh;
    if (score >= 0.5) return styles.scoreMedium;
    return styles.scoreLow;
  };

  // 3. Thay thế strings
  return (
    <div className={styles.pageContainer}> 
      <h2>{t('matchingPage.title')}</h2>
      <p className={styles.description}> 
        {t('matchingPage.subtitle')}
      </p>

      {error && (
        <div className={styles.alert}> 
          {error}
        </div>
      )}

      <div className={styles.inputSection}> 
        <div>
          <label className={styles.label}> 
            {t('matchingPage.gpa')}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder={t('matchingPage.gpaPlaceholder')}
            value={profile.gpa}
            onChange={e => setProfile({ ...profile, gpa: e.target.value })}
            className={styles.input} 
          />
        </div>

        <div>
          <label className={styles.label}> 
            {t('matchingPage.skills')}

          </label>
          <input
            type="text"
            placeholder={t('matchingPage.skillsPlaceholder')}
            value={profile.skills}
            onChange={e => setProfile({ ...profile, skills: e.target.value })}
            className={styles.input} 
          />
        </div>

        <div>
          <label className={styles.label}> 
            {t('matchingPage.goals')}
          </label>
          <input
            type="text"
            placeholder={t('matchingPage.goalsPlaceholder')}
            value={profile.goals}
            onChange={e => setProfile({ ...profile, goals: e.target.value })}
            className={styles.input} 
          />
          <small className={styles.smallText}> 
            {t('matchingPage.goalsHelp')}
          </small>
        </div>
        <div>
          <label className={styles.label}> 
            {t('matchingPage.strengths')}

          </label>
          <input
            type="text"
            placeholder={t('matchingPage.strengthsPlaceholder')}
            value={profile.strengths}
            onChange={e => setProfile({ ...profile, strengths: e.target.value })}
            className={styles.input} 
          />
        </div>

        <div>
          <label className={styles.label}> 
            {t('matchingPage.interests')}
          </label>
          <input
            type="text"
            placeholder={t('matchingPage.interestsPlaceholder')}
            value={profile.interests}
            onChange={e => setProfile({ ...profile, interests: e.target.value })}
            className={styles.input} 
          />
        </div>

        <button
          onClick={runMatch}
          disabled={loading}
          className={styles.button} 
        >
          {loading ? t('matchingPage.loadingButton') : t('matchingPage.submitButton')}
        </button>
      </div>

      {results && (
        <div>
          <h3 style={{ marginBottom: 16 }}>
            {t('matchingPage.resultsTitle', { count: results.total_opportunities })}
          </h3>
          
          {results.results && results.results.length > 0 ? (
            <div className={styles.resultsContainer}> 
              {results.results.map((result, index) => (
                <div
                  key={result.opportunity_id}
                  className={styles.result} 
                >
                  <div className={styles.resultHeader}> 
                    <div>
                      <h4 className={styles.resultTitle}> 
                        #{index + 1} {result.title}
                      </h4>
                      <span className={styles.typeBadge}> 
                        {result.type}
                      </span>
                    </div>
                    <div className={`${styles.scoreBadge} ${getScoreClass(result.score)}`}> 
                      {t('matchingPage.score', { score: Math.round(result.score * 100) })}
                    </div>
                  </div>
                  
                  <p className={styles.resultDescription}> 
                    {result.description || 'Không có mô tả'}
                  </p>
                  
                  {result.match_reasons && result.match_reasons.length > 0 && (
                    <div className={styles.reasonsContainer}> 
                      <strong className={styles.reasonsTitle}> 
                        {t('matchingPage.reasonsTitle')}
                      </strong>
                      <ul className={styles.reasonsList}> 
                        {result.match_reasons.map((reason, idx) => (
                          <li key={idx} className={styles.reasonItem}> 
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}> 
              {t('matchingPage.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Matching;