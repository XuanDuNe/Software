// src/pages/ProviderDashboard.jsx (Sửa đổi toàn bộ)

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';

// --- HELPER COMPONENTS ---

// Component Placeholder: Card thống kê nhanh (Giữ nguyên)
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

// Component Placeholder: Thanh Sidebar (Giữ nguyên)
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

// Component Modal Thêm/Sửa Cơ hội (Giữ nguyên)
const OpportunityModal = ({ isOpen, onClose, onSave, existingData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('program');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (existingData) {
                setTitle(existingData.title);
                setDescription(existingData.description);
                const validType = ['scholarship', 'research_lab', 'program'].includes(existingData.type) 
                    ? existingData.type 
                    : 'program';
                setType(validType);
            } else {
                setTitle('');
                setDescription('');
                setType('program');
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
            await onSave({ title, description, type });
            onClose();
            setTitle('');
            setDescription('');
            setType('program');
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
                    <h3>Thêm Cơ hội Mới</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">Tên Cơ hội</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Loại Cơ hội</label>
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
                    <button type="submit" className="btn btn-secondary" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu Cơ hội'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// NEW Component: Modal Xem Chi tiết Cơ hội
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

                        {/* Thêm các thông tin chi tiết khác từ API nếu có */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                            <div><strong>ID Cơ hội:</strong> {detail.id}</div>
                            <div><strong>Người tạo:</strong> User #{detail.created_by_user_id || 'N/A'}</div>
                            <div><strong>Ngày tạo:</strong> {new Date(detail.created_at).toLocaleDateString()}</div>
                            {/* ... Các trường khác như requirements, location, etc. có thể thêm vào đây */}
                        </div>

                        {/* Có thể thêm phần quản lý tiêu chí ở đây nếu cần */}
                    </div>
                )}
            </div>
        </div>
    );
};


// Component Placeholder: Bảng Quản lý Cơ hội
const OpportunitiesManagement = ({ opportunities, onOpportunityAction }) => {
    
    // Hàm xử lý việc chuyển đổi trạng thái (Đóng/Mở)
    const handleToggleStatus = (opportunityId, currentStatus) => {
        const newStatus = currentStatus === 'open' ? 'closed' : 'open';
        onOpportunityAction('toggleStatus', opportunityId, newStatus);
    };

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
                                <th style={{ width: '40%' }}>Tên Cơ hội</th>
                                <th style={{ width: '15%' }}>Ứng viên</th>
                                <th style={{ width: '20%' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.map(opp => (
                                <tr key={opp.id}>
                                    <td>{opp.title}</td>
                                    <td>{opp.applications_count || 0}</td> 
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        {/* Nút Xem chi tiết */}
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
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// Component Placeholder: Bảng Ứng viên (Giữ nguyên)
const ApplicantsList = ({ applications, onApplicationAction }) => {
    
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
                                return (
                                    <tr key={app.id}>
                                        {/* Giả định API trả về student_user_id và có thể là student_name/opportunity_title */}
                                        <td>{app.student_name || `Ứng viên #${app.student_user_id}`}</td>
                                        <td>{app.opportunity_title || `Cơ hội #${app.opportunity_id}`}</td>
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
                                            {/* Nút Xem chi tiết CV (Giả định tài liệu có thể lấy qua app.documents[0].document_url) */}
                                            <a 
                                                href={app.documents?.[0]?.document_url || '#'} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn btn-sm btn-primary"
                                                disabled={!app.documents?.[0]?.document_url}
                                            >
                                                Xem CV
                                            </a>
                                            
                                            {/* Chỉ hiển thị nút duyệt khi trạng thái là 'pending' hoặc 'submitted' */}
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
            const appsPromise = api.listProviderApplications(providerUserId);

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
            // Tải lại dữ liệu sau khi duyệt thành công
            fetchData();
        } catch (err) {
            setError(err.message || `Lỗi khi cập nhật trạng thái hồ sơ.`);
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
                const newPayload = {
                    ...payload,
                    provider_user_id: providerUserId,
                };
                await api.createOpportunity(newPayload); 
                alert('Đã thêm cơ hội thành công!');

            } else if (action === 'saveUpdate') {
                // 'id' là opp.id, 'payload' là { title, description, type } từ modal
                await api.updateOpportunity(id, payload);
                alert('Đã cập nhật cơ hội thành công!');

            } else if (action === 'delete') {
                await api.deleteOpportunity(id);
                alert('Đã xóa cơ hội thành công!');
            }

            // Dọn dẹp và tải lại dữ liệu sau khi (saveNew, saveUpdate, delete)
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
                        onApplicationAction={handleApplicationAction} // Truyền hàm xử lý duyệt hồ sơ
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
        </div>
    );
};

export default ProviderDashboard;