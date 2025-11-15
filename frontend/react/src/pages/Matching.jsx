import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Matching.module.css'; 

function Matching() {
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
      setError('Vui lòng đăng nhập để sử dụng tính năng này');
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
      setError(err.message || 'Lỗi khi thực hiện matching');
    } finally {
      setLoading(false);
    }
  }

  const getScoreClass = (score) => {
    if (score >= 0.7) return styles.scoreHigh;
    if (score >= 0.5) return styles.scoreMedium;
    return styles.scoreLow;
  };

  return (
    <div className={styles.pageContainer}> 
      <h2>Gợi ý Cơ hội phù hợp</h2>
      <p className={styles.description}> 
        Nhập thông tin hồ sơ của bạn để nhận gợi ý các khóa học, học bổng, và chương trình phù hợp nhất.
      </p>

      {error && (
        <div className={styles.alert}> 
          {error}
        </div>
      )}

      <div className={styles.inputSection}> 
        <div>
          <label className={styles.label}> 
            GPA (Điểm trung bình)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder="Ví dụ: 3.5"
            value={profile.gpa}
            onChange={e => setProfile({ ...profile, gpa: e.target.value })}
            className={styles.input} 
          />
        </div>

        <div>
          <label className={styles.label}> 
            Kỹ năng (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Python, Machine Learning, Data Analysis"
            value={profile.skills}
            onChange={e => setProfile({ ...profile, skills: e.target.value })}
            className={styles.input} 
          />
        </div>

        <div>
          <label className={styles.label}> 
            Mục tiêu (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: research, academic, industry"
            value={profile.goals}
            onChange={e => setProfile({ ...profile, goals: e.target.value })}
            className={styles.input} 
          />
          <small className={styles.smallText}> 
            Các mục tiêu: research, academic, industry, job, career
          </small>
        </div>

        <div>
          <label className={styles.label}> 
            Điểm mạnh (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: analytical, programming, leadership"
            value={profile.strengths}
            onChange={e => setProfile({ ...profile, strengths: e.target.value })}
            className={styles.input} 
          />
        </div>

        <div>
          <label className={styles.label}> 
            Sở thích / Lĩnh vực quan tâm (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: AI, Data Science, Robotics"
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
          {loading ? 'Đang xử lý...' : 'Tìm kiếm cơ hội phù hợp'}
        </button>
      </div>

      {results && (
        <div>
          <h3 style={{ marginBottom: 16 }}>
            Kết quả gợi ý ({results.total_opportunities} cơ hội)
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
                      {Math.round(result.score * 100)}% phù hợp
                    </div>
                  </div>
                  
                  <p className={styles.resultDescription}> 
                    {result.description || 'Không có mô tả'}
                  </p>
                  
                  {result.match_reasons && result.match_reasons.length > 0 && (
                    <div className={styles.reasonsContainer}> 
                      <strong className={styles.reasonsTitle}> 
                        Lý do phù hợp:
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
              Không tìm thấy cơ hội phù hợp. Vui lòng thử lại với thông tin khác.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Matching;