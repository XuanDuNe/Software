import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';

function Profile() {
  const user = getStoredUser();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
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
            email: data.email || '',
            avatar_url: data.avatar_url || '',
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
        }
      } catch (_) {
        // no profile yet -> keep defaults
      }
    })();
    return () => { mounted = false; };
  }, []);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleUploadCv() {
    if (!cvFile) {
      setError('Vui lòng chọn file CV trước khi upload');
      return;
    }

    setUploadingCv(true);
    setError('');
    setMessage('');
    try {
      const uploadResult = await api.uploadFile(cvFile);
      const fileId = uploadResult.file_id;
      setCvFileId(fileId);
      
      // Cập nhật profile với cv_file_id
      const payload = {
        ...form,
        gpa: form.gpa === '' ? null : Number(form.gpa),
        cv_file_id: fileId
      };
      await api.updateStudentProfile(payload);
      setMessage('Upload CV thành công!');
      setCvFile(null); // Reset file input
    } catch (err) {
      setError(err.message || 'Lỗi upload CV');
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
        cv_file_id: cvFileId // Giữ nguyên cv_file_id nếu đã có
      };
      const saved = await api.updateStudentProfile(payload);
      setMessage('Cập nhật thành công');
      setForm({
        full_name: saved.full_name || '',
        email: saved.email || '',
        avatar_url: saved.avatar_url || '',
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
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Hồ sơ sinh viên</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Cập nhật thông tin cá nhân để nhà tuyển dụng hiểu rõ hơn về bạn và để hệ thống gợi ý cơ hội phù hợp.
      </p>

      {error && <div style={{ color: '#c0392b', marginBottom: 12 }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', marginBottom: 12 }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>Họ và tên</label>
            <input style={inputStyle} value={form.full_name} onChange={handleChange('full_name')} placeholder="Nguyễn Văn A" />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={handleChange('email')} placeholder="a.nguyen@example.com" />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>Số điện thoại</label>
            <input style={inputStyle} value={form.phone} onChange={handleChange('phone')} placeholder="0123456789" />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>Ảnh đại diện (URL)</label>
            <input style={inputStyle} value={form.avatar_url} onChange={handleChange('avatar_url')} placeholder="https://..." />
          </div>
        </section>

        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>GPA</label>
            <input style={inputStyle} type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={handleChange('gpa')} placeholder="3.8" />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>Trình độ</label>
            <input style={inputStyle} value={form.education_level} onChange={handleChange('education_level')} placeholder="Bachelor" />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label>Chuyên ngành</label>
            <input style={inputStyle} value={form.major} onChange={handleChange('major')} placeholder="Computer Science" />
          </div>
        </section>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>Kỹ năng (phân tách bởi dấu phẩy)</label>
          <input style={inputStyle} value={form.skills} onChange={handleChange('skills')} placeholder="Python, Java, Data Analysis" />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>Thành tích</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.achievements}
            onChange={handleChange('achievements')}
            placeholder="Giải Nhất Cuộc thi Lập trình Quốc gia 2024"
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>Quan tâm nghiên cứu</label>
          <input style={inputStyle} value={form.research_interests} onChange={handleChange('research_interests')} placeholder="Machine Learning, NLP" />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>Đề tài luận văn</label>
          <input style={inputStyle} value={form.thesis_topic} onChange={handleChange('thesis_topic')} placeholder="Ứng dụng NLP trong phân tích dữ liệu học thuật" />
        </div>

        <div style={{ display: 'grid', gap: 6, padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 600 }}>CV / Hồ sơ (PDF)</label>
          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            onChange={(e) => setCvFile(e.target.files[0])} 
            style={inputStyle}
          />
          {cvFile && (
            <div style={{ fontSize: 14, color: '#475569' }}>
              File đã chọn: <strong>{cvFile.name}</strong>
            </div>
          )}
          {cvFileId && (
            <div style={{ fontSize: 14, color: '#16a34a' }}>
              ✓ CV đã được lưu (ID: {cvFileId.substring(0, 8)}...)
            </div>
          )}
          <button
            type="button"
            onClick={handleUploadCv}
            disabled={uploadingCv || !cvFile}
            style={{ 
              padding: '10px 16px', 
              background: uploadingCv || !cvFile ? '#94a3b8' : '#10b981', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8,
              cursor: uploadingCv || !cvFile ? 'not-allowed' : 'pointer'
            }}
          >
            {uploadingCv ? 'Đang upload...' : 'Upload CV'}
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8 }}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32, background: '#f1f5f9', padding: 16, borderRadius: 12 }}>
        <strong>Lưu ý:</strong> Hồ sơ sẽ được chia sẻ với các nhà cung cấp khi bạn nộp hồ sơ ứng tuyển, giúp họ dễ dàng đánh giá năng lực của bạn.
      </div>
    </div>
  );
}

export default Profile;


