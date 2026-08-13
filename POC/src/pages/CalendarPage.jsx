import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, Modal, ModalHead } from '../components/common.jsx';
import { UserQuickInfo, QuickUserAccess } from '../components/templates.jsx';
import { fetchCalendarFeed, queryKeys } from '../api.js';
import { ymd, today } from '../data.js';

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;

// Quick view of an existing appointment
function AppointmentQuickView({ close, visitId }) {
  const { t, L, fmtDate } = useLang();
  const { visitById, userById, treatmentsOfVisit, procById, navigate } = useStore();
  const v = visitById(visitId);
  if (!v) return null;
  const user = userById(v.userId);
  const procs = treatmentsOfVisit(v.id).map((tr) => procById(tr.procId)).filter(Boolean);

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('cal.quickView')} icon="calendar" onClose={close} />
      <div className="spread">
        <b>{fmtDate(v.date)}</b>
        <span className="muted">{toHHMM(v.start)}–{toHHMM(v.end)}</span>
      </div>
      <UserQuickInfo user={user} />
      <div>
        <div className="muted" style={{ marginBottom: '.3em' }}>{t('cal.pickProcedures')}</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {procs.map((p) => <span key={p.id} className="chip on"><Icon name={p.icon || 'bolt'} size={13} />{L(p.name)}</span>)}
        </div>
      </div>
      <div className="spread">
        <span className="muted">{t('cal.duration')}: {v.end - v.start} {t('common.min')}</span>
        <button className="btn sm" onClick={() => { close(); navigate('visit', { visitId: v.id }); }}>
          <Icon name="arrowR" size={14} />{t('cal.open')}
        </button>
      </div>
    </Modal>
  );
}

