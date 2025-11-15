import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { getStoredUser } from '../utils/auth.js';
import styles from './StudentDashboard.module.css'; 

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
    if (!isOpen) return null;
    const messagesEndRef = useRef(null); 

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>Trò chuyện về {opportunityTitle}</h3>
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
                                <div style={{ textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>Bắt đầu cuộc trò chuyện.</div>
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
          <h3>Thông tin cơ hội</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div style={{ padding: 16, textAlign: 'center' }}>Đang tải dữ liệu...</div>
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
                {hasApplied ? 'Bạn đã nộp hồ sơ' : submitting ? 'Đang nộp...' : 'Nộp hồ sơ'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const MyApplicationsSummary = ({ applications, opportunities, onOpenChat }) => {
    if (!applications || applications.length === 0) {
        return (
            <div className="card" style={{ padding: '15px', textAlign: 'center', color: '#64748b', marginTop: '15px' }}>
                Bạn chưa nộp bất kỳ hồ sơ nào.
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
                    const oppTitle = getOpportunityTitle(app.opportunity_id);
                    // Chỉ cho phép chat khi hồ sơ đã được chấp nhận
                    const isChatEnabled = app.status === 'accepted'; 
                    // SỬ DỤNG TRƯỜNG HAS_UNREAD_MESSAGES MỚI
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
                                Nộp ngày: {new Date(app.submitted_at).toLocaleDateString()}
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
                            {isChatEnabled && (
                                <div style={{ marginTop: 10, fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                                    (Click để nhắn tin với Provider)
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
        setError(err.message || 'Lỗi tải dữ liệu');
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchAllData();
    return () => { mounted = false; };
  }, [studentUserId]);

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
      setDetailError(err.message || 'Không thể tải thông tin cơ hội');
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
        setError('Bạn đã nộp hồ sơ cho cơ hội này rồi.');
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
      alert('Nộp hồ sơ thành công!');
      if (selectedOpportunityId === opportunityId) {
        closeOpportunityDetail();
      }
    } catch (err) {
      setError(err.message || 'Nộp hồ sơ thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  const openMessageModal = async (application, opportunityTitle) => {
    if (application.status !== 'accepted') {
        alert('Chỉ có thể nhắn tin sau khi hồ sơ đã được chấp nhận.');
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
            error: err.message || 'Không thể tải hội thoại' 
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
        setMessageModalState(prev => ({ ...prev, sending: false, error: err.message || 'Không thể gửi tin nhắn' }));
    }
  };


  return (
    <div className="container p-6"> {}
      <h2>Trang sinh viên</h2>
      
      {error && <div className="alert-error" style={{ marginBottom: 12 }}>{error}</div>} 

      <h3 style={{ marginTop: 24, marginBottom: 10 }}>Hồ sơ của bạn</h3>
      <MyApplicationsSummary 
        applications={applications} 
        opportunities={opportunities} 
        onOpenChat={openMessageModal} 
      />

      <h3 style={{ marginTop: 40, marginBottom: 15 }}>Danh sách cơ hội</h3>
      
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
                        {applied ? 'Đã Nộp' : submitting ? 'Đang nộp...' : 'Nộp hồ sơ'}
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