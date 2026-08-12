import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, PayStatusTag } from '../components/common.jsx';
import { GCAL_EVENTS, parseOpenRanges, ymd, today } from '../data.js';

const PX = 1.7;      // pixels per minute
const GAP_H = 34;    // collapsed "closed" divider height
const SNAP = 15;

function useClock() {
  const [d, setD] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setD(new Date()), 1000); return () => clearInterval(id); }, []);
  return d;
}

function useWeather() {
  const mk = () => ({
    temp: 24 + Math.floor(Math.random() * 9),
    kind: ['sunny', 'partly', 'clear', 'hot'][Math.floor(Math.random() * 4)],
    humidity: 40 + Math.floor(Math.random() * 35),
  });
  const [w, setW] = useState(mk);
  useEffect(() => { const id = setInterval(() => setW(mk()), 30 * 60 * 1000); return () => clearInterval(id); }, []);
  return w;
}

function ClockWeather() {
  const { t, fmtDateLong } = useLang();
  const d = useClock();
  const w = useWeather();
  const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0'), ss = String(d.getSeconds()).padStart(2, '0');
  return (
    <div className="card clockweather">
      <span className="clock-time">{hh}:{mm}<span style={{ fontSize: '.55em', opacity: .7 }}>:{ss}</span></span>
      <div>
        <div><b>{fmtDateLong(d)}</b></div>
        <div className="muted">{t('weather.city')}</div>
      </div>
      <div className="row" style={{ marginInlineStart: 'auto' }}>
        <Icon name={w.kind === 'partly' ? 'cloud' : 'sun'} size={34} />
        <div>
          <div style={{ fontSize: '1.3em', fontWeight: 700 }}>{w.temp}°C</div>
          <div className="muted">{t(`weather.${w.kind}`)} · {t('weather.feels', { t: w.temp + 2 })} · {t('weather.humidity', { h: w.humidity })}</div>
        </div>
      </div>
    </div>
  );
}

function Welcome() {
  const { t, L, fmtNum } = useLang();
  const { todayVisits, treatmentsOfVisit, procById } = useStore();
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const counts = new Map();
  for (const v of todayVisits) for (const tr of treatmentsOfVisit(v.id)) {
    const p = procById(tr.procId);
    if (p) counts.set(p.id, { proc: p, n: (counts.get(p.id)?.n || 0) + 1 });
  }
  const parts = [...counts.values()].map(({ proc, n }) => `${fmtNum(n)} × ${L(proc.name)}`);
  const list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ` ${t('common.and')}${parts.at(-1)}` : parts[0];

  return (
    <div className="card welcome">
      <button className="iconbtn x" onClick={() => setClosed(true)}><Icon name="x" size={13} title={t('common.close')} /></button>
      <h2 style={{ marginBottom: '.2em' }}>{parts.length ? t('home.welcomeHint', { list }) : t('home.welcomeEmpty')}</h2>
    </div>
  );
}

// One appointment block. Fields beyond the core four are toggled in App settings,
// and every block shares `template` so columns never misalign between rows.
function ApptBlock({ visit, template, simple, style, onPointerDown, className = '' }) {
  const { t, L, fmtMoney, fmtNum } = useLang();
  const { settings, userById, treatmentsOfVisit, procById, visitPayStatus, visitPaid, userLastVisit, doneVisitsOfUser, userTotalSpent } = useStore();
  const f = settings.apptFields;
  const user = userById(visit.userId);
  if (!user) return null;

  const trs = treatmentsOfVisit(visit.id);
  const procNames = trs.map((tr) => L(procById(tr.procId)?.name)).filter(Boolean).join(', ');
  const last = userLastVisit(user.id);
  const lastTrs = last ? treatmentsOfVisit(last.id).map((tr) => L(procById(tr.procId)?.name)).filter(Boolean).join(', ') : null;
  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;

  return (
    <div className={`appt ${simple ? 'simple' : ''} ${className}`} style={style} onPointerDown={onPointerDown}>
      <div className="appt-grid" style={{ gridTemplateColumns: template }}>
        <b>{fmtMin(visit.start)}</b>
        <img className="avatar" src={user.photo} width={34} height={34} alt="" />
        <span><b>{L(user.first)} {L(user.last)}</b><br /><span className="muted">{user.phone}</span></span>
        <span>{procNames}</span>
        {f.payStatus && <PayStatusTag status={visitPayStatus(visit.id)} sum={visitPaid(visit.id)} fmtMoney={fmtMoney} />}
        {(f.lastVisit || f.lastTreatments) && (
          <span className="muted">
            {last ? (
              <>
                {f.lastVisit && <>{t('home.lastVisit')}: {last.date}</>}
                {f.lastVisit && f.lastTreatments && <br />}
                {f.lastTreatments && lastTrs}
              </>
            ) : t('home.firstVisit')}
          </span>
        )}
        {f.visitsSpend && (
          <span className="muted">
            {t('home.visitsCount', { n: fmtNum(doneVisitsOfUser(user.id).length) })}<br />
            {t('home.spentSum', { sum: fmtMoney(userTotalSpent(user.id)) })}
          </span>
        )}
      </div>
      {f.notes && user.notes.length > 0 && (
        <div className="appt-note"><Icon name="note" size={13} />{user.notes.map((n) => L(n)).join(' · ')}</div>
      )}
      {f.alerts && user.alerts.length > 0 && (
        <div className="appt-alert"><Icon name="alert" size={13} />{user.alerts.map((a) => L(a)).join(' · ')}</div>
      )}
    </div>
  );
}

