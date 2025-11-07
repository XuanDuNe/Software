import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';

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

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h2>Gợi ý Cơ hội phù hợp</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Nhập thông tin hồ sơ của bạn để nhận gợi ý các khóa học, học bổng, và chương trình phù hợp nhất.
      </p>

      {error && (
        <div style={{ 
          color: '#c0392b', 
          background: '#ffeaea', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          {error}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gap: 16, 
        marginBottom: 24,
        background: '#f8fafc',
        padding: 24,
        borderRadius: 8
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Kỹ năng (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Python, Machine Learning, Data Analysis"
            value={profile.skills}
            onChange={e => setProfile({ ...profile, skills: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Mục tiêu (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: research, academic, industry"
            value={profile.goals}
            onChange={e => setProfile({ ...profile, goals: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
            Các mục tiêu: research, academic, industry, job, career
          </small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Điểm mạnh (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: analytical, programming, leadership"
            value={profile.strengths}
            onChange={e => setProfile({ ...profile, strengths: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Sở thích / Lĩnh vực quan tâm (phân cách bởi dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: AI, Data Science, Robotics"
            value={profile.interests}
            onChange={e => setProfile({ ...profile, interests: e.target.value })}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>

        <button
          onClick={runMatch}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#ccc' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 600
          }}
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
            <div style={{ display: 'grid', gap: 16 }}>
              {results.results.map((result, index) => (
                <div
                  key={result.opportunity_id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: 4 }}>
                        #{index + 1} {result.title}
                      </h4>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {result.type}
                      </span>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      background: result.score >= 0.7 ? '#4caf50' : result.score >= 0.5 ? '#ff9800' : '#f44336',
                      color: 'white',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {Math.round(result.score * 100)}% phù hợp
                    </div>
                  </div>
                  
                  <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
                    {result.description || 'Không có mô tả'}
                  </p>
                  
                  {result.match_reasons && result.match_reasons.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                        Lý do phù hợp:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#555' }}>
                        {result.match_reasons.map((reason, idx) => (
                          <li key={idx} style={{ marginBottom: 4, fontSize: 13 }}>
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
            <div style={{
              padding: 24,
              textAlign: 'center',
              color: '#666',
              background: '#f8fafc',
              borderRadius: 8
            }}>
              Không tìm thấy cơ hội phù hợp. Vui lòng thử lại với thông tin khác.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Matching;
