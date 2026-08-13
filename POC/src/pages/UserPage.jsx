import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Tabs, PayStatusTag, BackButton } from '../components/common.jsx';
import { AdminPassConfirm } from '../components/guards.jsx';
import { AppointmentsTable } from '../components/appointments.jsx';
import { UserFullHeader } from '../components/templates.jsx';

// On-the-fly notifications built from the admin's alert rules (see Alerts & notifications)
function Notifications({ userId }) {
  const { t, L, fmtDate, fmtMoney } = useLang();
  const { notificationsForUser, procById } = useStore();
  const list = notificationsForUser(userId);

  return (
    <div className="card" style={{ padding: '1em' }}>
      <h2 className="row" style={{ marginBottom: '.5em' }}><Icon name="bell" size={18} />{t('notif.title')}</h2>
      {list.length === 0 ? <span className="muted">{t('notif.none')}</span> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
          {list.map((n) => {
            if (n.kind === 'procedural') {
              const p = procById(n.procId);
              return (
                <div key={n.id} className="row"><span className="tag pending"><Icon name="clock" size={12} />
                  {t('notif.renewal', { procedure: L(p?.name), date: fmtDate(n.date) })}</span></div>
              );
            }
            if (n.kind === 'payment') {
              return <div key={n.id} className="row"><span className="tag partial"><Icon name="dollar" size={12} />{t('notif.pending', { sum: fmtMoney(n.sum) })}</span></div>;
            }
            return <div key={n.id} className="row"><span className="tag alert"><Icon name="alert" size={12} />{t('notif.alert')}</span></div>;
          })}
        </div>
      )}
    </div>
  );
}

