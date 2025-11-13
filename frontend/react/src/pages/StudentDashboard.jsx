import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';

// Component con để hiển thị tóm tắt các hồ sơ đã nộp (Giữ nguyên)
const MyApplicationsSummary = ({ applications, opportunities }) => {
    if (!applications || applications.length === 0) {
        return (
            <div className="card" style={{ padding: '15px', textAlign: 'center', color: '#64748b', marginTop: '15px' }}>
                Bạn chưa nộp bất kỳ hồ sơ nào.
            </div>
        );
    }

    const getOpportunityTitle = (opportunityId) => {
        const opp = opportunities.find(o => o.id === opportunityId);
        return opp ? opp.title : `[Cơ hội #${opportunityId}]`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
            case 'submitted':
                return { color: '#f59e0b', background: '#fffbeb' };
            case 'reviewed':
                return { color: '#3b82f6', background: '#eff6ff' };
            case 'accepted':
                return { color: '#10b981', background: '#ecfdf5' };
            case 'rejected':
                return { color: '#ef4444', background: '#fef2f2' };
            default:
                return { color: '#64748b', background: '#f3f4f6' };
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ duyệt';
            case 'submitted': return 'Đã nộp';
            case 'reviewed': return 'Đã xem xét';
            case 'accepted': return 'Được chấp nhận';
            case 'rejected': return 'Bị từ chối';
            default: return status;
        }
    };

    return (
        <div style={{ marginTop: '15px' }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {applications.map((app) => {
                    const statusInfo = getStatusStyle(app.status);
                    return (
                        <div key={app.id} className="card" style={{ borderLeft: `5px solid ${statusInfo.color}`, padding: '15px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                                {getOpportunityTitle(app.opportunity_id)}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: '10px' }}>
                                Nộp ngày: {new Date(app.created_at).toLocaleDateString()}
                            </div>
                            <span 
                                style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '12px', 
                                    fontWeight: 'bold', 
                                    color: statusInfo.color,
                                    background: statusInfo.background
                                }}
                            >
                                Trạng thái: {getStatusText(app.status)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Component chính StudentDashboard
function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  // Thay thế cvUrl bằng cvFile
  const [cvFile, setCvFile] = useState(null); 
  const [submitting, setSubmitting] = useState(false);

  const user = getStoredUser();
  const studentUserId = user?.id;

  async function fetchAllData() {
    if (!studentUserId) return;
    try {
        const [apps, opps] = await Promise.all([
            api.listMyApplications(studentUserId),
            api.listOpportunities()
        ]);
        setApplications(apps || []);
        setOpportunities(opps || []);
    } catch (err) {
        setError(err.message || 'Lỗi tải dữ liệu');
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchAllData();
    return () => { mounted = false; };
  }, [studentUserId]);

  // Kiểm tra xem sinh viên đã nộp hồ sơ cho cơ hội này chưa
  const hasApplied = (opportunityId) => {
    return applications.some(app => app.opportunity_id === opportunityId);
  };

  async function submitApplication(opportunityId) {
    if (!studentUserId) return;
    setSubmitting(true);
    setError('');
    
    if (hasApplied(opportunityId)) {
        setError('Bạn đã nộp hồ sơ cho cơ hội này rồi.');
        setSubmitting(false);
        return;
    }

    // Kiểm tra file CV
    if (!cvFile) {
        setError('Vui lòng chọn tệp CV trước khi nộp hồ sơ.');
        setSubmitting(false);
        return;
    }

    try {
      // Tạo FormData để upload file
      const formData = new FormData();
      // Các trường dữ liệu khác
      formData.append('opportunity_id', opportunityId.toString());
      formData.append('student_user_id', studentUserId.toString());
      // Tệp CV
      formData.append('cv_file', cvFile); 
      
      await api.submitApplication(formData);
      
      await fetchAllData(); 
      alert('Nộp hồ sơ thành công!');
    } catch (err) {
      setError(err.message || 'Nộp hồ sơ thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container p-6">
      <h2>Trang sinh viên</h2>
      
      {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <h3 style={{ marginTop: 24, marginBottom: 10 }}>Hồ sơ của bạn</h3>
      <MyApplicationsSummary applications={applications} opportunities={opportunities} />

      <h3 style={{ marginTop: 40, marginBottom: 15 }}>Danh sách cơ hội</h3>
      
      <div className="card" style={{ padding: 15, marginBottom: 20, maxWidth: 600 }}>
        <p className="label" style={{ marginBottom: 8 }}>Tệp CV (PDF)</p>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={e => setCvFile(e.target.files[0])} 
          className="input"
          style={{ padding: '8px' }} 
        />
        <small style={{ color: '#64748b', display: 'block', marginTop: 8 }}>
            Tệp CV hiện tại: <strong>{cvFile ? cvFile.name : 'Chưa chọn tệp'}</strong>
        </small>
      </div>

      <div className="opportunity-list">
        {(opportunities || []).map((opp) => {
            const applied = hasApplied(opp.id);
            return (
                <div key={opp.id} className="opportunity-card">
                    <div className="opportunity-title">{opp.title}</div>
                    <div className="opportunity-description">{opp.description}</div>
                    <button
                        disabled={submitting || applied || !cvFile} 
                        onClick={() => submitApplication(opp.id)}
                        className={`btn ${applied || !cvFile ? 'btn-disabled' : 'btn-secondary'}`}
                        style={{ marginTop: 8 }}
                    >
                        {applied ? 'Đã Nộp' : submitting ? 'Đang nộp...' : 'Nộp hồ sơ'}
                    </button>
                </div>
            );
        })}
      </div>
    </div>
  );
}

export default StudentDashboard;