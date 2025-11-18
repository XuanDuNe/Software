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

function AdminDashboard() {
  const { t } = useTranslation();
  const adminUser = getStoredUser();

  const [users, setUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [userRes, oppRes] = await Promise.all([
          api.adminListUsers(),
          api.adminListOpportunities()
        ]);
        setUsers(userRes?.users || []);
        setOpportunities(oppRes || []);
      } catch (err) {
        setError(err.message || t('common.error'));
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
    if (approvalFilter === 'all') return opportunities;
    return opportunities.filter(opp => opp.approval_status === approvalFilter);
  }, [opportunities, approvalFilter]);

  const stats = useMemo(() => {
    const studentCount = users.filter(u => u.role === 'student').length;
    const providerCount = users.filter(u => u.role === 'provider').length;
    const pendingApprovals = opportunities.filter(o => o.approval_status === 'pending').length;
    return [
      { label: t('adminDashboard.stats.totalUsers'), value: users.length },
      { label: t('adminDashboard.stats.students'), value: studentCount },
      { label: t('adminDashboard.stats.providers'), value: providerCount },
      { label: t('adminDashboard.stats.pendingOpportunities'), value: pendingApprovals }
    ];
  }, [users, opportunities, t]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.adminUpdateUserRole(userId, newRole);
      setActionMessage(t('adminDashboard.users.messages.roleUpdated'));
      setRefreshToken(prev => prev + 1);
    } catch (err) {
      setError(err.message || t('adminDashboard.users.messages.roleUpdateFailed'));
    }
  };

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
      setError(err.message || t('adminDashboard.opportunities.messages.updateFailed'));
    }
  };

  const approvalLabel = (status) =>
    t(`adminDashboard.opportunities.status.${status}`, status);

  const renderOpportunityRow = (opp) => (
    <tr key={opp.id}>
      <td>
        <div className={styles.oppTitle}>{opp.title}</div>
        <div className={styles.oppMeta}>
          #{opp.id} • {new Date(opp.created_at).toLocaleDateString()}
        </div>
      </td>
      <td>
        <div>{t('adminDashboard.opportunities.providerId', { id: opp.provider_user_id })}</div>
        <div>{t('adminDashboard.opportunities.type', { type: opp.type })}</div>
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
          className="btn btn-sm btn-secondary"
          onClick={() => setSelectedOpportunity(opp)}
        >
          {t('adminDashboard.opportunities.actions.view')}
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleApprovalAction(opp.id, 'approved')}
          disabled={opp.approval_status === 'approved'}
        >
          {t('adminDashboard.opportunities.actions.approve')}
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => handleApprovalAction(opp.id, 'rejected')}
          disabled={opp.approval_status === 'rejected'}
        >
          {t('adminDashboard.opportunities.actions.reject')}
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

      {error && <div className="alert-error">{error}</div>}
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
              <div key={idx} className={styles.statCard}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>{t('adminDashboard.users.title')}</h2>
                <p>{t('adminDashboard.users.subtitle')}</p>
              </div>
              <select
                className="input"
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
                          <div className={styles.userEmail}>{user.email}</div>
                          <div className={styles.userMeta}>#{user.id}</div>
                        </td>
                        <td>
                          {user.email.toLowerCase() === 'admin@gmail.com' ? (
                            <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                              {t('adminDashboard.users.locked')}
                            </span>
                          ) : (
                            <select
                              className="input"
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              <option value="student">{t('adminDashboard.users.roles.student')}</option>
                              <option value="provider">{t('adminDashboard.users.roles.provider')}</option>
                            </select>
                          )}
                        </td>
                        <td className={styles.actionsCell}>
                          <span className={styles.userStatus}>
                            {user.is_verified ? t('adminDashboard.users.verified') : t('adminDashboard.users.pending')}
                          </span>
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
              <select
                className="input"
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
                <button className="btn btn-secondary" onClick={() => setSelectedOpportunity(null)}>
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
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;

