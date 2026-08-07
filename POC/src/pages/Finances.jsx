import React, { useState, useMemo, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Tabs, Modal, ModalHead } from '../components/common.jsx';
import { RewardsCreation } from '../components/popups.jsx';
import { ymd, today, addMonths, ADMIN } from '../data.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// password gate -> edit payment in the quick-charge format
function PaymentEditPopup({ close, paymentId }) {
  const { t, fmtMoney } = useLang();
  const { payments, updatePayment, showToast } = useStore();
  const payment = payments.find((p) => p.id === paymentId);
  const [pass, setPass] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const [date, setDate] = useState(payment?.date || ymd(today()));
  const [method, setMethod] = useState(payment?.type || 'credit');
  const [sum, setSum] = useState(String(payment?.amount ?? ''));
  const METHODS = ['credit', 'cash', 'bit', 'paybox', 'bank', 'wallet'];

  if (!payment) return null;
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('common.edit')} icon="edit" onClose={close} />
      {!ok ? (
        <>
          <div className="muted">{t('fin.editPass')}</div>
          <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(false); }}
            onKeyDown={(e) => e.key === 'Enter' && (pass === ADMIN.password ? setOk(true) : setErr(true))} autoFocus />
          {err && <div className="err">{t('fin.wrongPass')}</div>}
          <button className="btn" onClick={() => (pass === ADMIN.password ? setOk(true) : setErr(true))}>
            <Icon name="check" size={15} />{t('qa.go')}
          </button>
        </>
      ) : (
        <>
          <label className="row">{t('common.date')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {METHODS.map((m) => (
              <span key={m} className={`chip ${method === m ? 'on' : ''}`} onClick={() => setMethod(m)}>{t(`payType.${m}`)}</span>
            ))}
          </div>
          <label className="row">{t('common.sum')}
            <input type="number" value={sum} onChange={(e) => setSum(e.target.value)} style={{ width: '8em' }} />
            <span className="muted">({fmtMoney(payment.amount)})</span>
          </label>
          <button className="btn" onClick={() => { updatePayment(paymentId, { date, type: method, amount: parseFloat(sum) || payment.amount }); showToast(t('common.save')); close(); }}>
            <Icon name="check" size={15} />{t('common.save')}
          </button>
        </>
      )}
    </Modal>
  );
}

