import React, { useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon } from '../components/common.jsx';
import { GCAL_EVENTS } from '../data.js';

export default function CalendarPage() {
  const { t, L, lang, isRTL } = useLang();
  const { nav, navigate, visits, userById, treatmentsOfVisit, procById, settings } = useStore();
  const ref = useRef(null);

  const events = useMemo(() => {
    const vs = visits.map((v) => {
      const u = userById(v.userId);
      const procs = treatmentsOfVisit(v.id).map((tr) => L(procById(tr.procId)?.name)).filter(Boolean).join(', ');
      const [y, m, d] = v.date.split('-').map(Number);
      return {
        id: String(v.id),
        title: `${u ? `${L(u.first)} ${L(u.last)}` : ''} — ${procs}`,
        start: new Date(y, m - 1, d, Math.floor(v.start / 60), v.start % 60),
        end: new Date(y, m - 1, d, Math.floor(v.end / 60), v.end % 60),
      };
    });
    const open = GCAL_EVENTS.map((e) => ({ id: e.id, title: e.title, start: e.date, allDay: true, display: 'background', color: 'var(--c2)' }));
    return [...vs, ...open];
  }, [visits, userById, treatmentsOfVisit, procById, L]);

  useEffect(() => {
    if (nav.params.date && ref.current) ref.current.getApi().gotoDate(nav.params.date);
  }, [nav.params.date]);

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="calendar" size={22} />{t('cal.title')}</h1>
        <span className="muted">{settings.calendar === 'google' ? t('cal.google') : t('cal.builtin')}</span>
      </div>
      {settings.calendar === 'builtin' && <div className="card" style={{ padding: '.7em 1em' }} ><span className="muted">{t('cal.builtinSoon')}</span></div>}
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
          editable={true}
          height="auto"
          eventClick={(info) => { if (!info.event.allDay) navigate('visit', { visitId: Number(info.event.id) }); }}
        />
      </div>
    </div>
  );
}