export default function UserPage() {
  const { t, L, fmtDate, fmtMoney, fmtNum } = useLang();
  const {
    nav, navigate, goBack, openPopup, userById, payments, rewards, rewardDefs, procById,
    referralsOfUser, treatmentById, removePayment, removeReward, updateUser,
  } = useStore();
  const [tab, setTab] = useState('rewards');
  const [del, setDel] = useState(null); // {kind, id, subject}
  const user = userById(nav.params.userId);
  if (!user) return <div className="page"><div className="muted">{t('tbl.noData')}</div></div>;

  const userPayments = payments.filter((p) => treatmentById(p.treatmentId)?.userId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const userRewards = rewards.filter((r) => r.userId === user.id);
  const referred = referralsOfUser(user.id);

  const payCols = [
    { key: 'date', label: t('common.date'), sortVal: (p) => p.date, render: (p) => fmtDate(p.date) },
    { key: 'type', label: t('common.type'), render: (p) => t(`payType.${p.type}`) },
    { key: 'amount', label: t('common.sum'), sortVal: (p) => p.amount, render: (p) => <b>{fmtMoney(p.amount)}</b> },
    { key: 'status', label: t('common.status'), render: (p) => <PayStatusTag status={p.status === 'paid' ? 'paid' : 'pending'} fmtMoney={fmtMoney} /> },
    {
      key: 'treat', label: t('up.treatment'),
      render: (p) => { const tr = treatmentById(p.treatmentId); return tr ? L(procById(tr.procId)?.name) : ''; },
    },
    {
      key: 'del', label: t('common.actions'),
      render: (p) => (
        <button className="iconbtn" onClick={() => setDel({ kind: 'payment', id: p.id, subject: `${fmtDate(p.date)} · ${fmtMoney(p.amount)}` })}>
          <Icon name="trash" size={14} title={t('fin.deletePayment')} />
        </button>
      ),
    },
  ];

  const rewardCols = [
    { key: 'name', label: t('common.name'), render: (r) => <b>{r.defId ? L(rewardDefs.find((d) => d.id === r.defId)?.name) : L(r.desc)}</b> },
    {
      key: 'value', label: t('rwt.value'),
      render: (r) => {
        const d = r.defId ? rewardDefs.find((x) => x.id === r.defId) : r;
        if (!d) return '';
        const parts = [];
        if (d.percent) parts.push(t('rwt.percent', { n: d.percent }));
        if (d.cash) parts.push(fmtMoney(d.cash));
        if (d.points) parts.push(t('rwt.points', { n: d.points }));
        return parts.join(' · ') || '—';
      },
    },
    { key: 'dates', label: `${t('rwt.granted')} — ${t('rwt.expires')}`, sortVal: (r) => r.dateInit, render: (r) => `${fmtDate(r.dateInit)} — ${r.dateEnd ? fmtDate(r.dateEnd) : '∞'}` },
    {
      key: 'restr', label: t('rwt.restrictions'),
      render: (r) => r.restrictions.length === 0 ? <span className="muted">{t('common.all')}</span>
        : <span className="muted">{r.restrictions.map((id) => L(procById(id)?.name)).filter(Boolean).join(', ')}</span>,
    },
    {
      key: 'status', label: t('common.status'),
      render: (r) => <span className={`tag ${r.status === 'active' ? 'paid' : r.status === 'used' ? 'partial' : 'alert'}`}>{t(`rwt.${r.status}`)}</span>,
    },
    { key: 'actual', label: t('rwt.actual'), render: (r) => (r.actual != null ? fmtMoney(r.actual) : <span className="muted">—</span>) },
    {
      key: 'del', label: t('common.actions'),
      render: (r) => (
        <button className="iconbtn" onClick={() => setDel({ kind: 'reward', id: r.id, subject: r.defId ? L(rewardDefs.find((d) => d.id === r.defId)?.name) : L(r.desc) })}>
          <Icon name="trash" size={14} title={t('common.delete')} />
        </button>
      ),
    },
  ];

  const doDelete = () => {
    if (!del) return;
    if (del.kind === 'payment') removePayment(del.id);
    if (del.kind === 'reward') removeReward(del.id);
    if (del.kind === 'referral') updateUser(del.id, { referredBy: null });
  };

  return (
    <div className="page">
      <div className="row"><BackButton onClick={goBack} /></div>
      <UserFullHeader user={user} />
      <Notifications userId={user.id} />

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="calendar" size={18} />{t('at.title')}</h2>
        <AppointmentsTable userId={user.id} pageSize={5} />
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="coins" size={18} />{t('up.payments')}</h2>
        <DataTable columns={payCols} rows={userPayments} pageSize={6} />
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <div className="spread" style={{ marginBottom: '.6em' }}>
          <Tabs active={tab} onChange={setTab} tabs={[['rewards', t('up.rewards')], ['referrals', t('up.referrals')]]} />
          <button className="btn sm" onClick={() => openPopup('reward', { userId: user.id })}><Icon name="gift" size={14} />{t('up.grantReward')}</button>
        </div>
        {tab === 'rewards' ? (
          <>
            <div className="muted" style={{ marginBottom: '.4em' }}>{t('tbl.dblEdit')}</div>
            <DataTable columns={rewardCols} rows={userRewards} pageSize={5}
              onRowDoubleClick={(r) => openPopup('reward', { userId: user.id, reward: r })} />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6em' }}>
            <div className="row muted">
              <span>{t('up.referredCount', { n: fmtNum(referred.length) })}</span>·
              <span>{t('up.referralPoints', { n: fmtNum(referred.length * 50) })}</span>
            </div>
            {referred.length === 0 ? <div className="muted">{t('up.noReferrals')}</div> : referred.map((r) => (
              <div key={r.id} className="row">
                <button className="chip" style={{ padding: '.45em .8em' }} onClick={() => navigate('user', { userId: r.id })}>
                  <img className="avatar" src={r.photo} width={28} height={28} alt="" />
                  <b>{L(r.first)} {L(r.last)}</b>
                </button>
                <button className="iconbtn" onClick={() => setDel({ kind: 'referral', id: r.id, subject: `${L(r.first)} ${L(r.last)}` })}>
                  <Icon name="trash" size={14} title={t('common.delete')} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {del && <AdminPassConfirm close={() => setDel(null)} subject={del.subject} onConfirm={doDelete} />}
    </div>
  );
}
