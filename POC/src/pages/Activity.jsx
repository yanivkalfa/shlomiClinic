import React from 'react';
import { useLang } from '../i18n.jsx';
import { Icon } from '../components/common.jsx';
import { AppointmentsTable } from '../components/appointments.jsx';

// P. Activity — the appointments table across every patient
export default function Activity() {
  const { t } = useLang();
  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="chart" size={22} />{t('act.title')}</h1>
        <span className="muted">{t('act.sub')}</span>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <AppointmentsTable pageSize={9} />
      </div>
    </div>
  );
}
