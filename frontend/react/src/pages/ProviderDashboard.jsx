import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, BASE_URL } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './ProviderDashboard.module.css';
import { useTranslation } from 'react-i18next';


const StatCard = ({ title, value, icon, color }) => (
    <div className={styles.statCard} data-color={color || '#3b82f6'}>
        <div>
            <h3 className={styles.statTitle}>{title}</h3>
            <p className={styles.statValue}>{value}</p>
        </div>
        <div className={styles.statIcon} data-color={color || '#3b82f6'}>
            {icon}
        </div>
    </div>
);

const Sidebar = ({ activeTab, onSelectTab }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: 'overview', name: t('providerDashboardPage.sidebar.overview'), icon: '📊' },
        { id: 'opportunities', name: t('providerDashboardPage.sidebar.opportunities'), icon: '📋' },
        { id: 'applicants', name: t('providerDashboardPage.sidebar.applicants'), icon: '👥' },
    ];

    return (
        <div className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>{t('providerDashboardPage.sidebar.hubTitle')}</h2>

            <nav>
                {navItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`${styles.sidebarItem} ${activeTab === item.id ? styles.active : ''}`}
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
    const { t } = useTranslation();

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
            setError(err.message || t('providerDashboardPage.modals.error_save'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{existingData ? t('providerDashboardPage.modals.opp_edit_title') : t('providerDashboardPage.modals.opp_add_title')}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label className="label">{t('providerDashboardPage.modals.opp_name')}</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">{t('providerDashboardPage.modals.opp_type')}</label>
                        <select
                            className="input"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="program">{t('providerDashboardPage.modals.opp_type_program')}</option>
                            <option value="scholarship">{t('providerDashboardPage.modals.opp_type_scholarship')}</option>
                            <option value="research_lab">{t('providerDashboardPage.modals.opp_type_lab')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">{t('providerDashboardPage.modals.opp_desc')}</label>
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
                            <label className="label">{t('providerDashboardPage.modals.opp_gpa')}</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="4"
                                step="0.01"
                                value={gpaMin}
                                onChange={(e) => setGpaMin(e.target.value)}
                                placeholder={t('providerDashboardPage.modals.opp_gpa_placeholder')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">{t('providerDashboardPage.modals.opp_deadline')}</label>
                            <input
                                type="date"
                                className="input"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">{t('providerDashboardPage.modals.opp_skills')}</label>
                        <input
                            className="input"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder={t('providerDashboardPage.modals.opp_skills_placeholder')}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">{t('providerDashboardPage.modals.opp_docs')}</label>
                        <input
                            className="input"
                            value={requiredDocs}
                            onChange={(e) => setRequiredDocs(e.target.value)}
                            placeholder={t('providerDashboardPage.modals.opp_docs_placeholder')}
                        />
                    </div>

                    <button type="submit" className="btn btn-secondary" disabled={loading}>
                        {loading ? t('common.saving') : t('common.save')}
                    </button>
                </form>
            </div>
        </div>
    );
};

const OpportunityDetailModal = ({ opportunityId, onClose }) => {
    const { t } = useTranslation();
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
                setError(err.message || t('studentDashboardPage.modal_loadError')); 
                setLoading(false);
            });
    }, [opportunityId, t]);

    if (!opportunityId) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>{t('studentDashboardPage.modal_opportunityDetails')}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading && <div className="p-4" style={{ textAlign: 'center' }}>{t('common.loading')}</div>}
                {error && <div className="alert-error">{error}</div>}
                
                {detail && (
                    <div className={styles.detailContent}>
                        <h4 className={styles.detailHeaderTitle}>{detail.title}</h4>

                        <div className={styles.detailInfoCard}>
                            <strong className="label">{t('providerDashboardPage.modals.opp_desc')}:</strong>
                            <p className={styles.detailDescription}>{detail.description}</p>
                        </div>

                        <div className={styles.detailGrid}>
                            <div><strong>ID Cơ hội:</strong> {detail.id}</div>
                            <div><strong>{t('providerDashboardPage.modals.opp_type')}:</strong> {detail.type}</div>
                            <div><strong>Ngày tạo:</strong> {new Date(detail.created_at).toLocaleDateString()}</div>
                        </div>

                        {detail.criteria && (
                            <div className={styles.criteriaBox}>
                                <h5 className={styles.criteriaTitle}>Tiêu chí tuyển chọn</h5>
                                <div className={styles.criteriaList}>
                                    {detail.criteria.gpa_min !== null && (
                                        <div><strong>{t('providerDashboardPage.modals.opp_gpa')}:</strong> {detail.criteria.gpa_min}</div>
                                    )}
                                    {detail.criteria.deadline && (
                                        <div><strong>{t('providerDashboardPage.modals.opp_deadline')}:</strong> {new Date(detail.criteria.deadline).toLocaleDateString()}</div>
                                    )}
                                    <div>

                                        <strong>{t('providerDashboardPage.modals.opp_skills')}:</strong> {detail.criteria.skills?.length ? detail.criteria.skills.join(', ') : 'Không yêu cầu cụ thể'}

                                    </div>
                                    <div>
                                        <strong>{t('providerDashboardPage.modals.opp_docs')}:</strong> {detail.criteria.required_documents?.length ? detail.criteria.required_documents.join(', ') : 'CV'}
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
    const { t } = useTranslation();
    if (!isOpen) return null;
    
    const cvFileId = profile?.cv_file_id;
    const cvUrl = cvFileId ? api.getFileUrl(cvFileId) : (() => {
        const docs = application?.documents || [];
        const cvDoc = docs.find(doc => (doc.document_type || '').toLowerCase() === 'cv') || docs[0];
        return cvDoc?.document_url ? (cvDoc.document_url.startsWith('http') ? cvDoc.document_url : `${BASE_URL}${cvDoc.document_url}`) : null;
    })();
    const skills = profile?.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h3>{t('providerDashboardPage.modals.profile_title')}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading ? (
                    <div className="p-4" style={{ textAlign: 'center' }}>{t('providerDashboardPage.modals.profile_loading')}</div>
                ) : error ? (
                    <div className="alert-error">{error}</div>
                ) : profile ? (
                    <div className={styles.profileContainer}>
                        <div>
                            <h2 className={styles.profileHeader}>{profile.full_name || t('providerDashboardPage.applicants.applicantName', {id: application?.student_user_id})}</h2>
                            <div className={styles.profileContactInfo}>{profile.email || t('providerDashboardPage.modals.profile_no_email')}</div>
                            {profile.phone && <div className={styles.profileContactInfo}>{t('providerDashboardPage.modals.profile_phone', {phone: profile.phone})}</div>}
                        </div>
                        <div className={styles.profileStatGrid}>
                            <div><strong>{t('providerDashboardPage.modals.profile_gpa')}</strong> {profile.gpa ?? t('providerDashboardPage.modals.profile_no_update')}</div>
                            <div><strong>{t('providerDashboardPage.modals.profile_level')}</strong> {profile.education_level || t('providerDashboardPage.modals.profile_no_update')}</div>
                            <div><strong>{t('providerDashboardPage.modals.profile_major')}</strong> {profile.major || t('providerDashboardPage.modals.profile_no_update')}</div>
                        </div>
                        <div>
                            <strong>{t('providerDashboardPage.modals.profile_skills')}</strong>
                            <div className={styles.profileSkillBadgeContainer}>
                                {skills.length ? skills.map((skill, idx) => (
                                    <span key={idx} className={styles.profileSkillBadge}>{skill}</span>
                                )) : t('providerDashboardPage.modals.profile_no_update')}
                            </div>
                        </div>
                        {profile.achievements && (
                            <div>
                                <strong>{t('providerDashboardPage.modals.profile_achievements')}</strong>
                                <p className={styles.profileAchievementBox}>{profile.achievements}</p>
                            </div>
                        )}
                        {profile.research_interests && (
                            <div style={{marginTop: '16px'}}>
                                <strong>{t('providerDashboardPage.modals.profile_interests')}</strong>
                                <p style={{marginTop: '6px'}}>{profile.research_interests}</p>
                            </div>
                        )}
                        {profile.thesis_topic && (
                            <div style={{marginTop: '16px'}}>
                                <strong>{t('providerDashboardPage.modals.profile_thesis')}</strong>
                                <p style={{marginTop: '6px'}}>{profile.thesis_topic}</p>
                            </div>
                        )}
                        <div>
                            <strong>{t('providerDashboardPage.modals.profile_documents')}</strong>
                            <div className={styles.profileDocumentSection}>
                                {cvUrl ? (
                                    <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                        {t('providerDashboardPage.applicants.action_viewCV')}
                                    </a>
                                ) : (
                                    <span className={styles.profileNoCv}>{t('providerDashboardPage.modals.profile_no_cv')}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4" style={{ textAlign: 'center', color: '#64748b' }}>{t('providerDashboardPage.modals.profile_no_data')}</div>
                )}
            </div>
        </div>
    );
};

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
    const { t } = useTranslation();
    const messagesEndRef = useRef(null); 
    
    

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>{t('providerDashboardPage.modals.chat_title', { name: partnerName })}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading ? (
                    <div className="p-4" style={{ textAlign: 'center' }}>{t('common.loading')}</div>
                ) : (
                    <div className={styles.chatContainer}>
                        {error && <div className="alert-error">{error}</div>}
                        <div className={styles.messageArea}>
                            {messages && messages.length ? messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`${styles.messageItem} ${msg.sender_user_id === currentUserId ? styles.messageSent : styles.messageReceived}`}
                                >
                                    <div className={styles.messageContent}>{msg.content}</div>
                                    <div className={styles.messageDate}>{new Date(msg.created_at).toLocaleString()}</div>
                                </div>
                            )) : (
                                <div className={styles.chatEmpty}>{t('providerDashboardPage.modals.chat_empty', 'Chưa có tin nhắn.')}</div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSend();
                            }}
                            className={styles.chatForm}
                        >
                            <input
                                className={`input ${styles.chatInput}`}
                                value={input}
                                onChange={(e) => onInputChange(e.target.value)}
                                placeholder={t('providerDashboardPage.modals.chat_placeholder', 'Nhập tin nhắn...')}
                            />
                            <button
                                type="submit"
                                className="btn btn-secondary"
                                disabled={sending || !input.trim()}
                            >
                                {sending ? t('common.sending', 'Đang gửi...') : t('common.send', 'Gửi')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};


const OpportunitiesManagement = ({ opportunities, onOpportunityAction }) => {
    const { t } = useTranslation();

    const handleDelete = (opportunityId, title) => {
        if (window.confirm(t('providerDashboardPage.opportunities.confirmDelete', { title }))) {
            onOpportunityAction('delete', opportunityId);
        }
    };
    
    const handleViewDetail = (opportunityId) => {
        onOpportunityAction('viewDetail', opportunityId);
    };

    return (
        <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>{t('providerDashboardPage.opportunities.title')}</h2>
                <button className="btn btn-secondary" onClick={() => onOpportunityAction('create')}>
                    {t('providerDashboardPage.opportunities.addNew')}
                </button>
            </div>
            
            <div className={styles.tableManagement}>
                {opportunities.length === 0 ? (
                    <p>{t('providerDashboardPage.opportunities.noOpportunities')}</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>{t('providerDashboardPage.opportunities.header_name')}</th>
                                <th style={{ width: '25%' }}>{t('providerDashboardPage.opportunities.header_criteria')}</th>
                                <th style={{ width: '10%' }}>{t('providerDashboardPage.opportunities.header_applicants')}</th>
                                <th style={{ width: '20%' }}>{t('providerDashboardPage.opportunities.header_action')}</th>
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
                                            {criteria.gpa_min 
                                                ? <div>{t('providerDashboardPage.opportunities.criteria_gpa', { gpa: criteria.gpa_min })}</div> 
                                                : <div>{t('providerDashboardPage.opportunities.criteria_no_gpa')}</div>
                                            }
                                            <div>
                                                <strong>{t('providerDashboardPage.opportunities.criteria_skills_label')}</strong>
                                                {' '}
                                                {criteria.skills?.length 
                                                    ? criteria.skills.join(', ') 
                                                    : t('providerDashboardPage.opportunities.criteria_skills_none')
                                                }
                                            </div>
                                            {criteria.deadline && (
                                                <div>
                                                    <strong>{t('providerDashboardPage.opportunities.criteria_deadline_label')}</strong>
                                                    {' '}
                                                    {new Date(criteria.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>

                                        <td>{opp.applications_count || 0}</td> 
                                        <td style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleViewDetail(opp.id)} 
                                                className={styles.actionLink}
                                            >
                                                {t('providerDashboardPage.opportunities.action_view')}
                                            </button> 
                                            |
                                            <button 
                                                onClick={() => onOpportunityAction('edit', opp.id, opp)} 
                                                className={styles.actionLink}
                                                data-color="edit"
                                            >
                                                {t('providerDashboardPage.opportunities.action_edit')}
                                            </button>
                                            |
                                            <button 
                                                onClick={() => handleDelete(opp.id, opp.title)} 
                                                className={`${styles.actionLink} ${styles.delete}`}
                                            >
                                                {t('providerDashboardPage.opportunities.action_delete')}
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

const ApplicantsList = ({ applications, opportunities, onViewProfile = () => {}, onMessage = () => {}, onApplicationAction }) => {
    const { t } = useTranslation();
    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
            case 'submitted':
                return styles.statusSubmitted;
            case 'reviewed':
            case 'viewed':
                return styles.statusViewed;
            case 'interview':
                return styles.statusInterview;
            case 'accepted':
                return styles.statusAccepted;
            case 'rejected':
                return styles.statusRejected;
            default:
                return styles.statusUnknown;
        }
    };
    
    const getStatusText = (status) => {
        const key = `studentDashboardPage.status_${status}`; 
        const defaultText = status || t('studentDashboardPage.status_unknown');
        return t(key, defaultText);
    };


    const handleAction = (appId, status) => {
        const actionText = status === 'accepted' ? t('providerDashboardPage.applicants.action_accept_confirm') : t('providerDashboardPage.applicants.action_reject_confirm');
        if (window.confirm(t('providerDashboardPage.applicants.confirmAction', { action: actionText }))) {
            onApplicationAction(appId, status);
        }
    };

    const getOpportunityTitle = (opportunityId) => {
        const opp = opportunities.find(o => o.id === opportunityId);
        return opp ? opp.title : t('providerDashboardPage.applicants.opportunityTitle', {id: opportunityId});
    };
 
    return (
        <div style={{ marginTop: '30px' }}>

            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>{t('providerDashboardPage.applicants.title')}</h2>

            <div className={styles.tableManagement}>
                {applications.length === 0 ? (
                    <p>{t('providerDashboardPage.applicants.noApplicants')}</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>{t('providerDashboardPage.applicants.header_id')}</th>
                                <th style={{ width: '30%' }}>{t('providerDashboardPage.applicants.header_opportunity')}</th>
                                <th style={{ width: '15%' }}>{t('providerDashboardPage.applicants.header_status')}</th>
                                <th style={{ width: '30%' }}>{t('providerDashboardPage.applicants.header_action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => {
                                const statusClass = getStatusClass(app.status);
                                const profile = app.student_profile || {};
                                const fullName = profile.full_name && profile.full_name.trim().length > 0
                                    ? profile.full_name
                                    : t('providerDashboardPage.applicants.applicantName', {id: app.student_user_id});
                                
                                const cvFileId = profile.cv_file_id;
                                const cvUrl = cvFileId ? api.getFileUrl(cvFileId) : (() => {
                                    const cvDoc = (app.documents || []).find(doc => (doc.document_type || '').toLowerCase() === 'cv') || (app.documents || [])[0];
                                    return cvDoc?.document_url
                                        ? (cvDoc.document_url.startsWith('http') ? cvDoc.document_url : `${BASE_URL}${cvDoc.document_url}`)
                                        : null;
                                })();
                                    
                                const hasUnread = app.has_unread_messages; 
                                
                                return (
                                    <tr key={app.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{fullName}</div>
                                            <div className={styles.applicantDetail}>{profile.email || t('providerDashboardPage.applicants.applicantEmail')}</div>
                                            {profile.gpa !== null && profile.gpa !== undefined && (
                                                <div className={styles.applicantGpaSkills}>{t('providerDashboardPage.applicants.applicantGPA', {gpa: profile.gpa})}</div>
                                            )}
                                            {profile.skills && (
                                                <div className={styles.applicantGpaSkills}>{t('providerDashboardPage.applicants.applicantSkills', {skills: profile.skills})}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className={styles.applicationInfo}>{getOpportunityTitle(app.opportunity_id)}</div>
                                            <div className={styles.applicantDetail}>{t('providerDashboardPage.applicants.applicationId', {id: app.id})}</div>
                                        </td>
                                        <td>
                                            <span 
                                                className={`${styles.statusBadge} ${statusClass}`}
                                            >
                                                {getStatusText(app.status)}
                                            </span>
                                        </td>
                                        <td className={styles.actionButtons}>

                                            {cvUrl ? (
                                                <a 
                                                    href={cvUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    {t('providerDashboardPage.applicants.action_viewCV')}
                                                </a>
                                            ) : (
                                                <span className={styles.actionProcessed}>{t('providerDashboardPage.applicants.noCV')}</span>
                                            )}
                                            <button
                                                onClick={() => onViewProfile(app)}
                                                className={`btn btn-sm ${styles.actionViewProfile}`}
                                            >
                                                {t('providerDashboardPage.applicants.action_viewProfile')}
                                            </button>
                                            <button
                                                onClick={() => onMessage(app)}
                                                className={`btn btn-sm ${styles.actionMessage}`}
                                                disabled={app.status !== 'accepted'}
                                            >
                                                {t('providerDashboardPage.applicants.action_message')}
                                                {app.status === 'accepted' && hasUnread && (
                                                    <span className={styles.actionMessageUnread}></span>
                                                )}
                                            </button>
                                             
                                             {(app.status === 'pending' || app.status === 'submitted') ? (
                                                 <>
                                                     <button 
                                                         onClick={() => handleAction(app.id, 'accepted')} 
                                                         className={`btn btn-sm ${styles.actionAccept}`}
                                                     >
                                                         {t('providerDashboardPage.applicants.action_accept')}
                                                     </button>
                                                     <button 
                                                         onClick={() => handleAction(app.id, 'rejected')} 
                                                         className={`btn btn-sm ${styles.actionReject}`}
                                                     >
                                                         {t('providerDashboardPage.applicants.action_reject')}
                                                     </button>
                                                 </>
                                             ) : (
                                                 <span className={styles.actionProcessed}>{t('providerDashboardPage.applicants.action_processed')}</span>
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



const ProviderDashboard = () => {
    const { t } = useTranslation();
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
            setError(t('providerDashboardPage.applicants.error_noProvider'));
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
            setError(err.message || t('common.error'));
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
    }, [providerUserId, t]); 

    const handleApplicationAction = async (appId, status) => {
        setError('');
        try {
            await api.updateApplicationStatus(appId, status);
            alert(t('providerDashboardPage.applicants.alert_statusUpdated', { appId, status }));
            fetchData();
        } catch (err) {
            setError(err.message || t('providerDashboardPage.applicants.error_statusUpdate'));
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
            setProfileModalState(prev => ({ ...prev, loading: false, error: err.message || t('studentDashboardPage.modal_loadError') }));
        }
    };

    const closeProfileModal = () => {
        setProfileModalState({ isOpen: false, loading: false, error: '', profile: null, application: null });
    };

    const openMessageModal = async (application) => {
        if (application.status !== 'accepted') {
            alert(t('studentDashboardPage.modal_chat_only_accepted'));
            return;
        }
        setMessageModalState({ isOpen: true, loading: true, error: '', conversation: null, messages: [], input: '', sending: false, application });
        try {
            const conversation = await api.createConversation(providerUserId, application.student_user_id,application.id);
            const msgs = await api.listMessages(conversation.id);
            
            if (application.has_unread_messages && msgs.length > 0) {
                await api.markConversationAsRead(conversation.id, providerUserId); 
                fetchData(); 
            }

            setMessageModalState(prev => ({ ...prev, loading: false, conversation, messages: msgs || [] }));

        } catch (err) {
            setMessageModalState(prev => ({ ...prev, loading: false, error: err.message || t('studentDashboardPage.modal_chat_load_error') }));

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
            setMessageModalState(prev => ({ ...prev, sending: false, error: err.message || t('studentDashboardPage.modal_chat_send_error') }));
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
                alert(t('providerDashboardPage.opportunities.alert_added'));

            } else if (action === 'saveUpdate') {
                const { opportunity, criteria } = payload;
                const updatePayload = {
                    ...opportunity,
                    criteria,
                };
                await api.updateOpportunity(id, updatePayload);
                alert(t('providerDashboardPage.opportunities.alert_updated'));

            } else if (action === 'delete') {
                await api.deleteOpportunity(id);
                alert(t('providerDashboardPage.opportunities.alert_deleted'));
            }

            setIsCreateModalOpen(false);
            setEditingOpportunity(null);
            fetchData(); 

        } catch (err) {
            setError(err.message || `${t('common.error')} ${action}`);
        }
    };


    const stats = useMemo(() => {
        const totalOpportunities = opportunities.length;
        const totalApplications = applications.length;
        
        const pendingApplications = applications.filter(app => 
            app.status === 'pending' || app.status === 'submitted'
        ).length;
        return [
            { title: t('providerDashboardPage.stats.totalOpportunities'), value: totalOpportunities, icon: '📝', color: '#3b82f6' },
            { title: t('providerDashboardPage.stats.totalApplicants'), value: totalApplications, icon: '👥', color: '#f59e0b' },
            { title: t('providerDashboardPage.stats.pendingApplicants'), value: pendingApplications, icon: '⏳', color: '#ef4444' },
        ];
    }, [opportunities, applications, t]); 

    const renderContent = () => {
        if (loading) {
            return <div style={{ textAlign: 'center', marginTop: '50px' }}>{t('common.loading')}</div>;
        }

        if (error) {
             return <div className="alert-error" style={{ marginTop: '20px' }}>{t('common.error')}: {error}</div>;
        }
        
        switch (activeTab) {
            case 'overview':
                return (
                    <>

                        <h1 style={{ fontSize: '28px', color: '#1f2937' }}>{t('providerDashboardPage.overview.title')}</h1>
                       <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginTop: '20px' }}>

                            {stats.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>
                        <div className="card" style={{ marginTop: '40px' }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>{t('providerDashboardPage.overview.recentActivity')}</h2>
                            <p>{t('providerDashboardPage.overview.loadedSummary', { appCount: applications.length, oppCount: opportunities.length })}</p>
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
                return (
                    <div>
                        <h1 style={{ fontSize: '28px', color: '#1f2937' }}>{t('providerDashboardPage.settings.title')}</h1>
                        <p style={{marginTop: '15px'}}>{t('providerDashboardPage.settings.subtitle')}</p>
                    </div>
                );
            default:
                return <div>Chọn một tab để xem nội dung.</div>;
        }
    };

    return (
        <div className="flex"> 
            <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

            <div className={styles.dashboardContent}>
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
                partnerName={messageModalState.application?.student_profile?.full_name || t('providerDashboardPage.applicants.applicantName', { id: messageModalState.application?.student_user_id ?? '' })} 
                currentUserId={providerUserId} 
            />
        </div>
    );
};

export default ProviderDashboard;