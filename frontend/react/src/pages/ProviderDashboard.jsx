import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { clearAuth, getStoredUser } from '../utils/auth.js';

function ProviderDashboard() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'scholarship' });
  const [criteria, setCriteria] = useState({ gpa_min: 0, skills: '', deadline: '', required_documents: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = getStoredUser();
        const [opps, providerApps] = await Promise.all([
          api.listOpportunities(),
          user?.id ? api.listProviderApplications(user.id) : Promise.resolve([])
        ]);
        if (mounted) {
          setOpportunities(opps || []);
          setApps(providerApps || []);
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

  async function createOpp(e) {
    e.preventDefault();
    try {
      // Client-side validate để khớp backend, tránh 500 không cần thiết
      if (!form.title?.trim() || !form.description?.trim()) {
        throw new Error('Vui lòng nhập đầy đủ Title và Description');
      }
      if (!['scholarship', 'research_lab', 'program'].includes(form.type)) {
        throw new Error('Loại cơ hội không hợp lệ');
      }
      if (!user?.id || Number.isNaN(Number(user.id))) {
        throw new Error('Thiếu provider_user_id hợp lệ (hãy đăng nhập lại)');
      }
      const payload = {
        provider_user_id: user?.id,
        title: form.title,
        description: form.description,
        type: form.type
      };
      const created = await api.createOpportunity(payload);
      if (criteria.deadline || criteria.gpa_min || criteria.skills || criteria.required_documents) {
        // Chuẩn hóa deadline sang ISO datetime nếu người dùng nhập YYYY-MM-DD
        let deadline = criteria.deadline?.trim() || null;
        if (deadline && !deadline.includes('T')) {
          deadline = `${deadline}T00:00:00`;
        }
        await api.upsertCriteria(created.id, {
          gpa_min: Number(criteria.gpa_min) || 0,
          skills: criteria.skills.split(',').map(s => s.trim()).filter(Boolean),
          deadline,
          required_documents: criteria.required_documents.split(',').map(s => s.trim()).filter(Boolean)
        });
      }
      const opps = await api.listOpportunities();
      setOpportunities(opps || []);
      setForm({ title: '', description: '', type: 'scholarship' });
      setCriteria({ gpa_min: 0, skills: '', deadline: '', required_documents: '' });
    } catch (err) {
      setError(err.message || 'Tạo cơ hội thất bại');
    }
  }

  async function setStatus(appId, status) {
    try {
      await api.updateApplicationStatus(appId, status);
      const refreshed = await api.listProviderApplications(user.id);
      setApps(refreshed || []);
    } catch (err) {
      setError(err.message || 'Cập nhật trạng thái thất bại');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Trang nhà cung cấp</h2>
      <div style={{ marginBottom: 12 }}>Xin chào, {user?.id ? `User #${user.id}` : 'Nhà cung cấp'}</div>
      <button onClick={logout} style={{ marginBottom: 16 }}>Đăng xuất</button>
      {error && <div style={{ color: '#c0392b' }}>{error}</div>}

      <h3>Tạo cơ hội mới</h3>
      <form onSubmit={createOpp} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input placeholder="Tiêu đề" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea placeholder="Mô tả" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          <option value="scholarship">Học bổng</option>
          <option value="research_lab">Research Lab</option>
          <option value="program">Chương trình</option>
        </select>
        <div style={{ fontWeight: 600, marginTop: 8 }}>Tiêu chí</div>
        <input placeholder="GPA tối thiểu" type="number" value={criteria.gpa_min} onChange={e => setCriteria(c => ({ ...c, gpa_min: e.target.value }))} />
        <input placeholder="Kỹ năng (phân cách bởi dấu phẩy)" value={criteria.skills} onChange={e => setCriteria(c => ({ ...c, skills: e.target.value }))} />
        <input placeholder="Deadline (YYYY-MM-DD)" value={criteria.deadline} onChange={e => setCriteria(c => ({ ...c, deadline: e.target.value }))} />
        <input placeholder="Tài liệu yêu cầu (phân cách bởi dấu phẩy)" value={criteria.required_documents} onChange={e => setCriteria(c => ({ ...c, required_documents: e.target.value }))} />
        <button type="submit">Lưu</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Danh sách cơ hội</h3>
      <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>{JSON.stringify(opportunities, null, 2)}</pre>

      <h3>Hồ sơ ứng tuyển nhận được</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {(apps || []).map(app => (
          <div key={app.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div>ID: {app.id} | Opp: {app.opportunity_id} | Student: {app.student_user_id} | Trạng thái: {app.status}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setStatus(app.id, 'accepted')}>Duyệt</button>
              <button onClick={() => setStatus(app.id, 'rejected')}>Từ chối</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProviderDashboard;


