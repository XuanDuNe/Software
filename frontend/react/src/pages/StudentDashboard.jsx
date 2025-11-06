import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { clearAuth, getStoredUser } from '../utils/auth.js';

function StudentDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) throw new Error('Thiếu user_id trong token');
        const [apps, opps] = await Promise.all([
          api.listMyApplications(user.id),
          api.listOpportunities()
        ]);
        if (mounted) {
          setApplications(apps || []);
          setOpportunities(opps || []);
        }
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

  async function submitApplication(opportunityId) {
    if (!user?.id) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        opportunity_id: opportunityId,
        student_user_id: user.id,
        documents: []
      };
      await api.submitApplication(payload);
      const apps = await api.listMyApplications(user.id);
      setApplications(apps || []);
    } catch (err) {
      setError(err.message || 'Nộp hồ sơ thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Trang sinh viên</h2>
      <div style={{ marginBottom: 12 }}>Xin chào, {user?.id ? `User #${user.id}` : 'Sinh viên'}</div>
      <button onClick={logout} style={{ marginBottom: 16 }}>Đăng xuất</button>
      {error && <div style={{ color: '#c0392b' }}>{error}</div>}
      {error && <div style={{ color: '#c0392b', marginBottom: 12 }}>{error}</div>}

      <h3>Danh sách cơ hội</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {(opportunities || []).map((opp) => (
          <div key={opp.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{opp.title}</div>
            <div style={{ fontSize: 12, color: '#475569' }}>{opp.description}</div>
            <button
              disabled={submitting}
              onClick={() => submitApplication(opp.id)}
              style={{ marginTop: 8 }}
            >
              {submitting ? 'Đang nộp...' : 'Nộp hồ sơ'}
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Hồ sơ của bạn</h3>
      <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
        {JSON.stringify(applications, null, 2)}
      </pre>
    </div>
  );
}

export default StudentDashboard;


