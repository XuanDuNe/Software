import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './StudentDashboard.module.css'; 
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
                    <h3>{t('studentDashboardPage.modal_chatTitle', { title: opportunityTitle })}</h3>
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
                                <div className={styles.chatEmpty}>{t('studentDashboardPage.modal_chat_empty')}</div>
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
                                placeholder={t('studentDashboardPage.modal_chat_placeholder')}
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
  const { t } = useTranslation();
  if (!isOpen) return null;

  const renderCriteriaList = (label, items) => (
    <div style={{ fontSize: 14 }}>
      <strong>{label}:</strong> {items && items.length ? items.join(', ') : 'Không yêu cầu cụ thể'}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3>{t('studentDashboardPage.modal_opportunityDetails')}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div className="p-4" style={{ textAlign: 'center' }}>{t('studentDashboardPage.modal_loading')}</div>
        ) : error ? (
          <div className="alert-error">{error}</div>
        ) : detail ? (
          <div className={styles.modalDetailContent}>
            <div>
              <h2 className={styles.detailHeader}>{detail.title}</h2>
              <span className={styles.typeBadge}>
                {detail.type}
              </span>
            </div>
            <div className={styles.descriptionCard}>
              <strong>Mô tả</strong>
              <p className={styles.descriptionText}>{detail.description}</p>
            </div>
            <div className={styles.detailGrid}>
              <div><strong>ID cơ hội:</strong> {detail.id}</div>
              <div><strong>Ngày tạo:</strong> {new Date(detail.created_at).toLocaleDateString()}</div>
            </div>
            {detail.criteria && (
              <div className={styles.criteriaCard}>
                <h4 className={styles.criteriaTitle}>Tiêu chí tuyển chọn</h4>
                <div className={styles.criteriaList}>
                  <div><strong>GPA tối thiểu:</strong> {detail.criteria.gpa_min ?? 'Không yêu cầu'}</div>
                  {detail.criteria.deadline && (
                    <div><strong>Hạn nộp:</strong> {new Date(detail.criteria.deadline).toLocaleDateString()}</div>
                  )}
                  {renderCriteriaList('Kỹ năng', detail.criteria.skills)}
                  {renderCriteriaList('Tài liệu yêu cầu', detail.criteria.required_documents)}
                </div>
              </div>
            )}
            <div className={styles.detailAction}>
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


const MyApplicationsSummary = ({ applications, opportunities, onOpenChat }) => {
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
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
            case 'submitted':
                return '#f59e0b';
            case 'reviewed':
            case 'viewed': 
                return '#3b82f6';
            case 'interview': 
                return '#8b5cf6';
            case 'accepted':
                return '#10b981';
            case 'rejected':
                return '#ef4444';
            default:
                return '#64748b';
        }
    };


    const getStatusText = (status) => {
        const key = `studentDashboardPage.status_${status}`;
        const defaultText = status || t('studentDashboardPage.status_unknown');
        return t(key, defaultText);
    };

    return (
        <div style={{ marginTop: '15px' }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {applications.map((app) => {
                    const statusClass = getStatusClass(app.status);
                    const statusColor = getStatusColor(app.status);
                    const oppTitle = getOpportunityTitle(app.opportunity_id);
                    const isChatEnabled = app.status === 'accepted'; 
                    const hasUnread = app.has_unread_messages; 
                    
                    return (
                        <div 
                            key={app.id} 
                            className={`card ${styles.applicationCard} ${isChatEnabled ? styles.applicationCardChatEnabled : ''}`} 
                            style={{ borderLeft: `5px solid ${statusColor}` }}
                            onClick={() => isChatEnabled && onOpenChat(app, oppTitle)}   >
                            {isChatEnabled && hasUnread && (
                                <span className={styles.unreadIndicator}></span>
                            )}
                            <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                                {oppTitle}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: '10px' }}>
                                {t('studentDashboardPage.submittedOn', { date: new Date(app.submitted_at).toLocaleDateString() })}
                            </div>
                            <span 
                                className={`${styles.statusBadge} ${statusClass}`}
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
  }, [studentUserId, t]); 

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