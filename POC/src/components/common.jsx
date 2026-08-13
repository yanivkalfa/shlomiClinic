import React, { useState, useMemo } from 'react';
import { useLang } from '../i18n.jsx';

// Inline stroke icons — currentColor, so they inherit text color
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9h13v-9',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chat: 'M4 5h16v11H9l-5 4z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M17.5 14.8c2.1.6 3.6 2.3 4 5.2',
  coins: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  box: 'M3.5 7 12 3l8.5 4v10L12 21l-8.5-4zM3.5 7 12 11l8.5-4M12 11v10',
  truck: 'M2 6h12v10H2zM14 10h4l3 3v3h-7M6.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
  legal: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.8-1.6L13.3 2h-2.6l-.4 2.9a7 7 0 0 0-2.8 1.6l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.8 1.6l.4 2.9h2.6l.4-2.9a7 7 0 0 0 2.8-1.6l2.3 1 2-3.4-2-1.5c.1-.5.2-1 .2-1.6z',
  bell: 'M6 16v-5a6 6 0 1 1 12 0v5l1.5 2.5h-15zM10 21a2.5 2.5 0 0 0 4 0',
  note: 'M5 4h14v13l-4 4H5zM15 21v-4h4M8 9h8M8 13h5',
  bolt: 'M13 2 5 13h5l-1 9 8-11h-5z',
  dollar: 'M12 2v20M16.5 6.5c-1-1.3-2.6-2-4.5-2-2.5 0-4.5 1.3-4.5 3.5s2 3 4.5 3.5 4.5 1.3 4.5 3.5-2 3.5-4.5 3.5c-1.9 0-3.5-.7-4.5-2',
  card: 'M2.5 6h19v12h-19zM2.5 10h19M6 15h4',
  cash: 'M2.5 7h19v10h-19zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5.5 9.5v.01M18.5 14.5v.01',
  phone: 'M5 3h4l1.5 5L8 9.5a12 12 0 0 0 6.5 6.5l1.5-2.5 5 1.5v4c0 1-1 2-2 1.9C10.5 20 4 13.5 3.1 5 3 4 4 3 5 3z',
  mail: 'M3 5.5h18v13H3zM3 6.5l9 6.5 9-6.5',
  pin: 'M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5c0 5-7 11.5-7 11.5zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 21 21',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'M4.5 12.5 10 18 19.5 6.5',
  edit: 'M4 20h4l11-11-4-4L4 16zM13 7l4 4',
  trash: 'M4.5 6.5h15M9.5 6V4h5v2M6.5 6.5 8 21h8l1.5-14.5M10.5 10.5v6M13.5 10.5v6',
  camera: 'M3.5 7.5h4l2-2.5h5l2 2.5h4v12h-17zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  print: 'M6.5 8V3.5h11V8M6.5 17H3.5v-9h17v9h-3M6.5 13.5h11v7h-11z',
  alert: 'M12 3 2.5 20h19zM12 9.5V14M12 17v.01',
  gift: 'M3.5 8.5h17v4h-17zM5 12.5V21h14v-8.5M12 8.5V21M12 8.5S9 8 8 6.5 8.5 3 10 3.5s2 3 2 5zM12 8.5s3-.5 4-2S15.5 3 14 3.5s-2 3-2 5z',
  chart: 'M4 20h16M7 16v-5M12 16V7M17 16v-8',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  wallet: 'M3.5 6.5h15v-2h-13v14h17v-10h-19M16 13.5h.01',
  play: 'M7 4.5 19 12 7 19.5z',
  pause: 'M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z',
  stop: 'M6 6h12v12H6z',
  arrowR: 'M4 12h16M13 5l7 7-7 7',
  chevL: 'M14.5 5.5 8 12l6.5 6.5',
  chevR: 'M9.5 5.5 16 12l-6.5 6.5',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  doc: 'M6 2.5h9l4 4v15H6zM14.5 2.5v4.5H19M9 12h7M9 16h7',
  logout: 'M14 6V3.5H4.5v17H14V18M9 12h11.5M17 8.5l3.5 3.5-3.5 3.5',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
  cloud: 'M6.5 18.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.8-1.4 4.5 4.5 0 0 1-.8 9.4z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.2 6.8v.01',
  facebook: 'M14 21v-8h3l.7-3.5H14V7.3c0-1 .3-1.8 2-1.8h1.8V2.4C17.5 2.3 16.4 2.2 15.2 2.2 12.6 2.2 10.8 3.8 10.8 6.7v2.8H7.7V13h3.1v8z',
  tiktok: 'M15 3c.4 2.6 2 4.2 4.5 4.5v3.2c-1.7 0-3.2-.5-4.5-1.4v6.2A5.5 5.5 0 1 1 9.5 10v3.3A2.3 2.3 0 1 0 11.8 15.6V3z',
  whatsapp: 'M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zM8.5 8.5c.3-.8 1-.8 1.3-.2l.8 1.5c.2.4-.2.9-.6 1.3s.6 1.8 1.6 2.6 2 1.3 2.4 1l1-.7c.5-.3 1.1.2 1.4.7.2.5.2 1-.3 1.5-2.7 2.2-8.9-3.3-7.6-7.7z',
  // procedure glyphs
  lips: 'M4 12c3-4 5-5 8-5s5 1 8 5c-3 4-5 5-8 5s-5-1-8-5zM4 12h16',
  syringe: 'M14 3l7 7M17.5 6.5 20 4M12.5 7.5 16.5 11.5M11 9l4 4-7 7H4v-4z',
  sparkle: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z',
  droplet: 'M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z',
  brow: 'M4 13c3-5 13-5 16 0M6 10.5c3-2.5 9-2.5 12 0',
  heart: 'M12 20s-7.5-4.7-9.2-9A5 5 0 0 1 12 7a5 5 0 0 1 9.2 4c-1.7 4.3-9.2 9-9.2 9z',
  download: 'M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16',
  image: 'M3.5 5h17v14h-17zM3.5 15l5-5 4 4 3-3 5 5',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
};

