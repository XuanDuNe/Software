import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './Profile.module.css'; 

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
      
      const payload = {
        ...form,
        gpa: form.gpa === '' ? null : Number(form.gpa),
        cv_file_id: fileId
      };
      await api.updateStudentProfile(payload);
      setMessage('Upload CV thành công!');
      setCvFile(null); 
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
        cv_file_id: cvFileId 
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

  return (
    <div className={styles.container}> 
      <h1 className={styles.title}>Hồ sơ sinh viên</h1> 
      <p className={styles.subtitle}> 
        Cập nhật thông tin cá nhân để nhà tuyển dụng hiểu rõ hơn về bạn và để hệ thống gợi ý cơ hội phù hợp.
      </p>

      {error && <div className={styles.error}>{error}</div>} 
      {message && <div className={styles.message}>{message}</div>} 

      <form onSubmit={handleSubmit} className={styles.form}> 
        <section className={styles.section}> 
          <div className={styles.field}> 
            <label>Họ và tên</label>
            <input className={styles.input} value={form.full_name} onChange={handleChange('full_name')} placeholder="Nguyễn Văn A" />
          </div>
          <div className={styles.field}> 
            <label>Email</label>
            <input className={styles.input} type="email" value={form.email} onChange={handleChange('email')} placeholder="a.nguyen@example.com" />
          </div>
          <div className={styles.field}> 
            <label>Số điện thoại</label>
            <input className={styles.input} value={form.phone} onChange={handleChange('phone')} placeholder="0123456789" />
          </div>
          <div className={styles.field}> 
            <label>Ảnh đại diện (URL)</label>
            <input className={styles.input} value={form.avatar_url} onChange={handleChange('avatar_url')} placeholder="https://..." />
          </div>
        </section>

        <section className={styles.section}> 
          <div className={styles.field}> 
            <label>GPA</label>
            <input className={styles.input} type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={handleChange('gpa')} placeholder="3.8" />
          </div>
          <div className={styles.field}> 
            <label>Trình độ</label>
            <input className={styles.input} value={form.education_level} onChange={handleChange('education_level')} placeholder="Bachelor" />
          </div>
          <div className={styles.field}> 
            <label>Chuyên ngành</label>
            <input className={styles.input} value={form.major} onChange={handleChange('major')} placeholder="Computer Science" />
          </div>
        </section>

        <div className={styles.field}> 
          <label>Kỹ năng (phân tách bởi dấu phẩy)</label>
          <input className={styles.input} value={form.skills} onChange={handleChange('skills')} placeholder="Python, Java, Data Analysis" />
        </div>

        <div className={styles.field}> 
          <label>Thành tích</label>
          <textarea
            className={styles.textarea} 
            value={form.achievements}
            onChange={handleChange('achievements')}
            placeholder="Giải Nhất Cuộc thi Lập trình Quốc gia 2024"
          />
        </div>

        <div className={styles.field}> 
          <label>Quan tâm nghiên cứu</label>
          <input className={styles.input} value={form.research_interests} onChange={handleChange('research_interests')} placeholder="Machine Learning, NLP" />
        </div>

        <div className={styles.field}> 
          <label>Đề tài luận văn</label>
          <input className={styles.input} value={form.thesis_topic} onChange={handleChange('thesis_topic')} placeholder="Ứng dụng NLP trong phân tích dữ liệu học thuật" />
        </div>

        <div className={styles.cvSection}> 
          <label className={styles.cvLabel}>CV / Hồ sơ (PDF)</label> 
          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            onChange={(e) => setCvFile(e.target.files[0])} 
            className={styles.input} 
          />
          {cvFile && (
            <div className={styles.cvFileSelected}> 
              File đã chọn: <strong>{cvFile.name}</strong>
            </div>
          )}
          {cvFileId && (
            <div className={styles.cvFileSaved}> 
              ✓ CV đã được lưu (ID: {cvFileId.substring(0, 8)}...)
            </div>
          )}
          <button
            type="button"
            onClick={handleUploadCv}
            disabled={uploadingCv || !cvFile}
            className={styles.uploadButton} 
          >
            {uploadingCv ? 'Đang upload...' : 'Upload CV'}
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton} 
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      <div className={styles.note}> 
        <strong>Lưu ý:</strong> Hồ sơ sẽ được chia sẻ với các nhà cung cấp khi bạn nộp hồ sơ ứng tuyển, giúp họ dễ dàng đánh giá năng lực của bạn.
      </div>
    </div>
  );
}

export default Profile;