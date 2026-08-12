import React, { useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore, PRESETS } from '../store.jsx';
import { Icon, Toggle } from '../components/common.jsx';

export default function Settings() {
  const { t } = useLang();
  const { settings, setSettings } = useStore();
  const logoRef = useRef(null);
  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const setRp = (k, v) => setSettings((s) => ({ ...s, rp: { ...s.rp, [k]: v } }));
  const setAppt = (k, v) => setSettings((s) => ({ ...s, apptFields: { ...s.apptFields, [k]: v } }));

  return (
    <div className="page">
      <h1 className="row"><Icon name="gear" size={22} />{t('set.title')}</h1>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.5em' }}><Icon name="home" size={17} />{t('set.clinic')}</h2>
        <div className="setrow">
          <span>{t('set.clinicName')}</span>
          <input value={settings.clinicName} placeholder={t('set.clinicNamePh')}
            onChange={(e) => set({ clinicName: e.target.value })} style={{ width: '18em', maxWidth: '100%' }} />
        </div>
        <div className="setrow">
          <span>{t('set.clinicLogo')}</span>
          <span className="row">
            {settings.clinicLogo
              ? <img src={settings.clinicLogo} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <span className="logo" style={{ width: '2.5em', height: '2.5em', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--c2)', color: '#16213c', fontWeight: 900 }}>S</span>}
            <button className="btn ghost sm" onClick={() => logoRef.current?.click()}><Icon name="camera" size={14} />{t('set.uploadLogo')}</button>
            {settings.clinicLogo && <button className="btn ghost sm" onClick={() => set({ clinicLogo: null })}><Icon name="x" size={13} />{t('set.resetLogo')}</button>}
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader(); r.onload = () => set({ clinicLogo: r.result }); r.readAsDataURL(f);
            }} />
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="edit" size={17} />{t('set.theme')}</h2>
        <div className="row" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} className={`preset card ${!settings.useCustom && settings.preset === key ? 'on' : ''}`}
              onClick={() => set({ preset: key, useCustom: false })}>
              <span className="swatches">
                <span className="sw" style={{ background: p.c1 }} />
                <span className="sw" style={{ background: p.c2 }} />
                <span className="sw" style={{ background: p.c3 }} />
              </span>
              <span style={{ fontSize: '.85em' }}>{t(`set.${key}`)}</span>
            </button>
          ))}
          <div className={`preset card ${settings.useCustom ? 'on' : ''}`} onClick={() => set({ useCustom: true })} style={{ cursor: 'pointer' }}>
            <span className="row">
              <label className="muted" style={{ fontSize: '.75em' }}>{t('set.c1')}
                <input type="color" value={settings.custom.c1} onChange={(e) => set({ useCustom: true, custom: { ...settings.custom, c1: e.target.value } })} />
              </label>
              <label className="muted" style={{ fontSize: '.75em' }}>{t('set.c2')}
                <input type="color" value={settings.custom.c2} onChange={(e) => set({ useCustom: true, custom: { ...settings.custom, c2: e.target.value } })} />
              </label>
              <label className="muted" style={{ fontSize: '.75em' }}>{t('set.c3')}
                <input type="color" value={settings.custom.c3} onChange={(e) => set({ useCustom: true, custom: { ...settings.custom, c3: e.target.value } })} />
              </label>
            </span>
            <span style={{ fontSize: '.85em' }}>{t('set.custom')}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.4em' }}><Icon name="gear" size={17} />{t('set.design')}</h2>
        <div className="setrow">
          <span>{t('set.corners')} · {settings.corners}%</span>
          <input type="range" min="0" max="100" value={settings.corners} onChange={(e) => set({ corners: Number(e.target.value) })} style={{ width: '14em' }} />
        </div>
        <div className="setrow">
          <span>{t('set.font')} · {settings.fontLevel}/5</span>
          <input type="range" min="1" max="5" step="1" value={settings.fontLevel} onChange={(e) => set({ fontLevel: Number(e.target.value) })} style={{ width: '14em' }} />
        </div>
        <div className="setrow">
          <span>{t('set.shadows')}</span>
          <Toggle on={settings.shadows} onChange={(v) => set({ shadows: v })} />
        </div>
        <div className="setrow">
          <span>{t('set.borders')}</span>
          <Toggle on={settings.borders} onChange={(v) => set({ borders: v })} />
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.4em' }}><Icon name="box" size={17} />{t('set.rightPanel')}</h2>
        <div className="setrow"><span>{t('set.rpQuick')}</span><Toggle on={settings.rp.quick} onChange={(v) => setRp('quick', v)} /></div>
        <div className="setrow"><span>{t('set.rpCalendar')}</span><Toggle on={settings.rp.calendar} onChange={(v) => setRp('calendar', v)} /></div>
        <div className="setrow"><span>{t('set.rpPulse')}</span><Toggle on={settings.rp.pulse} onChange={(v) => setRp('pulse', v)} /></div>
        <div className="setrow"><span>{t('set.rpToday')}</span><Toggle on={settings.rp.today} onChange={(v) => setRp('today', v)} /></div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.4em' }}><Icon name="home" size={17} />{t('set.apptDesign')}</h2>
        <div className="setrow">
          <span>{t('set.welcome')}</span>
          <Toggle on={settings.showWelcome} onChange={(v) => set({ showWelcome: v })} />
        </div>
        <div className="setrow">
          <span>{t('set.homeView')}</span>
          <span className="row">
            <span className={`chip ${settings.homeApptView === 'schedule' ? 'on' : ''}`} onClick={() => set({ homeApptView: 'schedule' })}>{t('home.viewSchedule')}</span>
            <span className={`chip ${settings.homeApptView === 'simple' ? 'on' : ''}`} onClick={() => set({ homeApptView: 'simple' })}>{t('home.viewSimple')}</span>
          </span>
        </div>
        <div className="setrow"><span>{t('set.apPayStatus')}</span><Toggle on={settings.apptFields.payStatus} onChange={(v) => setAppt('payStatus', v)} /></div>
        <div className="setrow"><span>{t('set.apLastVisit')}</span><Toggle on={settings.apptFields.lastVisit} onChange={(v) => setAppt('lastVisit', v)} /></div>
        <div className="setrow"><span>{t('set.apLastTreatments')}</span><Toggle on={settings.apptFields.lastTreatments} onChange={(v) => setAppt('lastTreatments', v)} /></div>
        <div className="setrow"><span>{t('set.apVisitsSpend')}</span><Toggle on={settings.apptFields.visitsSpend} onChange={(v) => setAppt('visitsSpend', v)} /></div>
        <div className="setrow"><span>{t('set.apNotes')}</span><Toggle on={settings.apptFields.notes} onChange={(v) => setAppt('notes', v)} /></div>
        <div className="setrow"><span>{t('set.apAlerts')}</span><Toggle on={settings.apptFields.alerts} onChange={(v) => setAppt('alerts', v)} /></div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.4em' }}><Icon name="calendar" size={17} />{t('set.calendar')}</h2>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <label className="chip" style={{ gap: '.4em' }}>
            <input type="radio" name="cal" checked={settings.calendar === 'google'} onChange={() => set({ calendar: 'google' })} />
            {t('set.google')}
          </label>
          <label className="chip" style={{ gap: '.4em' }}>
            <input type="radio" name="cal" checked={settings.calendar === 'builtin'} onChange={() => set({ calendar: 'builtin' })} />
            {t('set.builtin')}
          </label>
        </div>
        {settings.calendar === 'google' && (
          <div className="row" style={{ marginTop: '.7em', flexWrap: 'wrap' }}>
            <label>{t('set.googleId')}<input value={settings.googleId} onChange={(e) => set({ googleId: e.target.value })} style={{ width: '18em' }} /></label>
            <label>{t('set.googleKey')}<input value={settings.googleKey} onChange={(e) => set({ googleKey: e.target.value })} style={{ width: '14em' }} /></label>
          </div>
        )}
        {settings.calendar === 'builtin' && <div className="muted" style={{ marginTop: '.5em' }}>{t('cal.builtinSoon')}</div>}
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.4em' }}><Icon name="note" size={17} />{t('set.optional')}</h2>
        <div className="setrow">
          <span>{t('set.optMember')}</span>
          <Toggle on={settings.optMemberLine} onChange={(v) => set({ optMemberLine: v })} />
        </div>
        <div className="setrow">
          <span>{t('set.optVisitSum')}</span>
          <Toggle on={settings.optVisitSummary} onChange={(v) => set({ optVisitSummary: v })} />
        </div>
      </div>
    </div>
  );
}
