// src/pages/ProviderDashboard.jsx (Sửa đổi toàn bộ)

import React, { useState, useEffect, useMemo, useRef } from 'react'; // NEW: Thêm useRef
import { Link } from 'react-router-dom';
import { api, BASE_URL } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';

// --- HELPER COMPONENTS ---

const StatCard = ({ title, value, icon, color }) => (
    <div className="stat-card" data-color={color || '#3b82f6'}>
        <div>
            <h3 className="stat-title">{title}</h3>
            <p className="stat-value">{value}</p>
        </div>
        <div className="stat-icon" style={{ color: color || '#3b82f6' }}>
            {icon}
        </div>
    </div>
);

const Sidebar = ({ activeTab, onSelectTab }) => {
    const navItems = [
        { id: 'overview', name: 'Tổng quan', icon: '📊' },
        { id: 'opportunities', name: 'Cơ hội (Listings)', icon: '📋' },
        { id: 'applicants', name: 'Ứng viên (Applicants)', icon: '👥' },
        { id: 'settings', name: 'Cài đặt', icon: '⚙️' },
    ];

    return (
        <div className="sidebar">
            <h2 className="sidebar-title">Provider Hub</h2>
            <nav>
                {navItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                    >
                        <span>{item.icon}</span>
                        {item.name}
                    </div>
                ))}
            </nav>
        </div>
    );
};

