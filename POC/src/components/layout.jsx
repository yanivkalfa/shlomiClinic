import React, { useState, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon } from './common.jsx';
import { QuickUserAccess } from './templates.jsx';
import { ymd, today, sameDay } from '../data.js';

export function TopBar() {
  const { t, lang, setLang } = useLang();
  const { setSession, settings } = useStore();
  // A custom clinic name wins; an empty one falls back to the translated default.
  const name = settings.clinicName.trim() || t('app.name');
  return (
    <div className="topbar">
      <div className="brand">
        {settings.clinicLogo
          ? <img className="logo" src={settings.clinicLogo} alt={name} style={{ objectFit: 'cover' }} />
          : <span className="logo">S</span>}
        {name}
      </div>
      <span className="muted" style={{ flex: 1 }}>{t('app.tagline')}</span>
      <div className="langswitch">
        <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>{t('lang.en')}</button>
        <button className={lang === 'he' ? 'on' : ''} onClick={() => setLang('he')}>{t('lang.he')}</button>
      </div>
      <span className="row muted"><Icon name="users" size={15} />{t('topbar.admin')}</span>
      <button className="iconbtn" onClick={() => setSession(null)}><Icon name="logout" size={15} title={t('topbar.logout')} /></button>
    </div>
  );
}

const NAV = [
  ['home', 'home', 'menu.home'],
  ['appointments', 'calendar', 'menu.appointments'],
  ['messaging', 'chat', 'menu.messaging'],
  ['users', 'users', 'menu.users'],
  ['finances', 'coins', 'menu.finances'],
  ['inventory', 'box', 'menu.inventory'],
  ['treatments', 'bolt', 'menu.treatments'],
  ['orders', 'truck', 'menu.orders'],
  ['legal', 'legal', 'menu.legal'],
  ['alerts', 'bell', 'menu.alerts'],
  ['settings', 'gear', 'menu.settings'],
];

