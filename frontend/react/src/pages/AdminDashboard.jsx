import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import styles from './AdminDashboard.module.css';
import { useTranslation } from 'react-i18next';
import { getStoredUser } from '../utils/auth.js';

const roleOptions = [
  { value: 'all', labelKey: 'adminDashboard.users.filters.all' },
  { value: 'student', labelKey: 'adminDashboard.users.filters.student' },
  { value: 'provider', labelKey: 'adminDashboard.users.filters.provider' }
];

const approvalFilters = [
  { value: 'pending', labelKey: 'adminDashboard.opportunities.filters.pending' },
  { value: 'approved', labelKey: 'adminDashboard.opportunities.filters.approved' },
  { value: 'rejected', labelKey: 'adminDashboard.opportunities.filters.rejected' },
  { value: 'all', labelKey: 'adminDashboard.opportunities.filters.all' }
];

// Định nghĩa màu và icon cho 4 chỉ số thống kê chính
const statConfig = [
    { icon: '👥', color: 'var(--color-primary)' },       // Total Users
    { icon: '👨‍🎓', color: 'var(--color-secondary)' },    // Students
    { icon: '🏢', color: '#f59e0b' },                   // Providers (Orange)
    { icon: '⏳', color: 'var(--color-danger)' },       // Pending Approvals (Red)
];