const OpportunityModal = ({ isOpen, onClose, onSave, existingData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('program');
    const [gpaMin, setGpaMin] = useState('');
    const [skills, setSkills] = useState('');
    const [requiredDocs, setRequiredDocs] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (existingData) {
                setTitle(existingData.title);
                setDescription(existingData.description);
                setType(existingData.type || 'program');
                const crit = existingData.criteria || {};
                setGpaMin(crit.gpa_min ?? '');
                setSkills((crit.skills || []).join(', '));
                setRequiredDocs((crit.required_documents || []).join(', '));
                setDeadline(crit.deadline ? new Date(crit.deadline).toISOString().slice(0, 10) : '');
            } else {
                setTitle('');
                setDescription('');
                setType('program');
                setGpaMin('');
                setSkills('');
                setRequiredDocs('');
                setDeadline('');
            }
            setError('');
        }
    }, [isOpen, existingData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const criteriaPayload = {
                gpa_min: gpaMin === '' ? null : Number(gpaMin),
                skills: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
                required_documents: requiredDocs ? requiredDocs.split(',').map((s) => s.trim()).filter(Boolean) : [],
                deadline: deadline ? new Date(deadline).toISOString() : null,
            };

            await onSave({
                opportunity: { title, description, type },
                criteria: criteriaPayload,
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Lỗi khi lưu cơ hội.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{existingData ? 'Chỉnh sửa cơ hội' : 'Thêm cơ hội mới'}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label className="label">Tên cơ hội</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Loại cơ hội</label>
                        <select
                            className="input"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="program">Chương trình (Program)</option>
                            <option value="scholarship">Học bổng (Scholarship)</option>
                            <option value="research_lab">Lab nghiên cứu (Research Lab)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Mô tả</label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows="4"
                        />
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div className="form-group">
                            <label className="label">GPA tối thiểu</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="4"
                                step="0.01"
                                value={gpaMin}
                                onChange={(e) => setGpaMin(e.target.value)}
                                placeholder="Ví dụ: 3.0"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Hạn nộp</label>
                            <input
                                type="date"
                                className="input"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Kỹ năng yêu cầu (phân tách bằng dấu phẩy)</label>
                        <input
                            className="input"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="Python, Machine Learning, ..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Tài liệu yêu cầu (phân tách bằng dấu phẩy)</label>
                        <input
                            className="input"
                            value={requiredDocs}
                            onChange={(e) => setRequiredDocs(e.target.value)}
                            placeholder="CV, Cover Letter,..."
                        />
                    </div>

                    <button type="submit" className="btn btn-secondary" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const OpportunityDetailModal = ({ opportunityId, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!opportunityId) return;

        setLoading(true);
        setError('');
        setDetail(null);

        api.getOpportunity(opportunityId)
            .then(data => {
                setDetail(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || 'Lỗi tải chi tiết cơ hội.');
                setLoading(false);
            });
    }, [opportunityId]);

    if (!opportunityId) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Chi tiết Cơ hội</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading && <div style={{ textAlign: 'center' }}>Đang tải dữ liệu...</div>}
                {error && <div className="alert-error">{error}</div>}
                
                {detail && (
                    <div className="detail-content">
                        <h4 style={{ fontSize: '24px', marginBottom: '10px' }}>{detail.title}</h4>

                        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                            <strong className="label">Mô tả chi tiết:</strong>
                            <p style={{ whiteSpace: 'pre-wrap', margin: '5px 0 0 0' }}>{detail.description}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', fontSize: '14px' }}>
                            <div><strong>ID Cơ hội:</strong> {detail.id}</div>
                            <div><strong>Loại:</strong> {detail.type}</div>
                            <div><strong>Ngày tạo:</strong> {new Date(detail.created_at).toLocaleDateString()}</div>
                        </div>

                        {detail.criteria && (
                            <div style={{ marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                                <h5 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Tiêu chí tuyển chọn</h5>
                                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                                    {detail.criteria.gpa_min !== null && (
                                        <div><strong>GPA tối thiểu:</strong> {detail.criteria.gpa_min}</div>
                                    )}
                                    {detail.criteria.deadline && (
                                        <div><strong>Hạn nộp:</strong> {new Date(detail.criteria.deadline).toLocaleDateString()}</div>
                                    )}
                                    <div>
                                        <strong>Kỹ năng yêu cầu:</strong> {detail.criteria.skills?.length ? detail.criteria.skills.join(', ') : 'Không yêu cầu cụ thể'}
                                    </div>
                                    <div>
                                        <strong>Tài liệu cần nộp:</strong> {detail.criteria.required_documents?.length ? detail.criteria.required_documents.join(', ') : 'CV'}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

const StudentProfileModal = ({ isOpen, loading, error, profile, application, onClose }) => {
    if (!isOpen) return null;
    const docs = application?.documents || [];
    const cvDoc = docs.find(doc => (doc.document_type || '').toLowerCase() === 'cv') || docs[0];
    const cvUrl = cvDoc?.document_url ? (cvDoc.document_url.startsWith('http') ? cvDoc.document_url : `${BASE_URL}${cvDoc.document_url}`) : null;
    const skills = profile?.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h3>Hồ sơ ứng viên</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading ? (
                    <div style={{ padding: 16, textAlign: 'center' }}>Đang tải hồ sơ...</div>
                ) : error ? (
                    <div className="alert-error">{error}</div>
                ) : profile ? (
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px 0' }}>{profile.full_name || `Ứng viên #${application?.student_user_id}`}</h2>
                            <div style={{ fontSize: 14, color: '#64748b' }}>{profile.email || 'Chưa cập nhật email'}</div>
                            {profile.phone && <div style={{ fontSize: 14, color: '#64748b' }}>Điện thoại: {profile.phone}</div>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                            <div><strong>GPA:</strong> {profile.gpa ?? 'Chưa cập nhật'}</div>
                            <div><strong>Trình độ:</strong> {profile.education_level || 'Chưa cập nhật'}</div>
                            <div><strong>Chuyên ngành:</strong> {profile.major || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                            <strong>Kỹ năng:</strong>
                            <div style={{ marginTop: 8 }}>
                                {skills.length ? skills.map((skill, idx) => (
                                    <span key={idx} style={{ background: '#e0ecff', color: '#1d4ed8', padding: '4px 8px', borderRadius: 6, marginRight: 6, fontSize: 12 }}>{skill}</span>
                                )) : 'Chưa cập nhật'}
                            </div>
                        </div>
                        {profile.achievements && (
                            <div>
                                <strong>Thành tích</strong>
                                <p style={{ marginTop: 6, background: '#f8fafc', padding: 12, borderRadius: 10 }}>{profile.achievements}</p>
                            </div>
                        )}
                        {profile.research_interests && (
                            <div>
                                <strong>Quan tâm nghiên cứu</strong>
                                <p style={{ marginTop: 6 }}>{profile.research_interests}</p>
                            </div>
                        )}
                        {profile.thesis_topic && (
                            <div>
                                <strong>Đề tài luận văn</strong>
                                <p style={{ marginTop: 6 }}>{profile.thesis_topic}</p>
                            </div>
                        )}
                        <div>
                            <strong>Tài liệu đã nộp</strong>
                            <div style={{ marginTop: 8 }}>
                                {cvUrl ? (
                                    <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                        Xem CV
                                    </a>
                                ) : (
                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Chưa có CV được tải lên</span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>Không tìm thấy dữ liệu hồ sơ.</div>
                )}
            </div>
        </div>
    );
};

// NEW: Message Modal Refactored with useRef for scrolling
const MessageModal = ({
    isOpen,
    loading,
    error,
    messages,
    input,
    onInputChange,
    onSend,
    onClose,
    sending,
    partnerName,
    currentUserId
}) => {
    if (!isOpen) return null;
    const messagesEndRef = useRef(null); 

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>Nhắn tin với {partnerName}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading ? (
                    <div style={{ padding: 16, textAlign: 'center' }}>Đang tải tin nhắn...</div>
                ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {error && <div className="alert-error">{error}</div>}
                        <div style={{ 
                            maxHeight: 320, 
                            overflowY: 'auto', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: 8, 
                            padding: 12, 
                            display: 'grid', 
                            gap: 10,
                            alignContent: 'end' // NEW
                        }}>
                            {messages && messages.length ? messages.map(msg => (
                                <div
                                    key={msg.id}
                                    style={{
                                        alignSelf: msg.sender_user_id === currentUserId ? 'end' : 'start',
                                        background: msg.sender_user_id === currentUserId ? '#2563eb' : '#f1f5f9',
                                        color: msg.sender_user_id === currentUserId ? '#fff' : '#1f2937',
                                        padding: '8px 12px',
                                        borderRadius: 12,
                                        maxWidth: '70%',
                                        minWidth: '100px',
                                        marginLeft: msg.sender_user_id === currentUserId ? 'auto' : 'unset',
                                        marginRight: msg.sender_user_id === currentUserId ? 'unset' : 'auto',
                                    }}
                                >
                                    <div style={{ fontSize: 13, wordBreak: 'break-word' }}>{msg.content}</div>
                                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{new Date(msg.created_at).toLocaleString()}</div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>Chưa có tin nhắn nào.</div> // NEW
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSend();
                            }}
                            style={{ display: 'flex', gap: 10 }}
                        >
                            <input
                                className="input"
                                value={input}
                                onChange={(e) => onInputChange(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                style={{ flex: 1 }}
                            />
                            <button
                                type="submit"
                                className="btn btn-secondary"
                                disabled={sending || !input.trim()}
                            >
                                {sending ? 'Đang gửi...' : 'Gửi'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};


const OpportunitiesManagement = ({ opportunities, onOpportunityAction }) => {
    
    // Hàm xử lý việc xóa cơ hội
    const handleDelete = (opportunityId, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa cơ hội: "${title}"?`)) {
            onOpportunityAction('delete', opportunityId);
        }
    };
    
    // Hàm xử lý Xem Chi tiết
    const handleViewDetail = (opportunityId) => {
        onOpportunityAction('viewDetail', opportunityId);
    };

    return (
        <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>Danh sách Cơ hội</h2>
                <button className="btn btn-secondary" onClick={() => onOpportunityAction('create')}>
                    + Thêm Cơ hội Mới
                </button>
            </div>
            
            <div className="table-management">
                {opportunities.length === 0 ? (
                    <p>Chưa có cơ hội nào được đăng tải.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Tên Cơ hội</th>
                                <th style={{ width: '25%' }}>Tiêu chí</th>
                                <th style={{ width: '10%' }}>Ứng viên</th>
                                <th style={{ width: '20%' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.map(opp => {
                                const criteria = opp.criteria || {};
                                return (
                                    <tr key={opp.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{opp.title}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{opp.type}</div>
                                        </td>
                                        <td style={{ fontSize: 13, color: '#475569' }}>
                                            {criteria.gpa_min ? <div>GPA ≥ {criteria.gpa_min}</div> : <div>Không yêu cầu GPA</div>}
                                            <div>Kỹ năng: {criteria.skills?.length ? criteria.skills.join(', ') : 'Không yêu cầu cụ thể'}</div>
                                            {criteria.deadline && (
                                                <div>Hạn: {new Date(criteria.deadline).toLocaleDateString()}</div>
                                            )}
                                        </td>
                                        <td>{opp.applications_count || 0}</td> 
                                        <td style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleViewDetail(opp.id)} 
                                                className="action-link"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-primary)' }}
                                            >
                                                Xem
                                            </button> 
                                            |
                                            <button 
                                                onClick={() => onOpportunityAction('edit', opp.id, opp)} 
                                                className="action-link"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#f59e0b' }} 
                                            >
                                                Sửa
                                            </button>
                                            |
                                            <button 
                                                onClick={() => handleDelete(opp.id, opp.title)} 
                                                className="action-link delete" 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// Component Placeholder: Bảng Ứng viên 
const ApplicantsList = ({ applications, opportunities, onViewProfile = () => {}, onMessage = () => {}, onApplicationAction }) => {
    
    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
            case 'submitted':
                return { color: '#f59e0b', background: '#fffbeb', text: 'Chờ duyệt' };
            case 'reviewed':
                return { color: '#3b82f6', background: '#eff6ff', text: 'Đã xem xét' };
            case 'accepted':
                return { color: '#10b981', background: '#ecfdf5', text: 'Đã chấp nhận' };
            case 'rejected':
                return { color: '#ef4444', background: '#fef2f2', text: 'Đã từ chối' };
            default:
                return { color: '#64748b', background: '#f3f4f6', text: 'Không rõ' };
        }
    };

    const handleAction = (appId, status) => {
        if (window.confirm(`Bạn có chắc chắn muốn ${status === 'accepted' ? 'CHẤP NHẬN' : 'TỪ CHỐI'} hồ sơ này không?`)) {
            onApplicationAction(appId, status);
        }
    };

    const getOpportunityTitle = (opportunityId) => {
        const opp = opportunities.find(o => o.id === opportunityId);
        return opp ? opp.title : `Cơ hội #${opportunityId}`;
    };
 
    return (
        <div style={{ marginTop: '30px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Danh sách Ứng viên</h2>
            <div className="table-management">
                {applications.length === 0 ? (
                    <p>Chưa có ứng viên nào.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>ID Ứng viên</th>
                                <th style={{ width: '30%' }}>Ứng tuyển Cơ hội</th>
                                <th style={{ width: '15%' }}>Trạng thái</th>
                                <th style={{ width: '30%' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => {
                                const statusInfo = getStatusStyle(app.status);
                                const profile = app.student_profile || {};
                                const fullName = profile.full_name && profile.full_name.trim().length > 0
                                    ? profile.full_name
                                    : `Ứng viên #${app.student_user_id}`;
                                const cvDoc = (app.documents || []).find(doc => (doc.document_type || '').toLowerCase() === 'cv') || (app.documents || [])[0];
                                const cvUrl = cvDoc?.document_url
                                    ? (cvDoc.document_url.startsWith('http') ? cvDoc.document_url : `${BASE_URL}${cvDoc.document_url}`)
                                    : null;
                                    
                                // NEW FIELD
                                const hasUnread = app.has_unread_messages; 
                                
                                return (
                                    <tr key={app.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{fullName}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{profile.email || 'Chưa cập nhật email'}</div>
                                            {profile.gpa !== null && profile.gpa !== undefined && (
                                                <div style={{ fontSize: 12, color: '#475569' }}>GPA: {profile.gpa}</div>
                                            )}
                                            {profile.skills && (
                                                <div style={{ fontSize: 12, color: '#475569' }}>Kỹ năng: {profile.skills}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{getOpportunityTitle(app.opportunity_id)}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Mã hồ sơ: {app.id}</div>
                                        </td>
                                        <td>
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
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td style={{ display: 'flex', gap: '10px' }}>
                                            {cvUrl ? (
                                                <a 
                                                    href={cvUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Xem CV
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>Chưa có CV</span>
                                            )}
                                            <button
                                                onClick={() => onViewProfile(app)}
                                                className="btn btn-sm"
                                                style={{ backgroundColor: '#475569', color: '#fff' }}
                                            >
                                                Xem hồ sơ
                                            </button>
                                            <button
                                                onClick={() => onMessage(app)}
                                                className="btn btn-sm"
                                                style={{ backgroundColor: '#3b82f6', color: '#fff', position: 'relative' }} // NEW: position: 'relative'
                                                disabled={app.status !== 'accepted'}
                                            >
                                                Nhắn tin
                                                {/* CHẤM ĐỎ CHO PROVIDER */}
                                                {app.status === 'accepted' && hasUnread && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '-4px',
                                                        right: '-4px',
                                                        width: '8px',
                                                        height: '8px',
                                                        backgroundColor: '#ef4444',
                                                        borderRadius: '50%',
                                                        zIndex: 10
                                                    }}></span>
                                                )}
                                            </button>
                                             
                                             {(app.status === 'pending' || app.status === 'submitted') ? (
                                                 <>
                                                     <button 
                                                         onClick={() => handleAction(app.id, 'accepted')} 
                                                         className="btn btn-sm"
                                                         style={{ backgroundColor: '#10b981', color: 'white' }}
                                                     >
                                                         Chấp nhận
                                                     </button>
                                                     <button 
                                                         onClick={() => handleAction(app.id, 'rejected')} 
                                                         className="btn btn-sm btn-disabled"
                                                         style={{ backgroundColor: '#ef4444', color: 'white' }}
                                                     >
                                                         Từ chối
                                                     </button>
                                                 </>
                                             ) : (
                                                 <span style={{ color: '#64748b', fontSize: '12px', alignSelf: 'center' }}>Đã xử lý</span>
                                             )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};


// --- MAIN DASHBOARD COMPONENT ---

const ProviderDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [opportunities, setOpportunities] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const [selectedOpportunityId, setSelectedOpportunityId] = useState(null); 
    const [profileModalState, setProfileModalState] = useState({ isOpen: false, loading: false, error: '', profile: null, application: null });
    const [messageModalState, setMessageModalState] = useState({ isOpen: false, loading: false, error: '', conversation: null, messages: [], input: '', sending: false, application: null });
    
    const user = getStoredUser();
    const providerUserId = user?.id;

    async function fetchData() {
        if (!providerUserId) {
            setError('Không tìm thấy thông tin nhà cung cấp.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const oppsPromise = api.listOpportunities(); 
            const appsPromise = api.listProviderApplicationsEnriched(providerUserId);

            const [opps, apps] = await Promise.all([oppsPromise, appsPromise]);
            
            setOpportunities(opps || []);
            setApplications(apps || []);
        } catch (err) {
            setError(err.message || 'Lỗi tải dữ liệu dashboard.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            fetchData();
        }
        return () => { mounted = false; };
    }, [providerUserId]);

    // NEW: Hàm xử lý duyệt hồ sơ ứng viên
    const handleApplicationAction = async (appId, status) => {
        setError('');
        try {
            await api.updateApplicationStatus(appId, status);
            alert(`Đã cập nhật trạng thái hồ sơ #${appId} thành ${status}.`);
            fetchData();
        } catch (err) {
            setError(err.message || `Lỗi khi cập nhật trạng thái hồ sơ.`);
        }
    };

    const openProfileModal = async (application) => {
        setProfileModalState({ isOpen: true, loading: true, error: '', profile: null, application });
        try {
            let profile = application.student_profile;
            if (!profile) {
                profile = await api.getStudentProfileById(application.student_user_id);
            }
            setProfileModalState(prev => ({ ...prev, loading: false, profile }));
        } catch (err) {
            setProfileModalState(prev => ({ ...prev, loading: false, error: err.message || 'Không thể tải hồ sơ' }));
        }
    };

    const closeProfileModal = () => {
        setProfileModalState({ isOpen: false, loading: false, error: '', profile: null, application: null });
    };

    const openMessageModal = async (application) => {
        if (application.status !== 'accepted') {
            alert('Chỉ có thể nhắn tin sau khi hồ sơ đã được chấp nhận.');
            return;
        }
        setMessageModalState({ isOpen: true, loading: true, error: '', conversation: null, messages: [], input: '', sending: false, application });
        try {
            const conversation = await api.createConversation(providerUserId, application.student_user_id,application.id);// THAY ĐỔI: Truyền thêm application.id
            const msgs = await api.listMessages(conversation.id);
            
            // NEW: Mark messages as read after loading them (for the Provider)
            if (application.has_unread_messages && msgs.length > 0) {
                // Chỉ mark read những tin nhắn gửi đến Provider
                await api.markConversationAsRead(conversation.id, providerUserId); 
                // Sau khi mark read, cần fetch lại list apps để update unread dot
                fetchData(); 
            }

            setMessageModalState(prev => ({ ...prev, loading: false, conversation, messages: msgs || [] }));
        } catch (err) {
            setMessageModalState(prev => ({ ...prev, loading: false, error: err.message || 'Không thể tải hội thoại' }));
        }
    };

    const closeMessageModal = () => {
        setMessageModalState({ isOpen: false, loading: false, error: '', conversation: null, messages: [], input: '', sending: false, application: null });
    };

    const handleMessageInputChange = (value) => {
        setMessageModalState(prev => ({ ...prev, input: value }));
    };

    const handleSendMessage = async () => {
        if (!messageModalState.conversation || !messageModalState.input.trim()) {
            return;
        }
        setMessageModalState(prev => ({ ...prev, sending: true, error: '' }));
        try {
            const msg = await api.sendMessage({
                conversation_id: messageModalState.conversation.id,
                sender_user_id: providerUserId,
                receiver_user_id: messageModalState.application.student_user_id,
                content: messageModalState.input.trim()
            });
            setMessageModalState(prev => ({
                ...prev,
                sending: false,
                input: '',
                messages: [...prev.messages, msg]
            }));
        } catch (err) {
            setMessageModalState(prev => ({ ...prev, sending: false, error: err.message || 'Không thể gửi tin nhắn' }));
        }
    };


    const handleOpportunityAction = async (action, id, payload) => {
        setError('');
        try {
            if (action === 'create') {
                setEditingOpportunity(null); 
                setIsCreateModalOpen(true);
                return; 
            }
            
            if (action === 'edit') {
                setEditingOpportunity(payload); 
                setIsCreateModalOpen(true);
                return; 
            }
            
            if (action === 'viewDetail') {
                setSelectedOpportunityId(id); 
                return; 
            }


            if (action === 'saveNew') {
                const { opportunity, criteria } = payload;
                const createPayload = {
                    ...opportunity,
                    provider_user_id: providerUserId,
                    criteria,
                };
                await api.createOpportunity(createPayload); 
                alert('Đã thêm cơ hội thành công!');

            } else if (action === 'saveUpdate') {
                const { opportunity, criteria } = payload;
                const updatePayload = {
                    ...opportunity,
                    criteria,
                };
                await api.updateOpportunity(id, updatePayload);
                alert('Đã cập nhật cơ hội thành công!');

            } else if (action === 'delete') {
                await api.deleteOpportunity(id);
                alert('Đã xóa cơ hội thành công!');
            }

            setIsCreateModalOpen(false);
            setEditingOpportunity(null);
            fetchData(); 

        } catch (err) {
            setError(err.message || `Lỗi khi thực hiện hành động ${action}`);
        }
    };


    const stats = useMemo(() => {
        const totalOpportunities = opportunities.length;
        const totalApplications = applications.length;
        
        const pendingApplications = applications.filter(app => 
            app.status === 'pending' || app.status === 'submitted'
        ).length;
        return [
            { title: 'Tổng số cơ hội', value: totalOpportunities, icon: '📝', color: '#3b82f6' },
            { title: 'Tổng ứng viên', value: totalApplications, icon: '👥', color: '#f59e0b' },
            { title: 'Ứng viên chờ duyệt', value: pendingApplications, icon: '⏳', color: '#ef4444' },
        ];
    }, [opportunities, applications]);

    const renderContent = () => {
        if (loading) {
            return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải dữ liệu...</div>;
        }

        if (error) {
             return <div className="alert-error" style={{ marginTop: '20px' }}>Lỗi: {error}</div>;
        }
        
        switch (activeTab) {
            case 'overview':
                return (
                    <>
                        <h1 style={{ fontSize: '28px', color: '#1f2937' }}>Tổng quan Dashboard</h1>
                       <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '20px' }}>
                            {stats.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>
                        <div className="card" style={{ marginTop: '40px' }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Hoạt động gần đây</h2>
                            <p>Đã tải thành công {applications.length} hồ sơ và {opportunities.length} cơ hội.</p>
                        </div>
                    </>
                );
            case 'opportunities':
                return (
                    <OpportunitiesManagement 
                        opportunities={opportunities} 
                        onOpportunityAction={handleOpportunityAction} 
                    />
                );
            case 'applicants':
                return (
                    <ApplicantsList 
                        applications={applications} 
                        opportunities={opportunities}
                        onViewProfile={openProfileModal}
                        onMessage={openMessageModal}
                        onApplicationAction={handleApplicationAction}
                    />
                );
            case 'settings':
                return <div><h1 style={{ fontSize: '28px', color: '#1f2937' }}>Cài đặt Tài khoản</h1><p style={{marginTop: '15px'}}>Quản lý thông tin công ty, hồ sơ nhà cung cấp và các thiết lập hệ thống.</p></div>;
            default:
                return <div>Chọn một tab để xem nội dung.</div>;
        }
    };

    return (
        <div className="flex">
            <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

            <div className="dashboard-content">
                {renderContent()}
            </div>


            <OpportunityModal 
                isOpen={isCreateModalOpen} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingOpportunity(null); 
                }} 
                onSave={(payload) => handleOpportunityAction(
                    editingOpportunity ? 'saveUpdate' : 'saveNew', 
                    editingOpportunity ? editingOpportunity.id : null, 
                    payload 
                )}
                existingData={editingOpportunity} 
            />

            <OpportunityDetailModal 
                opportunityId={selectedOpportunityId} 
                onClose={() => setSelectedOpportunityId(null)} 
            />

            <StudentProfileModal 
                isOpen={profileModalState.isOpen} 
                loading={profileModalState.loading} 
                error={profileModalState.error} 
                profile={profileModalState.profile} 
                application={profileModalState.application} 
                onClose={closeProfileModal} 
            />

            <MessageModal 
                isOpen={messageModalState.isOpen} 
                loading={messageModalState.loading} 
                error={messageModalState.error} 
                messages={messageModalState.messages} 
                input={messageModalState.input} 
                onInputChange={handleMessageInputChange} 
                onSend={handleSendMessage} 
                onClose={closeMessageModal} 
                sending={messageModalState.sending} 
                partnerName={messageModalState.application?.student_profile?.full_name || `Ứng viên #${messageModalState.application?.student_user_id ?? ''}`} 
                currentUserId={providerUserId} 
            />
        </div>
    );
};

export default ProviderDashboard;