export function LeftPanel() {
  const { t } = useLang();
  const { nav, navigate, openPopup } = useStore();
  return (
    <div className="card leftpanel">
      <div className="qa-embed card" style={{ padding: '.7em', boxShadow: 'none' }}>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('qa.title')}</div>
        <QuickUserAccess compact />
      </div>
      <button className="btn" onClick={() => openPopup('quickPay', {})}>
        <Icon name="bolt" size={16} /><span className="navlabel">{t('menu.quickPay')}</span>
      </button>
      <div className="navlist">
        {NAV.map(([page, icon, key]) => (
          <button key={page} className={nav.page === page ? 'on' : ''} onClick={() => navigate(page)}>
            <Icon name={icon} size={17} /><span className="navlabel">{t(key)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniCalendar() {
  const { t, locale } = useLang();
  const { navigate, visits } = useStore();
  const [base, setBase] = useState(() => { const d = today(); d.setDate(1); return d; });

  const dows = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    return [...Array(7)].map((_, i) => fmt.format(new Date(2023, 0, 1 + i))); // Jan 1 2023 = Sunday
  }, [locale]);

  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(base);
  const first = new Date(base), startDow = first.getDay();
  const cells = [];
  const start = new Date(first); start.setDate(1 - startDow);
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
  const visitDays = useMemo(() => new Set(visits.map((v) => v.date)), [visits]);

  return (
    <div className="rp-block card">
      <div className="spread">
        <button className="iconbtn" onClick={() => setBase((b) => { const x = new Date(b); x.setMonth(x.getMonth() - 1); return x; })}><Icon name="chevL" size={13} title={t('tbl.prev')} /></button>
        <b style={{ fontSize: '.9em' }}>{monthName}</b>
        <button className="iconbtn" onClick={() => setBase((b) => { const x = new Date(b); x.setMonth(x.getMonth() + 1); return x; })}><Icon name="chevR" size={13} title={t('tbl.next')} /></button>
      </div>
      <div className="mcal">
        {dows.map((d, i) => <span key={i} className="dow">{d}</span>)}
        {cells.map((d, i) => (
          <button key={i}
            className={`${sameDay(d, today()) ? 'today' : ''} ${d.getMonth() !== base.getMonth() ? 'dim' : ''} ${visitDays.has(ymd(d)) ? 'hasv' : ''}`}
            onClick={() => navigate('appointments', { date: ymd(d) })}>
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RightPanel() {
  const { t, L, fmtMoney } = useLang();
  const { openPopup, navigate, messages, notes, todayVisits, treatmentsOfVisit, procById, payments, visits, userPendingSum, users, settings } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const rp = settings.rp;

  const unread = messages.filter((m) => !m.read).length;

  const todayRevenue = payments.filter((p) => p.date === ymd(today()) && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = users.reduce((s, u) => s + userPendingSum(u.id), 0);
  const weekAgo = new Date(today()); weekAgo.setDate(weekAgo.getDate() - 6);
  const patientsWeek = new Set(visits.filter((v) => v.date >= ymd(weekAgo) && v.date <= ymd(today())).map((v) => v.userId)).size;

  const todayProcCounts = useMemo(() => {
    const map = new Map();
    for (const v of todayVisits) for (const tr of treatmentsOfVisit(v.id)) {
      const p = procById(tr.procId);
      if (p) map.set(p.id, (map.get(p.id) || 0) + 1);
    }
    return [...map.entries()].map(([pid, count]) => ({ proc: procById(pid), count }));
  }, [todayVisits, treatmentsOfVisit, procById]);

  // every block can be switched off in App settings — with none left, drop the panel
  if (!rp.quick && !rp.calendar && !rp.pulse && !rp.today) return null;

  if (collapsed) {
    return (
      <div className="card rightpanel collapsed">
        <button className="iconbtn" onClick={() => setCollapsed(false)}><Icon name="chevL" size={14} title={t('right.expand')} /></button>
        {rp.quick && <>
          <button className="iconbtn" onClick={() => navigate('messaging')}><Icon name="bell" size={15} title={t('right.alertsIcon')} />{unread > 0 && <span className="badge">{unread}</span>}</button>
          <button className="iconbtn" onClick={() => openPopup('note', {})}><Icon name="note" size={15} title={t('right.notesIcon')} /></button>
          <button className="iconbtn" onClick={() => openPopup('quickPay', {})}><Icon name="bolt" size={15} title={t('right.quickPayIcon')} /></button>
        </>}
      </div>
    );
  }

  return (
    <div className="card rightpanel">
      <div className="spread">
        <div className="row">
          {rp.quick && <>
            <button className="iconbtn" onClick={() => navigate('messaging')}><Icon name="bell" size={15} title={t('right.alertsIcon')} />{unread > 0 && <span className="badge">{unread}</span>}</button>
            <button className="iconbtn" onClick={() => openPopup('note', {})}><Icon name="note" size={15} title={t('right.notesIcon')} /></button>
            <button className="iconbtn" onClick={() => openPopup('quickPay', {})}><Icon name="bolt" size={15} title={t('right.quickPayIcon')} /></button>
          </>}
        </div>
        <button className="iconbtn" onClick={() => setCollapsed(true)}><Icon name="chevR" size={14} title={t('right.collapse')} /></button>
      </div>

      {rp.calendar && <MiniCalendar />}

      {rp.pulse && (
        <div className="rp-block card">
          <h3 className="row"><Icon name="bolt" size={15} />{t('right.pulse')}</h3>
          <div className="pulse-line"><span>{t('right.todayRevenue')}</span><b>{fmtMoney(todayRevenue)}</b></div>
          <div className="pulse-line"><span>{t('right.pendingPayments')}</span><b>{fmtMoney(pendingTotal)}</b></div>
          <div className="pulse-line"><span>{t('right.patientsWeek')}</span><b>{patientsWeek}</b></div>
          <div>
            <div className="muted" style={{ margin: '.35em 0' }}>{t('right.adminNotes')}</div>
            {notes.slice(0, 3).map((n) => (
              <div key={n.id} className="row" style={{ fontSize: '.85em', padding: '.15em 0' }}>
                <Icon name="note" size={12} /><span>{L(n.text)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rp.today && (
        <div className="rp-block card">
          <h3 className="row"><Icon name="clock" size={15} />{t('right.todayTreatments')}</h3>
          {todayProcCounts.length === 0 ? <span className="muted">{t('right.noTreatments')}</span>
            : todayProcCounts.map(({ proc, count }) => (
              <div key={proc.id} className="pulse-line"><span>{L(proc.name)}</span><b>{count}</b></div>
            ))}
        </div>
      )}
    </div>
  );
}
