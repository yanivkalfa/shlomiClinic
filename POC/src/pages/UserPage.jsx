import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Tabs, PayStatusTag, BackButton } from '../components/common.jsx';
import { UserFullHeader } from '../components/templates.jsx';

export default function UserPage() {
  const { t, L, fmtDate, fmtMoney, fmtNum } = useLang();
  const {
    nav, navigate, goBack, openPopup, userById, visitsOfUser, treatmentsOfVisit, prodsOfTreatment, productById, procById,
    visitTotal, visitPayStatus, visitPaid, payments, treatments, rewards, rewardDefs, settings, referralsOfUser, treatmentById, visitById,
  } = useStore();
  const [tab, setTab] = useState('rewards');
  const user = userById(nav.params.userId);
  if (!user) return <div className="page"><div className="muted">{t('tbl.noData')}</div></div>;

  const visits = visitsOfUser(user.id);
  const userPayments = payments.filter((p) => treatmentById(p.treatmentId)?.userId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const userRewards = rewards.filter((r) => r.userId === user.id);
  const referred = referralsOfUser(user.id);

  const visitCols = [
    {
      key: 'pics', label: `${t('up.before')} → ${t('up.after')}`,
      render: (v) => (
        <span className="row">
          {v.photos.before[0] ? <img src={v.photos.before[0]} width={34} height={42} style={{ borderRadius: 6, objectFit: 'cover' }} alt={t('up.before')} /> : <span className="muted">—</span>}
          <Icon name="arrowR" size={13} />
          {v.photos.after[0] ? <img src={v.photos.after[0]} width={34} height={42} style={{ borderRadius: 6, objectFit: 'cover' }} alt={t('up.after')} /> : <span className="muted">—</span>}
        </span>
      ),
    },
    { key: 'date', label: t('common.date'), sortVal: (v) => v.date, render: (v) => fmtDate(v.date) },
    {
      key: 'treats', label: t('up.treatments'),
      render: (v) => treatmentsOfVisit(v.id).map((tr) => L(procById(tr.procId)?.name)).join(', '),
    },
    {
      key: 'prods', label: t('up.products'),
      render: (v) => {
        const names = treatmentsOfVisit(v.id).flatMap((tr) => prodsOfTreatment(tr.id).map((tp) => L(productById(tp.productId)?.name))).filter(Boolean);
        return <span className="muted">{names.join(', ')}</span>;
      },
    },
    {
      key: 'costs', label: t('up.costs'),
      render: (v) => treatmentsOfVisit(v.id).map((tr) => fmtMoney(tr.cost)).join(' + '),
    },
    { key: 'total', label: t('common.total'), sortVal: (v) => visitTotal(v.id), render: (v) => <b>{fmtMoney(visitTotal(v.id))}</b> },
    {
      key: 'status', label: t('up.payStatus'),
      render: (v) => <PayStatusTag status={visitPayStatus(v.id)} sum={visitPaid(v.id)} fmtMoney={fmtMoney} />,
    },
    {
      key: 'info', label: t('up.details'),
      render: (v) => {
        const tr = treatmentsOfVisit(v.id)[0];
        return (
          <span className="row">
            {tr && (
              <button className="iconbtn" onClick={() => navigate('treatment', { treatmentId: tr.id })}>
                <Icon name="eye" size={14} title={t('up.details')} />
              </button>
            )}
            {v.signed && (
              <button className="iconbtn" onClick={() => openPopup('consent', { visitId: v.id })}>
                <Icon name="doc" size={14} title={t('up.consent')} />
              </button>
            )}
          </span>
        );
      },
    },
  ];

  const payCols = [
    { key: 'date', label: t('common.date'), sortVal: (p) => p.date, render: (p) => fmtDate(p.date) },
    { key: 'type', label: t('common.type'), render: (p) => t(`payType.${p.type}`) },
    { key: 'amount', label: t('common.sum'), sortVal: (p) => p.amount, render: (p) => <b>{fmtMoney(p.amount)}</b> },
    { key: 'status', label: t('common.status'), render: (p) => <PayStatusTag status={p.status === 'paid' ? 'paid' : 'pending'} fmtMoney={fmtMoney} /> },
    {
      key: 'treat', label: t('up.treatment'),
      render: (p) => { const tr = treatmentById(p.treatmentId); return tr ? L(procById(tr.procId)?.name) : ''; },
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
  ];

  return (
    <div className="page">
      <div className="row"><BackButton onClick={goBack} /></div>
      <UserFullHeader user={user} />

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="calendar" size={18} />{t('up.visits')}</h2>
        <DataTable columns={visitCols} rows={visits} pageSize={6}
          footer={settings.optVisitSummary ? (
            <div className="muted" style={{ paddingTop: '.6em' }}>
              {t('up.visitsSummary', { n: fmtNum(visits.length), sum: fmtMoney(visits.reduce((s, v) => s + visitTotal(v.id), 0)) })}
            </div>
          ) : null}
        />
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
          <DataTable columns={rewardCols} rows={userRewards} pageSize={5} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6em' }}>
            <div className="row muted">
              <span>{t('up.referredCount', { n: fmtNum(referred.length) })}</span>·
              <span>{t('up.referralPoints', { n: fmtNum(referred.length * 50) })}</span>
            </div>
            {referred.length === 0 ? <div className="muted">{t('up.noReferrals')}</div> : referred.map((r) => (
              <button key={r.id} className="chip" style={{ alignSelf: 'flex-start', padding: '.45em .8em' }} onClick={() => navigate('user', { userId: r.id })}>
                <img className="avatar" src={r.photo} width={28} height={28} alt="" />
                <b>{L(r.first)} {L(r.last)}</b>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