// New appointment: patient + procedures + when
export function NewAppointmentPopup({ close, date }) {
  const { t, L, fmtMoney } = useLang();
  const { procedures, addVisit, addTreatment, userById, showToast } = useStore();
  const [uid, setUid] = useState(null);
  const [d, setD] = useState(date || ymd(today()));
  const [start, setStart] = useState('09:00');
  const [picked, setPicked] = useState([]);
  const [duration, setDuration] = useState(45);
  const [err, setErr] = useState(null);
  const user = uid ? userById(uid) : null;

  const toggle = (id) => setPicked((p) => {
    const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
    const total = next.reduce((s, pid) => s + (procedures.find((x) => x.id === pid)?.duration || 0), 0);
    if (total) setDuration(total);
    setErr(null);
    return next;
  });

  const create = () => {
    if (!user) { setErr(t('cal.needUser')); return; }
    if (picked.length === 0) { setErr(t('cal.needProcedure')); return; }
    const s = toMin(start);
    const visitId = addVisit({
      userId: user.id, date: d, start: s, end: s + (parseInt(duration, 10) || 30),
      status: 'scheduled', photos: { before: [], after: [] }, signed: false,
    });
    picked.forEach((pid) => addTreatment(visitId, user.id, pid));
    showToast(t('cal.created'));
    close();
  };

  return (
    <Modal onClose={close}>
      <ModalHead title={t('cal.newAppointment')} icon="calendar" onClose={close} />
      {user ? (
        <div className="spread">
          <UserQuickInfo user={user} />
          <button className="btn ghost sm" onClick={() => setUid(null)}><Icon name="x" size={13} />{t('common.cancel')}</button>
        </div>
      ) : <QuickUserAccess onFound={(u) => { setUid(u.id); setErr(null); }} />}

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <label className="row">{t('common.date')}<input type="date" value={d} onChange={(e) => setD(e.target.value)} /></label>
        <label className="row">{t('common.time')}<input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="row">{t('cal.duration')}
          <input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '6em' }} />
          <span className="muted">{t('common.min')}</span>
        </label>
      </div>

      <div>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('cal.pickProcedures')}</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {procedures.map((p) => (
            <span key={p.id} className={`chip ${picked.includes(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)}>
              <Icon name={p.icon || 'bolt'} size={13} />{L(p.name)} · {fmtMoney(p.cost)}
            </span>
          ))}
        </div>
      </div>

      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={create}><Icon name="plus" size={15} />{t('cal.addAppointment')}</button>
    </Modal>
  );
}

// Clinic activity: working hours for one day or a whole range
export function WorkingHoursPopup({ close, date }) {
  const { t } = useLang();
  const { hoursOf, setDayHours, setRangeHours, showToast } = useStore();
  const [mode, setMode] = useState('day');
  const [d, setD] = useState(date || ymd(today()));
  const [to, setTo] = useState(date || ymd(today()));
  const [ranges, setRanges] = useState(() => (hoursOf(date || ymd(today())).map(([a, b]) => [toHHMM(a), toHHMM(b)])));
  const [err, setErr] = useState(null);

  // reload the day's hours when the target day changes
  useEffect(() => { if (mode === 'day') setRanges(hoursOf(d).map(([a, b]) => [toHHMM(a), toHHMM(b)])); }, [d, mode, hoursOf]);

  const save = () => {
    const parsed = ranges.map(([a, b]) => [toMin(a), toMin(b)]);
    if (parsed.some(([a, b]) => b <= a)) { setErr(t('wh.invalid')); return; }
    if (mode === 'day') setDayHours(d, parsed);
    else setRangeHours(d, to, parsed);
    showToast(t('wh.saved'));
    close();
  };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('wh.title')} icon="clock" onClose={close} />
      <div className="row">
        <span className={`chip ${mode === 'day' ? 'on' : ''}`} onClick={() => setMode('day')}>{t('wh.singleDay')}</span>
        <span className={`chip ${mode === 'range' ? 'on' : ''}`} onClick={() => setMode('range')}>{t('wh.range')}</span>
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <label className="row">{mode === 'range' ? t('common.from') : t('common.date')}
          <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </label>
        {mode === 'range' && (
          <label className="row">{t('common.until')}<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        )}
      </div>

      <div>
        <div className="spread" style={{ marginBottom: '.4em' }}>
          <span className="muted">{t('wh.ranges')}</span>
          <button className="btn ghost sm" onClick={() => setRanges((r) => [...r, ['09:00', '13:00']])}>{t('wh.addRange')}</button>
        </div>
        {ranges.length === 0 && <div className="muted row"><Icon name="x" size={14} />{t('wh.closedAllDay')}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
          {ranges.map(([a, b], i) => (
            <div key={i} className="row">
              <input type="time" value={a} onChange={(e) => { setRanges((r) => r.map((x, j) => (j === i ? [e.target.value, x[1]] : x))); setErr(null); }} />
              <span className="muted">→</span>
              <input type="time" value={b} onChange={(e) => { setRanges((r) => r.map((x, j) => (j === i ? [x[0], e.target.value] : x))); setErr(null); }} />
              <button className="iconbtn" onClick={() => setRanges((r) => r.filter((_, j) => j !== i))}>
                <Icon name="x" size={12} title={t('common.delete')} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {err && <div className="err">{err}</div>}
      <div className="muted row" style={{ fontSize: '.85em' }}><Icon name="calendar" size={13} />{t('wh.source')}</div>
      <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export default function CalendarPage() {
  const { t, L, lang, isRTL } = useLang();
  const { nav, navigate, visits, userById, treatmentsOfVisit, procById, settings, workingHours, hoursOf } = useStore();
  const ref = useRef(null);
  const [quick, setQuick] = useState(null);
  const [adding, setAdding] = useState(null);   // date string or true
  const [hours, setHours] = useState(null);     // date string or true

  // Pulled through react-query so leaving the page cancels the in-flight fetch.
  const { data: feed = [], isFetching } = useQuery({
    queryKey: queryKeys.calendarFeed('all'),
    queryFn: ({ signal }) => fetchCalendarFeed(visits, { signal }),
    staleTime: 0,
  });

  const events = useMemo(() => (feed).map((v) => {
    const u = userById(v.userId);
    const procs = treatmentsOfVisit(v.id).map((tr) => L(procById(tr.procId)?.name)).filter(Boolean).join(', ');
    const [y, m, d] = v.date.split('-').map(Number);
    return {
      id: String(v.id),
      title: `${u ? `${L(u.first)} ${L(u.last)}` : ''} — ${procs}`,
      start: new Date(y, m - 1, d, Math.floor(v.start / 60), v.start % 60),
      end: new Date(y, m - 1, d, Math.floor(v.end / 60), v.end % 60),
    };
    // NOTE: the "Clinic Open H-H" working-hours events are deliberately never
    // turned into calendar events — they are parsed in the background only.
  }), [feed, userById, treatmentsOfVisit, procById, L]);

  useEffect(() => {
    if (nav.params.date && ref.current) ref.current.getApi().gotoDate(nav.params.date);
  }, [nav.params.date]);

  return (
    <div className="page">
      <div className="spread" style={{ flexWrap: 'wrap', gap: '.5em' }}>
        <h1 className="row"><Icon name="calendar" size={22} />{t('cal.title')}</h1>
        <span className="row" style={{ flexWrap: 'wrap' }}>
          {isFetching && <span className="muted">{t('common.search')}</span>}
          <span className="muted">{settings.calendar === 'google' ? t('cal.google') : t('cal.builtin')}</span>
          <button className="btn sm" onClick={() => setAdding(true)}><Icon name="plus" size={14} />{t('cal.addAppointment')}</button>
          <button className="btn ghost sm" onClick={() => setHours(true)}><Icon name="clock" size={14} />{t('cal.setActivity')}</button>
        </span>
      </div>
      {settings.calendar === 'builtin' && <div className="card" style={{ padding: '.7em 1em' }}><span className="muted">{t('cal.builtinSoon')}</span></div>}
      <div className="muted row"><Icon name="clock" size={14} />{t('cal.dayHint')}</div>

      <div className="card" style={{ padding: '1em', flex: 1 }}>
        <FullCalendar
          ref={ref}
          key={lang}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={nav.params.date || undefined}
          locale={isRTL ? heLocale : 'en-gb'}
          direction={isRTL ? 'rtl' : 'ltr'}
          headerToolbar={{ start: 'prev,next today', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          editable
          height="auto"
          navLinks
          // day number -> that day's working hours
          navLinkDayClick={(date) => setHours(ymd(date))}
          // empty space in a day cell -> new appointment on that date
          dateClick={(info) => setAdding(info.dateStr)}
          eventClick={(info) => setQuick(Number(info.event.id))}
          dayCellClassNames={(arg) => (hoursOf(ymd(arg.date)).length === 0 ? ['fc-day-closed'] : [])}
        />
      </div>

      {quick != null && <AppointmentQuickView close={() => setQuick(null)} visitId={quick} />}
      {adding && <NewAppointmentPopup close={() => setAdding(null)} date={typeof adding === 'string' ? adding : null} />}
      {hours && <WorkingHoursPopup close={() => setHours(null)} date={typeof hours === 'string' ? hours : null} />}
    </div>
  );
}