// Component StatCard mới
const StatCard = ({ label, value, icon, color }) => (
    <div className={styles.statCard} style={{ borderLeft: `5px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
            </div>
            <div style={{ fontSize: '30px', color: color, opacity: 0.8 }}>
                {icon}
            </div>
        </div>
    </div>
);

function AdminDashboard() {
  const { t } = useTranslation();
  const adminUser = getStoredUser();

  const [users, setUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('pending');
  const [opportunitySearchTerm, setOpportunitySearchTerm] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [oppsError, setOppsError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [userModalState, setUserModalState] = useState({ isOpen: false, loading: false, error: '', user: null, profile: null });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setPageError('');
      setUsersError('');
      setOppsError('');
      try {
        const [userRes, oppRes] = await Promise.allSettled([
          api.adminListUsers(),
          api.adminListOpportunities()
        ]);

        if (userRes.status === 'fulfilled') {
          setUsers(userRes.value?.users || []);
        } else {
          setUsers([]);
          setUsersError(userRes.reason?.message || t('adminDashboard.users.messages.loadFailed'));
        }

        if (oppRes.status === 'fulfilled') {
          setOpportunities(oppRes.value || []);
        } else {
          setOpportunities([]);
          setOppsError(oppRes.reason?.message || t('adminDashboard.opportunities.messages.loadFailed'));
        }

        if (userRes.status === 'rejected' && oppRes.status === 'rejected') {
          setPageError(t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [t, refreshToken]);


  const filteredUsers = useMemo(() => {
    if (userFilter === 'all') return users;
    return users.filter(user => user.role === userFilter);
  }, [users, userFilter]);

  const filteredOpportunities = useMemo(() => {
    const searchTermLower = opportunitySearchTerm.toLowerCase();

    return opportunities.filter(opp => {
        // Lọc theo Approval Status
        const matchesApproval = approvalFilter === 'all' || opp.approval_status === approvalFilter;
        
        // Lọc theo Search Term (title hoặc description)
        const matchesSearch = opp.title.toLowerCase().includes(searchTermLower) ||
                              (opp.description || '').toLowerCase().includes(searchTermLower);

        return matchesApproval && matchesSearch;
    });
  }, [opportunities, approvalFilter, opportunitySearchTerm]); 

  const stats = useMemo(() => {
    const studentCount = users.filter(u => u.role === 'student').length;
    const providerCount = users.filter(u => u.role === 'provider').length;
    const pendingApprovals = opportunities.filter(o => o.approval_status === 'pending').length;
    
    const baseStats = [
      { label: t('adminDashboard.stats.totalUsers'), value: users.length },
      { label: t('adminDashboard.stats.students'), value: studentCount },
      { label: t('adminDashboard.stats.providers'), value: providerCount },
      { label: t('adminDashboard.stats.pendingOpportunities'), value: pendingApprovals }
    ];
    
    // Kết hợp baseStats với statConfig
    return baseStats.map((stat, index) => ({
        ...stat,
        ...statConfig[index] 
    }));
  }, [users, opportunities, t]);

  const handleApprovalAction = async (opportunityId, status) => {
    try {
      await api.adminUpdateOpportunityApproval(opportunityId, status);
      setActionMessage(
        status === 'approved'
          ? t('adminDashboard.opportunities.messages.approved')
          : t('adminDashboard.opportunities.messages.rejected')
      );
      setRefreshToken(prev => prev + 1);
      if (selectedOpportunity && selectedOpportunity.id === opportunityId) {
        setSelectedOpportunity(prev => ({ ...prev, approval_status: status }));
      }
    } catch (err) {
      setOppsError(err.message || t('adminDashboard.opportunities.messages.updateFailed'));
    }
  };

  const approvalLabel = (status) =>
    t(`adminDashboard.opportunities.status.${status}`, status);

  const handleViewUser = async (user) => {
    setUserModalState({ isOpen: true, loading: true, error: '', user, profile: null });
    try {
      let profile = null;
      if (user.role === 'student') {
        profile = await api.getStudentProfileById(user.id);
      }
      setUserModalState(prev => ({ ...prev, loading: false, profile }));
    } catch (err) {
      setUserModalState(prev => ({ ...prev, loading: false, error: err.message || t('common.error') }));
    }
  };

  const handleCloseUserModal = () => {
    setUserModalState({ isOpen: false, loading: false, error: '', user: null, profile: null });
  };

  const handleBlockUser = async (user) => {
    if (user.email.toLowerCase() === 'admin@gmail.com') {
      setUsersError(t('adminDashboard.users.messages.cannotDeleteAdmin'));
      return;
    }
    if (!window.confirm(t('adminDashboard.users.confirmBlock', { email: user.email }))) return;
    try {
      await api.adminDeleteUser(user.id);
      setActionMessage(t('adminDashboard.users.messages.blocked'));
      setRefreshToken(prev => prev + 1);
    } catch (err) {
      setUsersError(err.message || t('adminDashboard.users.messages.blockFailed'));
    }
  };

    const renderUserRoleBadge = (role) => (
    <span className={`${styles.badge} ${styles.badgeNeutral}`}>
      {role === 'student' ? t('adminDashboard.users.roles.student') : t('adminDashboard.users.roles.provider')}
    </span>
  );

  const renderOpportunityRow = (opp) => (
    <tr key={opp.id}>
      <td>
        <div className={styles.oppTitle}>{opp.title}</div>
        <div className={styles.oppMeta}>
          #{opp.id} • {new Date(opp.created_at).toLocaleDateString()}
        </div>
      </td>
      <td>
        <div className={styles.userEmail}>
          {users.find(u => u.id === opp.provider_user_id)?.email ||
            t('adminDashboard.opportunities.providerId', { id: opp.provider_user_id })}
        </div>
        <div className={styles.oppMeta}>{t('adminDashboard.opportunities.type', { type: opp.type })}</div>
      </td>
      <td>
        <span className={`${styles.badge} ${styles.badgeNeutral}`}>
          {opp.status ? t(`providerDashboardPage.opportunities.status_${opp.status}`) : t('providerDashboardPage.opportunities.status_open')}
        </span>
      </td>
      <td>
        <span
          className={`${styles.badge} ${
            opp.approval_status === 'approved'
              ? styles.badgeSuccess
              : opp.approval_status === 'rejected'
              ? styles.badgeDanger
              : styles.badgeWarning
          }`}
        >
          {approvalLabel(opp.approval_status)}
        </span>
      </td>
      <td className={styles.actionsCell}>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`}
          onClick={() => setSelectedOpportunity(opp)}
        >
          👁️ {t('adminDashboard.opportunities.actions.view')}
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} btn-secondary`} 
          onClick={() => handleApprovalAction(opp.id, 'approved')}
          disabled={opp.approval_status === 'approved'}
          style={{ backgroundColor: opp.approval_status === 'approved' ? 'inherit' : '#10b981' }} 
        >
          ✓ {t('adminDashboard.opportunities.actions.approve')}
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
          onClick={() => handleApprovalAction(opp.id, 'rejected')}
          disabled={opp.approval_status === 'rejected'}
        >
          ✕ {t('adminDashboard.opportunities.actions.reject')}
        </button>
      </td>
    </tr>
  );

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1>{t('adminDashboard.title')}</h1>
          <p>{t('adminDashboard.subtitle')}</p>
        </div>
        <div className={styles.adminInfo}>
          <span>{t('adminDashboard.youAre', { email: adminUser?.email || 'admin' })}</span>
        </div>
      </header>

      {pageError && <div className="alert-error" style={{ marginBottom: 16 }}>{pageError}</div>}
      {actionMessage && (
        <div className="alert-success">
          {actionMessage}
          <button onClick={() => setActionMessage('')} className={styles.dismissBtn}>x</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>{t('common.loading')}</div>
      ) : (
        <>
          <section className={styles.statsGrid}>
            {stats.map((stat, idx) => (
              <StatCard key={idx} {...stat} /> 
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>{t('adminDashboard.users.title')}</h2>
                <p>{t('adminDashboard.users.subtitle')}</p>
              </div>
              <select
                className={styles.input}
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            {usersError && <div className="alert-error" style={{ marginBottom: 16 }}>{usersError}</div>}
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>{t('adminDashboard.users.columns.email')}</th>
                    <th>{t('adminDashboard.users.columns.role')}</th>
                    <th>{t('adminDashboard.users.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.emptyCell}>
                        {t('adminDashboard.users.empty')}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <button
                            className={styles.userEmailButton}
                            onClick={() => handleViewUser(user)}
                          >
                            {user.email}
                          </button>
                          <div className={styles.userMeta}>#{user.id}</div>
                        </td>
                        <td>
                          {user.email.toLowerCase() === 'admin@gmail.com'
                            ? <span className={`${styles.badge} ${styles.badgeNeutral}`}>{t('adminDashboard.users.locked')}</span>
                            : renderUserRoleBadge(user.role)}
                        </td>
                        <td className={styles.actionsCell}>
                          <button
                            className={`btn btn-sm btn-secondary`}
                            onClick={() => handleViewUser(user)}
                          >
                            {t('adminDashboard.users.actions.view')}
                          </button>
                          {user.email.toLowerCase() !== 'admin@gmail.com' && (
                            <button
                              className={`btn btn-sm btn-danger`}
                              onClick={() => handleBlockUser(user)}
                            >
                              {t('adminDashboard.users.actions.block')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>{t('adminDashboard.opportunities.title')}</h2>
                <p>{t('adminDashboard.opportunities.subtitle')}</p>
              </div>
              <div style={{display: 'flex', gap: '10px'}}> 
                <input
                    type="text"
                    className={`input ${styles.input}`}
                    placeholder="Tìm kiếm Cơ hội (Tên/Mô tả)..."
                    value={opportunitySearchTerm}
                    onChange={(e) => setOpportunitySearchTerm(e.target.value)}
                    style={{ minWidth: '200px' }}
                />
                
                <select
                    className={styles.input}
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value)}
                >
                    {approvalFilters.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                        </option>
                    ))}
                </select>
              </div>
            </div>
            {oppsError && <div className="alert-error" style={{ marginBottom: 16 }}>{oppsError}</div>}
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>{t('adminDashboard.opportunities.columns.title')}</th>
                    <th>{t('adminDashboard.opportunities.columns.provider')}</th>
                    <th>{t('adminDashboard.opportunities.columns.status')}</th>
                    <th>{t('adminDashboard.opportunities.columns.approval')}</th>
                    <th>{t('adminDashboard.opportunities.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>
                        {t('adminDashboard.opportunities.empty')}
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map(renderOpportunityRow)
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedOpportunity && (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>{t('adminDashboard.opportunities.detailTitle')}</h2>
                  <p>{t('adminDashboard.opportunities.detailSubtitle', { id: selectedOpportunity.id })}</p>
                </div>
                <button className={`btn btn-secondary`} onClick={() => setSelectedOpportunity(null)}>
                  {t('common.close')}
                </button>
              </div>
              <div className={styles.detailGrid}>
                <div>
                  <strong>{t('adminDashboard.opportunities.detailFields.title')}</strong>
                  <p>{selectedOpportunity.title}</p>
                </div>
                <div>
                  <strong>{t('adminDashboard.opportunities.detailFields.description')}</strong>
                  <p>{selectedOpportunity.description}</p>
                </div>
                <div>
                  <strong>{t('adminDashboard.opportunities.detailFields.criteria')}</strong>
                  {selectedOpportunity.criteria ? (
                    <ul className={styles.criteriaList}>
                      {selectedOpportunity.criteria.gpa_min !== null && (
                        <li>{t('adminDashboard.opportunities.detailFields.gpa', { value: selectedOpportunity.criteria.gpa_min })}</li>
                      )}
                      {selectedOpportunity.criteria.skills?.length > 0 && (
                        <li>{t('adminDashboard.opportunities.detailFields.skills', { value: selectedOpportunity.criteria.skills.join(', ') })}</li>
                      )}
                      {selectedOpportunity.criteria.required_documents?.length > 0 && (
                        <li>{t('adminDashboard.opportunities.detailFields.documents', { value: selectedOpportunity.criteria.required_documents.join(', ') })}</li>
                      )}
                      {selectedOpportunity.criteria.deadline && (
                        <li>{t('adminDashboard.opportunities.detailFields.deadline', { value: new Date(selectedOpportunity.criteria.deadline).toLocaleDateString() })}</li>
                      )}
                    </ul>
                  ) : (
                    <p className={styles.muted}>{t('adminDashboard.opportunities.detailFields.noCriteria')}</p>
                  )}
                </div>
                <div>
                  <strong>{t('adminDashboard.opportunities.providerLabel')}</strong>
                  <p className={styles.userEmail}>
                    {users.find(u => u.id === selectedOpportunity.provider_user_id)?.email ||
                      t('adminDashboard.opportunities.providerId', { id: selectedOpportunity.provider_user_id })}
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      
      {userModalState.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{t('adminDashboard.users.detailTitle')}</h3>
              <button className="modal-close-btn" onClick={handleCloseUserModal}>
                &times;
              </button>
            </div>
            {userModalState.loading ? (
              <div className={styles.loading}>{t('common.loading')}</div>
            ) : userModalState.error ? (
              <div className="alert-error">{userModalState.error}</div>
            ) : (
              <div className={styles.modalSection}>
                <p><strong>Email:</strong> {userModalState.user?.email}</p>
                <p><strong>{t('adminDashboard.users.columns.role')}:</strong> {userModalState.user?.role}</p>
                {userModalState.profile ? (
                  <>
                    {userModalState.user?.role === 'student' && userModalState.profile ? (
                      <>
                        {userModalState.profile.full_name && (
                          <p><strong>{t('profilePage.fullName')}:</strong> {userModalState.profile.full_name}</p>
                        )}
                        {userModalState.profile.phone && (
                          <p><strong>{t('providerProfilePage.phone')}:</strong> {userModalState.profile.phone}</p>
                        )}
                        {userModalState.profile.major && (
                          <p><strong>{t('profilePage.major')}:</strong> {userModalState.profile.major}</p>
                        )}
                        {userModalState.profile.education_level && (
                          <p><strong>{t('profilePage.educationLevel')}:</strong> {userModalState.profile.education_level}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><strong>{t('providerProfilePage.companyName')}:</strong> {userModalState.profile.company_name || t('adminDashboard.opportunities.providerId', { id: userModalState.user?.id })}</p>
                        {userModalState.profile.contact_name && (
                          <p><strong>{t('providerProfilePage.contactName')}:</strong> {userModalState.profile.contact_name}</p>
                        )}
                        {userModalState.profile.phone && (
                          <p><strong>{t('providerProfilePage.phone')}:</strong> {userModalState.profile.phone}</p>
                        )}
                        {userModalState.profile.website && (
                          <p><strong>{t('providerProfilePage.website')}:</strong> {userModalState.profile.website}</p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className={styles.muted}>{t('adminDashboard.users.noProfile')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;