function CampaignEditPopup({ close, campaign }) {
  const { t, L } = useLang();
  const { updateCampaign, showToast } = useStore();
  const [f, setF] = useState({
    name: L(campaign.name), dateInit: campaign.dateInit, dateEnd: campaign.dateEnd,
    percent: campaign.percent, raw: campaign.raw, code: campaign.code, limits: L(campaign.limits),
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('common.edit')} icon="edit" onClose={close} />
      <label>{t('fin.cmpName')}<input value={f.name} onChange={set('name')} style={{ width: '100%' }} /></label>
      <div className="row">
        <label>{t('rc.init')}<input type="date" value={f.dateInit} onChange={set('dateInit')} /></label>
        <label>{t('rc.end')}<input type="date" value={f.dateEnd} onChange={set('dateEnd')} /></label>
      </div>
      <div className="row">
        <label>{t('fin.cmpPercent')}<input type="number" value={f.percent} onChange={set('percent')} style={{ width: '5em' }} /></label>
        <label>{t('fin.cmpRaw')}<input type="number" value={f.raw} onChange={set('raw')} style={{ width: '6em' }} /></label>
      </div>
      <label>{t('fin.cmpCode')}<input value={f.code} onChange={set('code')} style={{ width: '100%' }} /></label>
      <label>{t('fin.cmpLimits')}<input value={f.limits} onChange={set('limits')} style={{ width: '100%' }} /></label>
      <button className="btn" onClick={() => {
        updateCampaign(campaign.id, { name: [f.name, f.name], dateInit: f.dateInit, dateEnd: f.dateEnd, percent: parseFloat(f.percent) || 0, raw: parseFloat(f.raw) || 0, code: f.code, limits: [f.limits, f.limits] });
        showToast(t('common.save')); close();
      }}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export default function Finances() {
  const { t, L, fmtDate, fmtMoney, fmtNum, fmtMonth, isRTL } = useLang();
  const { payments, treatmentById, procById, userById, visitById, orders, openPopup, campaigns, addCampaign, users, referralsOfUser, userTotalSpent, showToast } = useStore();
  const [tab, setTab] = useState('payments');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editPay, setEditPay] = useState(null);
  const [editCmp, setEditCmp] = useState(null);
  const [launch, setLaunch] = useState(false);

  const rowsWithMeta = useMemo(() => payments.map((p) => {
    const tr = treatmentById(p.treatmentId);
    const visit = tr ? visitById(tr.visitId) : null;
    const user = tr ? userById(tr.userId) : null;
    const proc = tr ? procById(tr.procId) : null;
    return { ...p, _visitDate: visit?.date || '', _userName: user ? `${L(user.first)} ${L(user.last)}` : '', _userSearch: user ? `${user.first[0]} ${user.last[0]} ${user.first[1]} ${user.last[1]}`.toLowerCase() : '', _procName: proc ? L(proc.name) : '', _procSearch: proc ? `${proc.name[0]} ${proc.name[1]}`.toLowerCase() : '' };
  }).filter((p) => (!from || p.date >= from) && (!to || p.date <= to)), [payments, treatmentById, visitById, userById, procById, L, from, to]);

  const searchFn = useCallback((p, s) => p._userSearch.includes(s) || p._procSearch.includes(s) || p.date.includes(s), []);

  const payCols = [
    { key: 'date', label: t('common.date'), sortVal: (p) => p.date, render: (p) => fmtDate(p.date) },
    { key: 'amount', label: t('common.sum'), sortVal: (p) => p.amount, render: (p) => <b>{fmtMoney(p.amount)}</b> },
    { key: 'proc', label: t('fin.procedure'), sortVal: (p) => p._procName, render: (p) => p._procName },
    { key: 'user', label: t('fin.user'), sortVal: (p) => p._userName, render: (p) => p._userName },
    { key: 'vdate', label: t('fin.visitDate'), sortVal: (p) => p._visitDate, render: (p) => (p._visitDate ? fmtDate(p._visitDate) : '') },
    { key: 'type', label: t('common.type'), render: (p) => t(`payType.${p.type}`) },
    {
      key: 'edit', label: t('common.actions'),
      render: (p) => <button className="iconbtn" onClick={() => setEditPay(p.id)}><Icon name="edit" size={14} title={t('common.edit')} /></button>,
    },
  ];

  // ---- stats ranges ----
  const stats = useMemo(() => {
    const T = today();
    const paid = payments.filter((p) => p.status === 'paid');
    const inRange = (a, b) => paid.filter((p) => p.date >= ymd(a) && p.date <= ymd(b)).reduce((s, p) => s + p.amount, 0);
    const som = (d) => { const x = new Date(d); x.setDate(1); return x; };
    const qStartMonth = Math.floor(T.getMonth() / 3) * 3;
    const qs = new Date(T.getFullYear(), qStartMonth, 1);
    const lqs = addMonths(qs, -3), lqe = new Date(qs.getFullYear(), qs.getMonth(), 0);
    const ordersIn = (a, b) => orders.filter((o) => o.date >= ymd(a) && o.date <= ymd(b)).length;
    return {
      eToday: inRange(T, T),
      eMonth: inRange(som(T), T),
      eLastMonth: inRange(som(addMonths(T, -1)), new Date(T.getFullYear(), T.getMonth(), 0)),
      eLast3: inRange(som(addMonths(T, -2)), T),
      eThisQ: inRange(qs, T), qA: qStartMonth + 1, qB: qStartMonth + 3,
      eLastQ: inRange(lqs, lqe), lqA: lqs.getMonth() + 1, lqB: lqs.getMonth() + 3,
      eYear: inRange(new Date(T.getFullYear(), 0, 1), T),
      oMonth: ordersIn(som(T), T),
      oLastMonth: ordersIn(som(addMonths(T, -1)), new Date(T.getFullYear(), T.getMonth(), 0)),
      oLast3: ordersIn(som(addMonths(T, -2)), T),
      oLastQ: ordersIn(lqs, lqe),
      oYear: ordersIn(new Date(T.getFullYear(), 0, 1), T),
    };
  }, [payments, orders]);

  const chart = useMemo(() => {
    const T = today();
    const labels = [], values = [];
    for (let i = 5; i >= 0; i--) {
      const m = addMonths(T, -i);
      const a = new Date(m.getFullYear(), m.getMonth(), 1), b = new Date(m.getFullYear(), m.getMonth() + 1, 0);
      labels.push(fmtMonth(m));
      values.push(payments.filter((p) => p.status === 'paid' && p.date >= ymd(a) && p.date <= ymd(b)).reduce((s, p) => s + p.amount, 0));
    }
    return { labels, values };
  }, [payments, fmtMonth]);

  const cmpCols = [
    { key: 'name', label: t('fin.cmpName'), sortVal: (c) => L(c.name), render: (c) => <b>{L(c.name)}</b> },
    { key: 'dates', label: `${t('rc.init')} — ${t('rc.end')}`, sortVal: (c) => c.dateInit, render: (c) => `${fmtDate(c.dateInit)} — ${c.dateEnd ? fmtDate(c.dateEnd) : '∞'}` },
    { key: 'percent', label: t('fin.cmpPercent'), render: (c) => (c.percent ? `${c.percent}%` : '—') },
    { key: 'raw', label: t('fin.cmpRaw'), render: (c) => (c.raw ? fmtMoney(c.raw) : '—') },
    { key: 'code', label: t('fin.cmpCode'), render: (c) => <span className="tag partial">{c.code}</span> },
    { key: 'limits', label: t('fin.cmpLimits'), render: (c) => <span className="muted">{L(c.limits)}</span> },
  ];

  const referrers = users.filter((u) => referralsOfUser(u.id).length > 0);

  return (
    <div className="page">
      <h1 className="row"><Icon name="coins" size={22} />{t('fin.title')}</h1>
      <Tabs active={tab} onChange={setTab} tabs={[
        ['payments', t('fin.payments')], ['stats', t('fin.stats')],
        ['campaigns', t('fin.campaigns')], ['referrals', t('fin.referrals')],
      ]} />

      {tab === 'payments' && (
        <div className="card" style={{ padding: '1em' }}>
          <div className="row" style={{ marginBottom: '.7em', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => openPopup('quickPay', {})}><Icon name="bolt" size={15} />{t('fin.quickCharge')}</button>
            <input style={{ flex: 1, minWidth: '10em', maxWidth: '18em' }} placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="row muted">{t('common.from')}<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="row muted">{t('common.until')}<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          <DataTable columns={payCols} rows={rowsWithMeta} searchText={q} searchFn={searchFn} pageSize={9} />
        </div>
      )}

      {tab === 'stats' && (
        <>
          <div className="statgrid">
            <div className="card" style={{ padding: '1em' }}>
              <h3 className="row" style={{ marginBottom: '.4em' }}><Icon name="dollar" size={16} />{t('fin.earnings')}</h3>
              <div className="statline"><span>{t('fin.eToday')}</span><b>{fmtMoney(stats.eToday)}</b></div>
              <div className="statline"><span>{t('fin.eMonth')}</span><b>{fmtMoney(stats.eMonth)}</b></div>
              <div className="statline"><span>{t('fin.eLastMonth')}</span><b>{fmtMoney(stats.eLastMonth)}</b></div>
              <div className="statline"><span>{t('fin.eLast3')}</span><b>{fmtMoney(stats.eLast3)}</b></div>
              <div className="statline"><span>{t('fin.eThisQ', { a: stats.qA, b: stats.qB })}</span><b>{fmtMoney(stats.eThisQ)}</b></div>
              <div className="statline"><span>{t('fin.eLastQ', { a: stats.lqA, b: stats.lqB })}</span><b>{fmtMoney(stats.eLastQ)}</b></div>
              <div className="statline"><span>{t('fin.eYear')}</span><b>{fmtMoney(stats.eYear)}</b></div>
            </div>
            <div className="card" style={{ padding: '1em' }}>
              <h3 className="row" style={{ marginBottom: '.4em' }}><Icon name="truck" size={16} />{t('fin.orders')}</h3>
              <div className="statline"><span>{t('fin.oMonth')}</span><b>{fmtNum(stats.oMonth)}</b></div>
              <div className="statline"><span>{t('fin.oLastMonth')}</span><b>{fmtNum(stats.oLastMonth)}</b></div>
              <div className="statline"><span>{t('fin.oLast3')}</span><b>{fmtNum(stats.oLast3)}</b></div>
              <div className="statline"><span>{t('fin.oLastQ')}</span><b>{fmtNum(stats.oLastQ)}</b></div>
              <div className="statline"><span>{t('fin.oYear')}</span><b>{fmtNum(stats.oYear)}</b></div>
            </div>
          </div>
          <div className="card" style={{ padding: '1em' }}>
            <h3 className="row" style={{ marginBottom: '.6em' }}><Icon name="chart" size={16} />{t('fin.chart')}</h3>
            <div style={{ height: '15em' }}>
              <Bar
                data={{ labels: chart.labels, datasets: [{ data: chart.values, backgroundColor: 'rgba(232,163,61,.75)', borderRadius: 6 }] }}
                options={{
                  maintainAspectRatio: false,
                  scales: { x: { reverse: isRTL, grid: { display: false }, ticks: { color: '#8a93a8' } }, y: { grid: { color: 'rgba(140,150,170,.15)' }, ticks: { color: '#8a93a8' } } },
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          </div>
        </>
      )}

      {tab === 'campaigns' && (
        <div className="card" style={{ padding: '1em' }}>
          <div className="spread" style={{ marginBottom: '.7em' }}>
            <button className="btn" onClick={() => setLaunch(true)}><Icon name="bolt" size={15} />{t('fin.launch')}</button>
            <span className="muted">{t('tbl.dblEdit')}</span>
          </div>
          <DataTable columns={cmpCols} rows={campaigns} pageSize={6} onRowDoubleClick={(c) => setEditCmp(c)} />
        </div>
      )}

      {tab === 'referrals' && (
        <div className="card" style={{ padding: '1em' }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{t('common.name')}</th><th>{t('fin.refCount')}</th><th>{t('fin.refBenefit')}</th><th>{t('fin.refEarnings')}</th></tr></thead>
              <tbody>
                {referrers.length === 0 ? <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '1.4em' }}>{t('tbl.noData')}</td></tr>
                  : referrers.map((u) => {
                    const refs = referralsOfUser(u.id);
                    const earnings = userTotalSpent(u.id) + refs.reduce((s, r) => s + userTotalSpent(r.id), 0);
                    return (
                      <tr key={u.id}>
                        <td><span className="row"><img className="avatar" src={u.photo} width={32} height={32} alt="" /><b>{L(u.first)} {L(u.last)}</b></span></td>
                        <td>{fmtNum(refs.length)}</td>
                        <td>{fmtNum(refs.length * 50)} {t('hdr.walletPoints')}</td>
                        <td><b>{fmtMoney(earnings)}</b></td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editPay != null && <PaymentEditPopup close={() => setEditPay(null)} paymentId={editPay} />}
      {editCmp && <CampaignEditPopup close={() => setEditCmp(null)} campaign={editCmp} />}
      {launch && (
        <Modal onClose={() => setLaunch(false)}>
          <ModalHead title={t('fin.launch')} icon="bolt" onClose={() => setLaunch(false)} />
          <div className="muted">{t('fin.launchNote')}</div>
          <RewardsCreation createLabel={t('fin.launch')} onCreate={(r) => {
            addCampaign({ name: [r.desc, r.desc], dateInit: r.dateInit, dateEnd: r.dateEnd, percent: r.percent, raw: r.cash, code: r.desc.replace(/\s+/g, '').toUpperCase().slice(0, 10), limits: r.restrictions.length ? [String(r.restrictions.length), String(r.restrictions.length)] : ['—', '—'] });
            showToast(t('fin.launch')); setLaunch(false);
          }} />
        </Modal>
      )}
    </div>
  );
}
