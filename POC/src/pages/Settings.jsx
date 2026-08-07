import React from 'react';
import { useLang } from '../i18n.jsx';
import { useStore, PRESETS } from '../store.jsx';
import { Icon, Toggle } from '../components/common.jsx';

export default function Settings() {
  const { t } = useLang();
  const { settings, setSettings } = useStore();
  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="page">
      <h1 className="row"><Icon name="gear" size={22} />{t('set.title')}</h1>

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
