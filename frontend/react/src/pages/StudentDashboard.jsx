import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './StudentDashboard.module.css'; 
// 1. Import hook
import { useTranslation } from 'react-i18next';

const StudentMessageModal = ({
    isOpen,
    loading,
    error,
    messages,
    input,
    onInputChange,
    onSend,
    onClose,
    sending,
    currentUserId,
    opportunityTitle
}) => {
    // 2. Khởi tạo hook trong component con
    const { t } = useTranslation();
    const messagesEndRef = useRef(null); 
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    
    if (!isOpen) return null;
    // 3. Thay thế strings
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>{t('studentDashboardPage.modal_chatTitle', { title: opportunityTitle })}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                {loading ? (
                    <div style={{ padding: 16, textAlign: 'center' }}>{t('common.loading')}</div>
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
                            alignContent: 'end'
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
                                <div style={{ textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>{t('studentDashboardPage.modal_chat_empty')}</div>
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
                                placeholder={t('studentDashboardPage.modal_chat_placeholder')}
                                style={{ flex: 1 }}
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


// --- COMPONENT CON 2: OPPORTUNITY DETAIL MODAL ---
const OpportunityDetailModal = ({
  isOpen,
  detail,
  loading,
  error,
  onClose,
  onApply,
  hasApplied,
  submitting
}) => {
  // 2. Khởi tạo hook
  const { t } = useTranslation();
  if (!isOpen) return null;

  const renderCriteriaList = (label, items) => (
    <div style={{ fontSize: 14 }}>
      <strong>{label}:</strong> {items && items.length ? items.join(', ') : 'Không yêu cầu cụ thể'}
    </div>
  );

  // 3. Thay thế strings
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3>{t('studentDashboardPage.modal_opportunityDetails')}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div style={{ padding: 16, textAlign: 'center' }}>{t('studentDashboardPage.modal_loading')}</div>
        ) : error ? (
          <div className="alert-error">{error}</div>
        ) : detail ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0' }}>{detail.title}</h2>
              <span style={{ background: '#e0ecff', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#1d4ed8' }}>
                {detail.type}
              </span>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
              <strong>Mô tả</strong>
              <p style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{detail.description}</p>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>ID cơ hội:</strong> {detail.id}</div>
              <div><strong>Ngày tạo:</strong> {new Date(detail.created_at).toLocaleDateString()}</div>
            </div>
            {detail.criteria && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Tiêu chí tuyển chọn</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>GPA tối thiểu:</strong> {detail.criteria.gpa_min ?? 'Không yêu cầu'}</div>
                  {detail.criteria.deadline && (
                    <div><strong>Hạn nộp:</strong> {new Date(detail.criteria.deadline).toLocaleDateString()}</div>
                  )}
                  {renderCriteriaList('Kỹ năng', detail.criteria.skills)}
                  {renderCriteriaList('Tài liệu yêu cầu', detail.criteria.required_documents)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button
                className={`btn ${hasApplied ? 'btn-disabled' : 'btn-secondary'}`}
                onClick={onApply}
                disabled={submitting || hasApplied}
              >
                {hasApplied ? t('studentDashboardPage.modal_applied') : submitting ? t('studentDashboardPage.modal_applying') : t('studentDashboardPage.modal_apply')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};


// --- COMPONENT CON 3: MY APPLICATIONS SUMMARY ---
const MyApplicationsSummary = ({ applications, opportunities, onOpenChat }) => {
    // 2. Khởi tạo hook
    const { t } = useTranslation();


    if (!applications || applications.length === 0) {
        return (
            <div className="card" style={{ padding: '15px', textAlign: 'center', color: '#64748b', marginTop: '15px' }}>
                {t('studentDashboardPage.noApplications')}
            </div>
        );
    }

    const getOpportunityTitle = (opportunityId) => {
        const opp = opportunities.find(o => o.id === opportunityId);
        if (opp) return opp.title;
        const appWithOpp = applications.find(app => app.opportunity?.id === opportunityId);
        return appWithOpp?.opportunity?.title || `[Cơ hội #${opportunityId}]`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
            case 'submitted':
                return { color: '#f59e0b', background: '#fffbeb' };
            case 'reviewed':
            case 'viewed': // Thêm
                return { color: '#3b82f6', background: '#eff6ff' };
            case 'interview': // Thêm
                return { color: '#8b5cf6', background: '#f5f3ff' };
            case 'accepted':
                return { color: '#10b981', background: '#ecfdf5' };
            case 'rejected':
                return { color: '#ef4444', background: '#fef2f2' };
            default:
                return { color: '#64748b', background: '#f3f4f6' };
        }
    };

    // 3. Thay thế strings
    const getStatusText = (status) => {
        // Dùng key-safe fallback
        const key = `studentDashboardPage.status_${status}`;
        const defaultText = status || t('studentDashboardPage.status_unknown');
        return t(key, defaultText);
    };

    return (
        <div style={{ marginTop: '15px' }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {applications.map((app) => {
                    const statusInfo = getStatusStyle(app.status);
                    const oppTitle = getOpportunityTitle(app.opportunity_id);
                    const isChatEnabled = app.status === 'accepted'; 
                    const hasUnread = app.has_unread_messages; 
                    
                    return (
                        <div 
                            key={app.id} 
                            className="card" 
                            style={{ 
                                borderLeft: `5px solid ${statusInfo.color}`, 
                                padding: '15px', 
                                cursor: isChatEnabled ? 'pointer' : 'default', 
                                position: 'relative' 
                            }}
                            onClick={() => isChatEnabled && onOpenChat(app, oppTitle)}   >
                            {isChatEnabled && hasUnread && (
                                <span style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '50%',
                                    zIndex: 10
                                }}></span>
                            )}
                            <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                                {oppTitle}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: '10px' }}>
                                {t('studentDashboardPage.submittedOn', { date: new Date(app.submitted_at).toLocaleDateString() })}
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
                                {t('studentDashboardPage.status', { statusText: getStatusText(app.status) })}
                            </span>
                            {isChatEnabled && (
                                <div style={{ marginTop: 10, fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                                    {t('studentDashboardPage.chatPrompt')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


function StudentDashboard() {
  // 2. Khởi tạo hook
  const { t } = useTranslation();

  const [applications, setApplications] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [selectedOpportunityDetail, setSelectedOpportunityDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [messageModalState, setMessageModalState] = useState({ 
    isOpen: false, 
    loading: false, 
    error: '', 
    conversation: null, 
    messages: [], 
    input: '', 
    sending: false, 
    application: null,
    opportunityTitle: ''
  });


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
        setError(err.message || t('common.error'));
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchAllData();
    return () => { mounted = false; };
  }, [studentUserId, t]); // Thêm t vào dependency array

  const hasApplied = (opportunityId) => {
    return applications.some(app => app.opportunity_id === opportunityId);
  };

  async function openOpportunityDetail(opportunityId) {
    setSelectedOpportunityId(opportunityId);
    setDetailLoading(true);
    setDetailError('');
    setSelectedOpportunityDetail(null);
    try {
      const detail = await api.getOpportunity(opportunityId);
      setSelectedOpportunityDetail(detail);
    } catch (err) {
      setDetailError(err.message || t('studentDashboardPage.modal_loadError'));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeOpportunityDetail() {
    setSelectedOpportunityId(null);
    setSelectedOpportunityDetail(null);
    setDetailError('');
  }

  async function submitApplication(opportunityId) {
    if (!studentUserId) return;
    setSubmitting(true);
    setError('');
    
    if (hasApplied(opportunityId)) {
        setError(t('studentDashboardPage.error_already_applied'));
        setSubmitting(false);
        return;
    }

    try {
      const payload = {
        opportunity_id: opportunityId,
        student_user_id: studentUserId
      };
      
      await api.submitApplication(payload);
      
      await fetchAllData(); 
      alert(t('studentDashboardPage.success_apply'));
      if (selectedOpportunityId === opportunityId) {
        closeOpportunityDetail();
      }
    } catch (err) {
      setError(err.message || t('studentDashboardPage.error_apply'));
    } finally {
      setSubmitting(false);
    }
  }

  const openMessageModal = async (application, opportunityTitle) => {
    if (application.status !== 'accepted') {
        alert(t('studentDashboardPage.modal_chat_only_accepted'));
        return;
    }
    
    const providerUserId = application.provider_user_id;

    setMessageModalState({ 
        isOpen: true, 
        loading: true, 
        error: '', 
        conversation: null, 
        messages: [], 
        input: '', 
        sending: false, 
        application,
        opportunityTitle
    });
    
    try {
        const conversation = await api.createConversation(
            studentUserId, 
            providerUserId,
            application.id 
        );
        const msgs = await api.listMessages(conversation.id);
        
        if (application.has_unread_messages && msgs.length > 0) {
            await api.markConversationAsRead(conversation.id, studentUserId); 
            fetchAllData(); 
        }
        
        setMessageModalState(prev => ({ 
            ...prev, 
            loading: false, 
            conversation, 
            messages: msgs || [],
            error: ''
        }));
    } catch (err) {
        setMessageModalState(prev => ({ 
            ...prev, 
            loading: false, 
            error: err.message || t('studentDashboardPage.modal_chat_load_error')
        }));
    }
  };

  const closeMessageModal = () => {
    setMessageModalState({ 
        isOpen: false, 
        loading: false, 
        error: '', 
        conversation: null, 
        messages: [], 
        input: '', 
        sending: false, 
        application: null,
        opportunityTitle: ''
    });
  };

  const handleMessageInputChange = (value) => {
    setMessageModalState(prev => ({ ...prev, input: value }));
  };

  const handleSendMessage = async () => {
    if (!messageModalState.conversation || !messageModalState.input.trim()) {
        return;
    }
    
    const providerUserId = messageModalState.application.provider_user_id;

    setMessageModalState(prev => ({ ...prev, sending: true, error: '' }));
    try {
        const msg = await api.sendMessage({
            conversation_id: messageModalState.conversation.id,
            sender_user_id: studentUserId, 
            receiver_user_id: providerUserId, 
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

  // 3. Thay thế strings
  return (

    <div className="container p-6">
      <h2>{t('studentDashboardPage.title')}</h2>

      
      {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>} 

      <h3 style={{ marginTop: 24, marginBottom: 10 }}>{t('studentDashboardPage.myApplicationsTitle')}</h3>
      <MyApplicationsSummary 
        applications={applications} 
        opportunities={opportunities} 
        onOpenChat={openMessageModal} 
      />

      <h3 style={{ marginTop: 40, marginBottom: 15 }}>{t('studentDashboardPage.opportunitiesTitle')}</h3>
      
      <div className={styles.list}> 
        {(opportunities || []).map((opp) => {
            const applied = hasApplied(opp.id);
            return (
                <div
                  key={opp.id}
                  className={styles.card} 
                  onClick={() => openOpportunityDetail(opp.id)}
                  style={{ cursor: 'pointer' }}
                >
                    <div className={styles.title}>{opp.title}</div> 
                    <div className={styles.description}>{opp.description}</div> 
                    <button
                        disabled={submitting || applied} 
                        onClick={(e) => {
                          e.stopPropagation();
                          submitApplication(opp.id);
                        }}
                        className={`btn ${applied ? 'btn-disabled' : 'btn-secondary'}`} 
                        style={{ marginTop: 8 }}
                    >
                        {applied ? t('studentDashboardPage.appliedButton') : submitting ? t('studentDashboardPage.applyingButton') : t('studentDashboardPage.applyButton')}
                    </button>
                </div>
            );
        })}
      </div>

      <OpportunityDetailModal
        isOpen={selectedOpportunityId !== null}
        detail={selectedOpportunityDetail}
        loading={detailLoading}
        error={detailError}
        onClose={closeOpportunityDetail}
        onApply={() => submitApplication(selectedOpportunityId)}
        hasApplied={selectedOpportunityId ? hasApplied(selectedOpportunityId) : false}
        submitting={submitting}
      />
      
      
      <StudentMessageModal 
          isOpen={messageModalState.isOpen} 
          loading={messageModalState.loading} 
          error={messageModalState.error} 
          messages={messageModalState.messages} 
          input={messageModalState.input} 
          onInputChange={handleMessageInputChange} 
          onSend={handleSendMessage} 
          onClose={closeMessageModal} 
          sending={messageModalState.sending} 
          currentUserId={studentUserId}
          opportunityTitle={messageModalState.opportunityTitle}
      />
    </div>
  );
}

export default StudentDashboard;