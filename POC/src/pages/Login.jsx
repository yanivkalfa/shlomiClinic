import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon } from '../components/common.jsx';
import { ADMIN } from '../data.js';

export default function Login() {
  const { t, lang, setLang } = useLang();
  const { setSession } = useStore();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (u.trim() === ADMIN.username && p === ADMIN.password) setSession({ name: t('topbar.admin') });
    else setErr(true);
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="langswitch" style={{ margin: '0 auto' }}>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>{t('lang.en')}</button>
          <button className={lang === 'he' ? 'on' : ''} onClick={() => setLang('he')}>{t('lang.he')}</button>
        </div>
        <div className="logo-big">S</div>
        <div>
          <h1>{t('app.name')}</h1>
          <div className="muted">{t('app.tagline')}</div>
        </div>
        <h2>{t('login.welcome')}</h2>
        <div className="muted">{t('login.sub')}</div>
        <form onSubmit={submit}>
          <label>{t('login.username')}
            <input value={u} onChange={(e) => { setU(e.target.value); setErr(false); }} style={{ width: '100%' }} autoFocus />
          </label>
          <label>{t('login.password')}
            <input type="password" value={p} onChange={(e) => { setP(e.target.value); setErr(false); }} style={{ width: '100%' }} />
          </label>
          {err && <div className="err">{t('login.error')}</div>}
          <button type="submit" className="btn"><Icon name="check" size={16} />{t('login.signin')}</button>
        </form>
        <div className="muted">{t('login.hint', { u: ADMIN.username, p: ADMIN.password })}</div>
      </div>
    </div>
  );
}