function TodayAppointments() {
  const { t } = useLang();
  const { settings, setSettings, todayVisits, updateVisit, navigate } = useStore();
  const clock = useClock();
  const [drag, setDrag] = useState(null); // {visitId, dy}
  const view = settings.homeApptView;

  const openEvent = GCAL_EVENTS.find((e) => e.date === ymd(today()) && e.open);
  const ranges = openEvent ? parseOpenRanges(openEvent.title) : [];

  // segment layout: pixel offset of each open range; closed time spliced out
  const segs = useMemo(() => {
    let y = 0;
    return ranges.map(([a, b], i) => {
      const seg = { a, b, y, h: (b - a) * PX, i };
      y += seg.h + (i < ranges.length - 1 ? GAP_H : 0);
      return seg;
    });
  }, [ranges]);
  const totalH = segs.length ? segs.at(-1).y + segs.at(-1).h : 0;

  const timeToY = (min) => {
    for (const s of segs) if (min >= s.a && min <= s.b) return s.y + (min - s.a) * PX;
    for (const s of segs) if (min < s.a) return s.y;
    return totalH;
  };
  const yToTime = (y) => {
    for (const s of segs) { if (y <= s.y + s.h) return s.a + Math.max(0, (y - s.y)) / PX; }
    return segs.length ? segs.at(-1).b : 0;
  };

  const nowMin = clock.getHours() * 60 + clock.getMinutes();

  // shared grid template — computed once from the toggles so all blocks align
  const template = useMemo(() => {
    const f = settings.apptFields;
    const cols = ['3.4em', '2.6em', 'minmax(8em, 1.2fr)', 'minmax(6em, 1fr)'];
    if (f.payStatus) cols.push('6.5em');
    if (f.lastVisit || f.lastTreatments) cols.push('minmax(7em, 1fr)');
    if (f.visitsSpend) cols.push('minmax(6.5em, 1fr)');
    return cols.join(' ');
  }, [settings.apptFields]);

  const statusClass = (v) => {
    if (v.status === 'active') return 'st-active';
    if (v.status !== 'scheduled') return '';
    if (nowMin > v.end) return 'st-missed';           // never started, time passed
    if (nowMin >= v.start) return 'st-delayed';       // due now, not started yet
    return '';
  };

  const startDrag = (e, visit) => {
    e.preventDefault();
    const startY = e.clientY;
    const move = (ev) => setDrag({ visitId: visit.id, dy: ev.clientY - startY });
    const up = (ev) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      setDrag(null);
      const dy = ev.clientY - startY;
      if (Math.abs(dy) < 5) { navigate('visit', { visitId: visit.id }); return; }
      const dur = visit.end - visit.start;
      let ns = Math.round(yToTime(timeToY(visit.start) + dy) / SNAP) * SNAP;
      const seg = segs.find((s) => ns >= s.a && ns <= s.b) || segs[0];
      if (seg) { ns = Math.max(seg.a, Math.min(ns, seg.b - dur)); updateVisit(visit.id, { start: ns, end: ns + dur }); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;

  const header = (
    <div className="spread" style={{ marginBottom: '.6em', flexWrap: 'wrap', gap: '.5em' }}>
      <h2 className="row"><Icon name="clock" size={18} />{t('home.appointments')}</h2>
      <span className="row" style={{ flexWrap: 'wrap' }}>
        {openEvent && <span className="muted">{t('home.openHours', { ranges: ranges.map(([a, b]) => `${fmtMin(a)}–${fmtMin(b)}`).join(' · ') })}</span>}
        <span className="row">
          <button className={`chip ${view === 'schedule' ? 'on' : ''}`} onClick={() => setSettings((s) => ({ ...s, homeApptView: 'schedule' }))}>
            <Icon name="calendar" size={13} />{t('home.viewSchedule')}
          </button>
          <button className={`chip ${view === 'simple' ? 'on' : ''}`} onClick={() => setSettings((s) => ({ ...s, homeApptView: 'simple' }))}>
            <Icon name="note" size={13} />{t('home.viewSimple')}
          </button>
        </span>
      </span>
    </div>
  );

  if (view === 'simple') {
    return (
      <div className="card" style={{ padding: '1em' }}>
        {header}
        <div className="simple-list">
          {todayVisits.length === 0 ? <div className="muted">{t('home.noAppointments')}</div>
            : todayVisits.map((v) => (
              <ApptBlock key={v.id} visit={v} template={template} simple className={statusClass(v)}
                onPointerDown={() => navigate('visit', { visitId: v.id })} />
            ))}
        </div>
      </div>
    );
  }

  if (!openEvent || segs.length === 0) {
    return (
      <div className="card" style={{ padding: '1em' }}>
        {header}
        <div style={{ padding: '1.2em', textAlign: 'center' }} className="row"><Icon name="clock" size={20} />{t('home.clinicClosed')}</div>
      </div>
    );
  }

  const hourTicks = [];
  for (const s of segs) for (let h = Math.ceil(s.a / 60); h * 60 <= s.b; h++) hourTicks.push({ y: s.y + (h * 60 - s.a) * PX, label: fmtMin(h * 60) });
  const gaps = segs.slice(0, -1).map((s, i) => ({ y: s.y + s.h, from: s.b, to: segs[i + 1].a }));

  return (
    <div className="card" style={{ padding: '1em' }}>
      {header}
      <div style={{ position: 'relative', height: totalH }}>
        {hourTicks.map((tk, i) => (
          <React.Fragment key={i}>
            <div className="sched-hour" style={{ top: tk.y }}>{tk.label}</div>
            <div style={{ position: 'absolute', top: tk.y, insetInlineStart: '3.6em', insetInlineEnd: 0, borderTop: '1px solid var(--line)', opacity: .5 }} />
          </React.Fragment>
        ))}
        {gaps.map((g, i) => (
          <div key={i} className="sched-gap" style={{ position: 'absolute', top: g.y, insetInlineStart: '3.6em', insetInlineEnd: 0, height: GAP_H }}>
            <Icon name="clock" size={12} />{t('home.closed')} {fmtMin(g.from)}–{fmtMin(g.to)}
          </div>
        ))}
        {nowMin >= segs[0].a && nowMin <= segs.at(-1).b && (
          <div style={{ position: 'absolute', top: timeToY(nowMin), insetInlineStart: '3.2em', insetInlineEnd: 0, borderTop: '2px solid var(--c2)', zIndex: 4, boxShadow: 'var(--glow)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, marginInlineStart: '3.6em' }}>
          {todayVisits.map((v) => {
            const dy = drag?.visitId === v.id ? drag.dy : 0;
            return (
              <ApptBlock key={v.id} visit={v} template={template}
                className={`${statusClass(v)} ${drag?.visitId === v.id ? 'dragging' : ''}`}
                style={{ top: timeToY(v.start), '--h': `${(v.end - v.start) * PX}px`, transform: dy ? `translateY(${dy}px)` : undefined }}
                onPointerDown={(e) => startDrag(e, v)} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { settings } = useStore();
  return (
    <div className="page">
      <ClockWeather />
      {settings.showWelcome && <Welcome />}
      <TodayAppointments />
    </div>
  );
}