// icons offered when naming a procedure
export const PROC_ICONS = ['lips', 'syringe', 'sparkle', 'droplet', 'brow', 'heart', 'bolt', 'gift'];

export function Icon({ name, size = 18, className = '', title }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-label={title} role={title ? 'img' : 'presentation'}>
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name] || PATHS.doc} />
    </svg>
  );
}

// Back navigation. The chevron flips in RTL — a directional glyph must mirror
// with the layout, unlike neutral icons (phone, camera).
export function BackButton({ onClick }) {
  const { t, isRTL } = useLang();
  return (
    <button className="btn ghost sm" onClick={onClick}>
      <Icon name={isRTL ? 'chevR' : 'chevL'} size={14} />{t('common.back')}
    </button>
  );
}

export function Modal({ onClose, children, className = '' }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal card ${className}`}>{children}</div>
    </div>
  );
}

export function ModalHead({ title, onClose, icon }) {
  const { t } = useLang();
  return (
    <div className="spread">
      <h2 className="row">{icon ? <Icon name={icon} size={20} /> : null}{title}</h2>
      <button className="iconbtn" onClick={onClose}><Icon name="x" size={15} title={t('common.close')} /></button>
    </div>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" className="row" onClick={() => onChange(!on)} style={{ gap: '.55em' }}>
      <span className={`switch ${on ? 'on' : ''}`} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(([key, label]) => (
        <button key={key} className={active === key ? 'on' : ''} onClick={() => onChange(key)}>{label}</button>
      ))}
    </div>
  );
}

// Sortable / searchable / paginated table.
// columns: [{ key, label, render(row), sortVal(row), width }]
export function DataTable({ columns, rows, searchText, searchFn, pageSize = 8, onRowDoubleClick, footer }) {
  const { t } = useLang();
  const [sort, setSort] = useState(null); // {key, dir}
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let r = rows;
    if (searchText && searchFn) {
      const q = searchText.trim().toLowerCase();
      if (q) r = r.filter((row) => searchFn(row, q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortVal) {
        r = [...r].sort((a, b) => {
          const va = col.sortVal(a), vb = col.sortVal(b);
          const c = va < vb ? -1 : va > vb ? 1 : 0;
          return sort.dir === 'asc' ? c : -c;
        });
      }
    }
    return r;
  }, [rows, searchText, searchFn, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const slice = filtered.slice(cur * pageSize, cur * pageSize + pageSize);

  return (
    <div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}
                  onClick={() => c.sortVal && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'asc' }))}>
                  {c.label}{sort?.key === c.key ? <span className="sortmark"> {sort.dir === 'asc' ? '▲' : '▼'}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={columns.length} className="muted" style={{ textAlign: 'center', padding: '1.6em' }}>{t('tbl.noData')}</td></tr>
            ) : slice.map((row) => (
              <tr key={row.id} onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}>
                {columns.map((c) => <td key={c.key}>{c.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
      {pages > 1 && (
        <div className="pager">
          <button className="iconbtn" disabled={cur === 0} onClick={() => setPage(cur - 1)} style={{ opacity: cur === 0 ? .4 : 1 }}><Icon name="chevL" size={14} title={t('tbl.prev')} /></button>
          <span>{t('tbl.page', { a: cur + 1, b: pages })}</span>
          <button className="iconbtn" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} style={{ opacity: cur >= pages - 1 ? .4 : 1 }}><Icon name="chevR" size={14} title={t('tbl.next')} /></button>
        </div>
      )}
    </div>
  );
}

export function PayStatusTag({ status, sum, fmtMoney }) {
  const { t } = useLang();
  if (status === 'paid') return <span className="tag paid"><Icon name="check" size={12} />{t('pay.paid')}</span>;
  if (status === 'partial') return <span className="tag partial">{sum != null && fmtMoney ? t('pay.partialSum', { sum: fmtMoney(sum) }) : t('pay.partial')}</span>;
  return <span className="tag pending"><Icon name="clock" size={12} />{t('pay.pending')}</span>;
}

// Draggable/zoomable image inside a clipped stage (used by compare view + photo editor)
export function PanZoomImg({ src, state, setState, style }) {
  const onDown = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, ox = state.x, oy = state.y;
    const move = (ev) => setState((s) => ({ ...s, x: ox + (ev.clientX - startX), y: oy + (ev.clientY - startY) }));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const onWheel = (e) => {
    e.preventDefault();
    setState((s) => ({ ...s, scale: Math.min(6, Math.max(.3, s.scale * (e.deltaY < 0 ? 1.12 : 0.89))) }));
  };
  return (
    <img src={src} alt="" draggable={false} onPointerDown={onDown} onWheel={onWheel}
      style={{ transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`, ...style }} />
  );
}
