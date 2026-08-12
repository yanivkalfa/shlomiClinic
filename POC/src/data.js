// ---- date helpers (all relative to "now" so the demo is always alive) ----
export const now = () => new Date();
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
export const ymd = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const atTime = (d, h, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
export const minutesBetween = (a, b) => Math.round((b - a) / 60000);
export const ageOf = (birth) => { const b = new Date(birth), n = new Date(); let a = n.getFullYear() - b.getFullYear(); const m = n.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--; return a; };
export const sameDay = (a, b) => ymd(a) === ymd(b);

// ---- SVG image generators (no text inside images — labels stay translatable in HTML) ----
const svgUri = (s) => `data:image/svg+xml,${encodeURIComponent(s)}`;

export function genAvatar(initials, hue) {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue},70%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},75%,30%)"/></linearGradient></defs>
<rect width="120" height="120" fill="url(#g)"/>
<circle cx="60" cy="46" r="22" fill="rgba(255,255,255,.85)"/>
<ellipse cx="60" cy="102" rx="34" ry="26" fill="rgba(255,255,255,.85)"/>
<text x="60" y="53" font-family="Arial" font-size="20" font-weight="bold" fill="hsl(${hue},70%,30%)" text-anchor="middle">${initials}</text>
</svg>`);
}

// Stylized face for before/after shots. lips: 0..1 fullness, flaw: wrinkle opacity, blush: cheek tint
export function genFace({ hue = 25, lips = 0.4, flaw = 0.5, blush = 0.15, variant = 0 }) {
  const lipW = 16 + lips * 14, lipH = 4 + lips * 6;
  const bg = `hsl(${(200 + variant * 37) % 360},35%,20%)`;
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360">
<rect width="300" height="360" fill="${bg}"/>
<ellipse cx="150" cy="185" rx="88" ry="115" fill="hsl(${hue},55%,80%)"/>
<path d="M62 150 Q150 40 238 150 Q238 96 150 82 Q62 96 62 150" fill="hsl(${(hue + 340) % 360},35%,25%)"/>
<ellipse cx="115" cy="170" rx="13" ry="7" fill="#fff"/><circle cx="115" cy="170" r="5" fill="hsl(215,60%,30%)"/>
<ellipse cx="185" cy="170" rx="13" ry="7" fill="#fff"/><circle cx="185" cy="170" r="5" fill="hsl(215,60%,30%)"/>
<path d="M100 152 Q115 144 132 151" stroke="hsl(${(hue + 340) % 360},35%,28%)" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M168 151 Q185 144 200 152" stroke="hsl(${(hue + 340) % 360},35%,28%)" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M150 185 Q146 210 140 218 Q150 226 160 218" stroke="hsl(${hue},45%,68%)" stroke-width="3" fill="none"/>
<ellipse cx="98" cy="215" rx="14" ry="8" fill="hsl(350,80%,70%)" opacity="${blush}"/>
<ellipse cx="202" cy="215" rx="14" ry="8" fill="hsl(350,80%,70%)" opacity="${blush}"/>
<g opacity="${flaw}"><path d="M85 200 q6 4 2 12" stroke="hsl(${hue},35%,60%)" stroke-width="1.5" fill="none"/>
<path d="M215 200 q-6 4 -2 12" stroke="hsl(${hue},35%,60%)" stroke-width="1.5" fill="none"/>
<path d="M120 130 q30 -8 60 0" stroke="hsl(${hue},35%,62%)" stroke-width="1.5" fill="none"/></g>
<ellipse cx="150" cy="250" rx="${lipW}" ry="${lipH}" fill="hsl(${350 + lips * 8},${60 + lips * 25}%,${58 - lips * 8}%)"/>
<path d="M${150 - lipW} 250 Q150 ${244 - lipH} ${150 + lipW} 250" fill="hsl(${350 + lips * 8},${55 + lips * 25}%,${50 - lips * 6}%)"/>
</svg>`);
}

// Stylized treatment illustration: face silhouette + syringe, tinted per treatment
export function genTreatmentImg(hue) {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90">
<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue},55%,32%)"/><stop offset="1" stop-color="hsl(${(hue + 35) % 360},60%,18%)"/></linearGradient></defs>
<rect width="120" height="90" rx="6" fill="url(#t)"/>
<ellipse cx="46" cy="48" rx="26" ry="33" fill="hsl(28,50%,80%)"/>
<path d="M20 34 Q46 6 72 34 Q72 18 46 13 Q20 18 20 34" fill="hsl(${(hue + 340) % 360},35%,22%)"/>
<circle cx="37" cy="44" r="3.2" fill="hsl(215,55%,28%)"/><circle cx="55" cy="44" r="3.2" fill="hsl(215,55%,28%)"/>
<ellipse cx="46" cy="64" rx="9" ry="4" fill="hsl(352,65%,58%)"/>
<g transform="rotate(-32 92 44)">
<rect x="76" y="40" width="30" height="8" rx="2" fill="rgba(255,255,255,.9)"/>
<rect x="70" y="41.5" width="7" height="5" rx="1" fill="hsl(${hue},70%,60%)"/>
<rect x="104" y="42.5" width="12" height="3" rx="1.5" fill="rgba(255,255,255,.75)"/>
<rect x="78" y="41.5" width="16" height="5" fill="hsl(${hue},75%,55%)"/>
</g>
</svg>`);
}

export const DEFAULT_LOGO = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
<defs><radialGradient id="l" cx="30%" cy="30%"><stop offset="0" stop-color="#f0bd63"/><stop offset="1" stop-color="#c07f22"/></radialGradient></defs>
<circle cx="32" cy="32" r="30" fill="url(#l)"/>
<text x="32" y="44" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#0e2a52" text-anchor="middle">S</text>
</svg>`);

export function genProductBox(hue, dark = false) {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90">
<rect width="120" height="90" rx="6" fill="hsl(${hue},45%,${dark ? 28 : 88}%)"/>
<rect x="10" y="12" width="100" height="26" rx="4" fill="hsl(${hue},60%,${dark ? 45 : 55}%)"/>
<rect x="10" y="46" width="64" height="8" rx="3" fill="hsl(${hue},30%,${dark ? 60 : 40}%)"/>
<rect x="10" y="60" width="84" height="6" rx="3" fill="hsl(${hue},25%,${dark ? 65 : 50}%)"/>
<circle cx="100" cy="62" r="12" fill="hsl(${(hue + 180) % 360},55%,50%)"/>
</svg>`);
}

export function genSignature(seed = 1) {
  const p = [];
  let x = 12, y = 46;
  for (let i = 0; i < 9; i++) { x += 22 + ((seed * (i + 3)) % 9); y = 34 + (((seed + 2) * (i + 1) * 13) % 26); p.push(`${x} ${y}`); }
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80">
<path d="M12 46 C ${p.join(', ')}" stroke="hsl(220,60%,35%)" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`);
}

// ---- static catalogs (bilingual values are ['English', 'עברית']) ----
// `products` on a procedure = the default product set + amounts pulled in when
// the procedure is added to a visit. Units: ml | cc | units | n.
export const PROCEDURES = [
  { id: 1, name: ['Lip Filler', 'מילוי שפתיים'], cost: 1200, duration: 45, visitsCount: 1, longevity: ['6–9 months', '6–9 חודשים'], img: genTreatmentImg(320), products: [{ productId: 1, amount: 1, unit: 'ml' }, { productId: 7, amount: 2, unit: 'n' }], alerts: [['Not suitable during pregnancy', 'לא מתאים בהריון']], notes: [['Ask about cold sores history', 'לשאול על היסטוריית הרפס']] },
  { id: 2, name: ['Full Face Botox', 'בוטוקס פנים מלא'], cost: 1800, duration: 60, visitsCount: 1, longevity: ['3–4 months', '3–4 חודשים'], img: genTreatmentImg(205), products: [{ productId: 2, amount: 50, unit: 'units' }, { productId: 7, amount: 1, unit: 'n' }], alerts: [['Not for patients on blood thinners', 'לא למטופלים הנוטלים מדללי דם']], notes: [[' ', ' ']] },
  { id: 3, name: ['Forehead Botox', 'בוטוקס מצח'], cost: 900, duration: 30, visitsCount: 1, longevity: ['3–4 months', '3–4 חודשים'], img: genTreatmentImg(180), products: [{ productId: 4, amount: 30, unit: 'units' }], alerts: [], notes: [[' ', ' ']] },
  { id: 4, name: ['Cheek Filler', 'מילוי לחיים'], cost: 1500, duration: 45, visitsCount: 1, longevity: ['9–12 months', '9–12 חודשים'], img: genTreatmentImg(285), products: [{ productId: 1, amount: 2, unit: 'ml' }], alerts: [], notes: [[' ', ' ']] },
  { id: 5, name: ['Permanent Makeup — Lips', 'איפור קבוע — שפתיים'], cost: 1400, duration: 90, visitsCount: 2, longevity: ['1–2 years', '1–2 שנים'], img: genTreatmentImg(345), products: [{ productId: 5, amount: 3, unit: 'cc' }, { productId: 7, amount: 2, unit: 'n' }], alerts: [['Patch test required 48h before', 'נדרש תבחין רגישות 48 שעות מראש']], notes: [[' ', ' ']] },
  { id: 6, name: ['Permanent Makeup — Eyebrows', 'איפור קבוע — גבות'], cost: 1100, duration: 75, visitsCount: 2, longevity: ['1–2 years', '1–2 שנים'], img: genTreatmentImg(35), products: [{ productId: 5, amount: 2, unit: 'cc' }, { productId: 7, amount: 1, unit: 'n' }], alerts: [], notes: [[' ', ' ']] },
  { id: 7, name: ['Jawline Contour', 'עיצוב קו לסת'], cost: 2200, duration: 60, visitsCount: 1, longevity: ['9–12 months', '9–12 חודשים'], img: genTreatmentImg(255), products: [{ productId: 1, amount: 4, unit: 'ml' }], alerts: [], notes: [['Premium treatment — offer payment plan', 'טיפול פרימיום — להציע פריסת תשלומים']] },
  { id: 8, name: ['Skin Booster', 'סקין בוסטר'], cost: 950, duration: 40, visitsCount: 3, longevity: ['4–6 months', '4–6 חודשים'], img: genTreatmentImg(95), products: [{ productId: 6, amount: 2, unit: 'ml' }], alerts: [], notes: [[' ', ' ']] },
];

export const PRODUCTS = [
  { id: 1, name: ['Juvederm Ultra XC', 'ג\'ובידרם אולטרה XC'], company: ['Allergan', 'אלרגן'], commonUse: ['Lip & cheek filler', 'מילוי שפתיים ולחיים'], packaging: ['2 × 1ml syringes', '2 מזרקים × 1 מ"ל'], notes: ['Keep refrigerated', 'לשמור בקירור'], alerts: [['Contains lidocaine', 'מכיל לידוקאין']], img: genProductBox(275) },
  { id: 2, name: ['Botox 100U', 'בוטוקס 100 יחידות'], company: ['Allergan', 'אלרגן'], commonUse: ['Wrinkle relaxation', 'הרפיית קמטים'], packaging: ['100U vial', 'בקבוקון 100 יח\''], notes: ['Reconstitute before use', 'להמסה לפני שימוש'], alerts: [['Cold chain — 2-8°C', 'שרשרת קור — 2-8°C']], img: genProductBox(200) },
  { id: 3, name: ['Restylane Kysse', 'רסטילן קיס'], company: ['Galderma', 'גלדרמה'], commonUse: ['Lip augmentation', 'העשרת שפתיים'], packaging: ['1 × 1ml syringe', 'מזרק 1 מ"ל'], notes: [' ', ' '], alerts: [], img: genProductBox(340) },
  { id: 4, name: ['Dysport 300U', 'דיספורט 300 יחידות'], company: ['Ipsen', 'איפסן'], commonUse: ['Forehead lines', 'קמטי מצח'], packaging: ['300U vial', 'בקבוקון 300 יח\''], notes: ['Order 2 weeks ahead', 'להזמין שבועיים מראש'], alerts: [], img: genProductBox(150) },
  { id: 5, name: ['PMU Pigment Set', 'סט פיגמנטים לאיפור קבוע'], company: ['Perma Blend', 'פרמה בלנד'], commonUse: ['Permanent makeup', 'איפור קבוע'], packaging: ['6 × 15ml bottles', '6 בקבוקים × 15 מ"ל'], notes: [' ', ' '], alerts: [['Patch test required', 'נדרש תבחין רגישות']], img: genProductBox(25) },
  { id: 6, name: ['Profhilo', 'פרופהילו'], company: ['IBSA', 'איבסה'], commonUse: ['Skin boosting', 'חיזוק עור'], packaging: ['1 × 2ml syringe', 'מזרק 2 מ"ל'], notes: ['High demand', 'ביקוש גבוה'], alerts: [], img: genProductBox(90) },
  { id: 7, name: ['Numbing Cream', 'משחת הרדמה'], company: ['TKTX', 'TKTX'], commonUse: ['Topical anesthesia', 'הרדמה מקומית'], packaging: ['10g tube', 'שפופרת 10 גרם'], notes: [' ', ' '], alerts: [], img: genProductBox(120, true) },
];

export const UNITS = ['ml', 'cc', 'units', 'n'];

const T = today();
const bg = (n) => addDays(T, -n); // n days ago
const fw = (n) => addDays(T, n);  // n days forward

export const USERS = [
  { id: 1, natId: '032456789', first: ['Noa', 'נועה'], last: ['Levi', 'לוי'], birth: '1992-03-14', phone: '052-8113344', email: 'noa.levi@gmail.com', address: ['12 Dizengoff St., Tel Aviv', 'דיזנגוף 12, תל אביב'], wallet: 240, memberSince: ymd(addMonths(T, -26)), photo: genAvatar('NL', 210), referredBy: null, social: { instagram: true, facebook: true, tiktok: false, whatsapp: true }, alerts: [['Allergic to lidocaine', 'אלרגיה ללידוקאין']], notes: [['Prefers morning appointments. Interested in PMU.', 'מעדיפה תורים בבוקר. מתעניינת באיפור קבוע.']] },
  { id: 2, natId: '045612378', first: ['Yael', 'יעל'], last: ['Cohen', 'כהן'], birth: '1987-11-02', phone: '054-9022311', email: 'yael.cohen@walla.co.il', address: ['8 Rothschild Blvd., Tel Aviv', 'רוטשילד 8, תל אביב'], wallet: 80, memberSince: ymd(addMonths(T, -14)), photo: genAvatar('YC', 30), referredBy: 1, social: { instagram: true, facebook: false, tiktok: true, whatsapp: true }, alerts: [], notes: [['Sensitive skin — use extra numbing.', 'עור רגיש — להשתמש בהרדמה נוספת.']] },
  { id: 3, natId: '028974561', first: ['Maya', 'מאיה'], last: ['Mizrahi', 'מזרחי'], birth: '1995-07-21', phone: '050-7233458', email: 'maya.miz@gmail.com', address: ['3 Herzl St., Ramat Gan', 'הרצל 3, רמת גן'], wallet: 460, memberSince: ymd(addMonths(T, -38)), photo: genAvatar('MM', 320), referredBy: null, social: { instagram: true, facebook: true, tiktok: true, whatsapp: true }, alerts: [['Pregnant — verify before any injection', 'בהריון — לוודא לפני כל הזרקה']], notes: [['VIP — top spender, always offer new treatments.', 'VIP — מוציאה הכי הרבה, תמיד להציע טיפולים חדשים.']] },
  { id: 4, natId: '051239876', first: ['Daniel', 'דניאל'], last: ['Avraham', 'אברהם'], birth: '1983-01-30', phone: '053-6118822', email: 'dani.av@outlook.com', address: ['22 Weizmann St., Kfar Saba', 'ויצמן 22, כפר סבא'], wallet: 0, memberSince: ymd(addMonths(T, -8)), photo: genAvatar('DA', 130), referredBy: null, social: { instagram: false, facebook: true, tiktok: false, whatsapp: true }, alerts: [['Diabetic', 'סוכרתי']], notes: [] },
  { id: 5, natId: '039871234', first: ['Shira', 'שירה'], last: ['Peretz', 'פרץ'], birth: '1990-09-09', phone: '058-4455667', email: 'shirap@gmail.com', address: ['5 Ben Gurion Ave., Herzliya', 'בן גוריון 5, הרצליה'], wallet: 120, memberSince: ymd(addMonths(T, -20)), photo: genAvatar('SP', 275), referredBy: 3, social: { instagram: true, facebook: false, tiktok: false, whatsapp: true }, alerts: [], notes: [['Asked about jawline contour pricing.', 'שאלה לגבי מחיר עיצוב קו לסת.']] },
  { id: 6, natId: '047765123', first: ['Tamar', 'תמר'], last: ['Friedman', 'פרידמן'], birth: '1998-05-17', phone: '052-3300119', email: 'tamarf@gmail.com', address: ['19 Sokolov St., Holon', 'סוקולוב 19, חולון'], wallet: 50, memberSince: ymd(addMonths(T, -5)), photo: genAvatar('TF', 60), referredBy: 1, social: { instagram: true, facebook: false, tiktok: true, whatsapp: false }, alerts: [['Unpleasant patient — handle with care', 'מטופלת לא נעימה — לטפל בזהירות']], notes: [['Complained about waiting time twice.', 'התלוננה פעמיים על זמן ההמתנה.']] },
  { id: 7, natId: '036654987', first: ['Lior', 'ליאור'], last: ['Biton', 'ביטון'], birth: '1985-12-25', phone: '054-7788990', email: 'lior.biton@gmail.com', address: ['31 Jabotinsky St., Petah Tikva', 'ז\'בוטינסקי 31, פתח תקווה'], wallet: 300, memberSince: ymd(addMonths(T, -32)), photo: genAvatar('LB', 175), referredBy: 3, social: { instagram: false, facebook: false, tiktok: false, whatsapp: true }, alerts: [], notes: [] },
  { id: 8, natId: '042198765', first: ['Rotem', 'רותם'], last: ['Azulay', 'אזולאי'], birth: '2000-02-11', phone: '050-1122334', email: 'rotem.az@gmail.com', address: ['7 HaNasi St., Rishon LeZion', 'הנשיא 7, ראשון לציון'], wallet: 15, memberSince: ymd(addMonths(T, -2)), photo: genAvatar('RA', 300), referredBy: null, social: { instagram: true, facebook: true, tiktok: false, whatsapp: false }, alerts: [], notes: [] },
];

// visits: date (ymd), start/end minutes-from-midnight, status: scheduled|active|done
const mkPhotos = (v) => ({
  before: [genFace({ hue: 25, lips: 0.25, flaw: 0.8, variant: v }), genFace({ hue: 28, lips: 0.3, flaw: 0.7, variant: v + 1 }), genFace({ hue: 22, lips: 0.28, flaw: 0.75, variant: v + 2 })],
  after: [genFace({ hue: 25, lips: 0.85, flaw: 0.15, blush: 0.3, variant: v }), genFace({ hue: 28, lips: 0.8, flaw: 0.1, blush: 0.25, variant: v + 1 }), genFace({ hue: 22, lips: 0.9, flaw: 0.12, blush: 0.3, variant: v + 2 })],
});

export const VISITS = [
  // history
  { id: 1, userId: 1, date: ymd(bg(190)), start: 9 * 60, end: 9 * 60 + 45, status: 'done', photos: mkPhotos(1), signed: true },
  { id: 2, userId: 1, date: ymd(bg(60)), start: 10 * 60, end: 10 * 60 + 45, status: 'done', photos: mkPhotos(2), signed: true },
  { id: 3, userId: 2, date: ymd(bg(120)), start: 11 * 60, end: 12 * 60, status: 'done', photos: mkPhotos(3), signed: true },
  { id: 4, userId: 3, date: ymd(bg(300)), start: 9 * 60, end: 10 * 60 + 30, status: 'done', photos: mkPhotos(4), signed: true },
  { id: 5, userId: 3, date: ymd(bg(150)), start: 13 * 60 + 30, end: 15 * 60, status: 'done', photos: mkPhotos(5), signed: true },
  { id: 6, userId: 3, date: ymd(bg(45)), start: 16 * 60, end: 17 * 60, status: 'done', photos: mkPhotos(6), signed: true },
  { id: 7, userId: 4, date: ymd(bg(90)), start: 8 * 60 + 30, end: 9 * 60, status: 'done', photos: mkPhotos(7), signed: true },
  { id: 8, userId: 5, date: ymd(bg(200)), start: 12 * 60, end: 13 * 60, status: 'done', photos: mkPhotos(8), signed: true },
  { id: 9, userId: 6, date: ymd(bg(30)), start: 15 * 60, end: 16 * 60 + 15, status: 'done', photos: mkPhotos(9), signed: true },
  { id: 10, userId: 7, date: ymd(bg(400)), start: 9 * 60, end: 10 * 60, status: 'done', photos: mkPhotos(10), signed: true },
  { id: 11, userId: 7, date: ymd(bg(25)), start: 10 * 60, end: 11 * 60, status: 'done', photos: mkPhotos(11), signed: true },
  { id: 12, userId: 8, date: ymd(bg(10)), start: 14 * 60, end: 14 * 60 + 40, status: 'done', photos: mkPhotos(12), signed: true },
  // today
  { id: 13, userId: 1, date: ymd(T), start: 8 * 60 + 30, end: 9 * 60 + 15, status: 'done', photos: mkPhotos(13), signed: true },
  { id: 14, userId: 2, date: ymd(T), start: 9 * 60 + 30, end: 10 * 60 + 15, status: 'active', photos: mkPhotos(14), signed: true },
  { id: 15, userId: 3, date: ymd(T), start: 10 * 60 + 30, end: 11 * 60, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
  { id: 16, userId: 4, date: ymd(T), start: 13 * 60 + 30, end: 14 * 60 + 15, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
  { id: 17, userId: 6, date: ymd(T), start: 14 * 60 + 30, end: 15 * 60 + 30, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
  { id: 18, userId: 5, date: ymd(T), start: 18 * 60, end: 19 * 60, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
  // future
  { id: 19, userId: 7, date: ymd(fw(3)), start: 9 * 60, end: 10 * 60, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
  { id: 20, userId: 8, date: ymd(fw(6)), start: 11 * 60, end: 11 * 60 + 45, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
  { id: 21, userId: 1, date: ymd(fw(14)), start: 10 * 60, end: 10 * 60 + 45, status: 'scheduled', photos: { before: [], after: [] }, signed: false },
];

// treatments: procedure done in a visit
export const TREATMENTS = [
  { id: 1, procId: 1, userId: 1, visitId: 1, cost: 1200 },
  { id: 2, procId: 3, userId: 1, visitId: 2, cost: 900 },
  { id: 3, procId: 2, userId: 2, visitId: 3, cost: 1800 },
  { id: 4, procId: 5, userId: 3, visitId: 4, cost: 1400 },
  { id: 5, procId: 4, userId: 3, visitId: 5, cost: 1500 },
  { id: 6, procId: 8, userId: 3, visitId: 5, cost: 950 },
  { id: 7, procId: 7, userId: 3, visitId: 6, cost: 2200 },
  { id: 8, procId: 3, userId: 4, visitId: 7, cost: 900 },
  { id: 9, procId: 2, userId: 5, visitId: 8, cost: 1800 },
  { id: 10, procId: 6, userId: 6, visitId: 9, cost: 1100 },
  { id: 11, procId: 1, userId: 7, visitId: 10, cost: 1200 },
  { id: 12, procId: 8, userId: 7, visitId: 11, cost: 950 },
  { id: 13, procId: 3, userId: 8, visitId: 12, cost: 900 },
  // today
  { id: 14, procId: 1, userId: 1, visitId: 13, cost: 1200 },
  { id: 15, procId: 2, userId: 2, visitId: 14, cost: 1800 },
  { id: 16, procId: 5, userId: 3, visitId: 15, cost: 1400 },
  { id: 17, procId: 3, userId: 4, visitId: 16, cost: 900 },
  { id: 18, procId: 6, userId: 6, visitId: 17, cost: 1100 },
  { id: 19, procId: 2, userId: 5, visitId: 18, cost: 1800 },
  // future
  { id: 20, procId: 8, userId: 7, visitId: 19, cost: 950 },
  { id: 21, procId: 1, userId: 8, visitId: 20, cost: 1200 },
  { id: 22, procId: 1, userId: 1, visitId: 21, cost: 1200 },
];

// products used per treatment — seeded from each procedure's default product set
let _tpId = 0;
export const TREAT_PRODS = TREATMENTS.flatMap((tr) => {
  const proc = PROCEDURES.find((p) => p.id === tr.procId);
  return (proc?.products || []).map((pp) => ({ id: ++_tpId, treatmentId: tr.id, productId: pp.productId, amount: pp.amount, unit: pp.unit }));
});

// payments — spread across months so finance stats & chart have life
export const PAYMENTS = [
  { id: 1, treatmentId: 1, date: ymd(bg(190)), type: 'credit', amount: 1200, status: 'paid' },
  { id: 2, treatmentId: 2, date: ymd(bg(60)), type: 'bit', amount: 900, status: 'paid' },
  { id: 3, treatmentId: 3, date: ymd(bg(120)), type: 'cash', amount: 1000, status: 'paid' },
  { id: 4, treatmentId: 4, date: ymd(bg(300)), type: 'credit', amount: 1400, status: 'paid' },
  { id: 5, treatmentId: 5, date: ymd(bg(150)), type: 'credit', amount: 1500, status: 'paid' },
  { id: 6, treatmentId: 6, date: ymd(bg(150)), type: 'wallet', amount: 950, status: 'paid' },
  { id: 7, treatmentId: 7, date: ymd(bg(45)), type: 'bank', amount: 2200, status: 'paid' },
  { id: 8, treatmentId: 8, date: ymd(bg(90)), type: 'paybox', amount: 900, status: 'paid' },
  { id: 9, treatmentId: 9, date: ymd(bg(200)), type: 'credit', amount: 1800, status: 'paid' },
  { id: 10, treatmentId: 10, date: ymd(bg(30)), type: 'cash', amount: 500, status: 'paid' },
  { id: 11, treatmentId: 11, date: ymd(bg(400)), type: 'credit', amount: 1200, status: 'paid' },
  { id: 12, treatmentId: 12, date: ymd(bg(25)), type: 'bit', amount: 950, status: 'paid' },
  { id: 13, treatmentId: 13, date: ymd(bg(10)), type: 'credit', amount: 900, status: 'paid' },
  { id: 14, treatmentId: 14, date: ymd(T), type: 'credit', amount: 1200, status: 'paid' },
  { id: 15, treatmentId: 15, date: ymd(T), type: 'cash', amount: 800, status: 'paid' },
];

// rewards definitions + granted rewards
export const REWARD_DEFS = [
  { id: 1, name: ['Birthday 15% off', '15% הנחת יום הולדת'], percent: 15, cash: 0, points: 0, condition: 'birthday', term: 'eq', value: '#CurrentMonth', restrictions: [] },
  { id: 2, name: ['Loyalty — 10 visits', 'נאמנות — 10 ביקורים'], percent: 0, cash: 200, points: 0, condition: 'visits', term: 'gt', value: '10', restrictions: [] },
  { id: 3, name: ['Referral bonus', 'בונוס הפניה'], percent: 0, cash: 0, points: 50, condition: 'referrals', term: 'gt', value: '0', restrictions: [] },
];

export const REWARDS = [
  { id: 1, userId: 1, defId: 1, desc: null, status: 'active', dateInit: ymd(bg(20)), dateEnd: ymd(fw(40)), restrictions: [1, 5], actual: null },
  { id: 2, userId: 3, defId: null, desc: ['Manual — 20% off next jawline', 'ידני — 20% הנחה על קו לסת הבא'], status: 'active', dateInit: ymd(bg(10)), dateEnd: ymd(fw(80)), restrictions: [7], actual: null },
  { id: 3, userId: 3, defId: 3, desc: null, status: 'used', dateInit: ymd(bg(160)), dateEnd: ymd(bg(40)), restrictions: [], actual: 50 },
  { id: 4, userId: 7, defId: 2, desc: null, status: 'expired', dateInit: ymd(bg(300)), dateEnd: ymd(bg(120)), restrictions: [], actual: null },
];

export const CAMPAIGNS = [
  { id: 1, name: ['Summer Lips', 'שפתיים של קיץ'], dateInit: ymd(bg(30)), dateEnd: ymd(fw(30)), percent: 20, raw: 0, code: 'SUMMER20', limits: ['Lip treatments only', 'טיפולי שפתיים בלבד'] },
  { id: 2, name: ['New Client Glow', 'זוהר ללקוחות חדשים'], dateInit: ymd(bg(90)), dateEnd: ymd(fw(90)), percent: 0, raw: 150, code: 'GLOW150', limits: ['First visit only', 'ביקור ראשון בלבד'] },
];

export const INVENTORY = PRODUCTS.map((p, i) => ({ id: p.id, productId: p.id, count: [8, 3, 12, 2, 6, 9, 15][i] ?? 5 }));

export const ORDERS = [
  { id: 1, productId: 2, date: ymd(bg(12)), seller: ['MedSupply IL', 'מדסאפליי ישראל'], batch: 10, cost: 8500, notes: ['Arrives Sunday', 'מגיע ביום ראשון'] },
  { id: 2, productId: 1, date: ymd(bg(40)), seller: ['DermaTrade', 'דרמה טרייד'], batch: 20, cost: 12400, notes: [' ', ' '] },
  { id: 3, productId: 6, date: ymd(bg(70)), seller: ['IBSA Direct', 'איבסה ישיר'], batch: 6, cost: 5100, notes: ['Back-ordered', 'בהזמנה חוזרת'] },
  { id: 4, productId: 5, date: ymd(bg(100)), seller: ['PMU Store', 'חנות PMU'], batch: 3, cost: 2700, notes: [' ', ' '] },
];

// Form blocks: `alert: true` on a toggle question means answering YES raises a
// medical alert on the signing patient; on an option it means choosing it does.
export const FORMS = [
  {
    id: 1, name: ['Botox Informed Consent', 'הסכמה מדעת — בוטוקס'], created: ymd(bg(200)),
    blocks: [
      { id: 1, type: 'rich', html: ['<b>Botox Injection — Informed Consent.</b><br/>I understand the nature of the treatment, its expected results and possible side effects, including temporary bruising, swelling and asymmetry.', '<b>הזרקת בוטוקס — הסכמה מדעת.</b><br/>אני מבין/ה את מהות הטיפול, תוצאותיו הצפויות ותופעות הלוואי האפשריות, כולל שטפי דם זמניים, נפיחות וא-סימטריה.'] },
      { id: 2, type: 'toggle', q: ['Have you received Botox in the past 3 months?', 'האם קיבלת בוטוקס ב-3 החודשים האחרונים?'], alert: false },
      { id: 3, type: 'toggle', q: ['Are you pregnant or breastfeeding?', 'האם את בהריון או מניקה?'], alert: true },
      { id: 4, type: 'options', q: ['How did you hear about us?', 'איך שמעת עלינו?'], options: [{ text: ['Instagram', 'אינסטגרם'], alert: false }, { text: ['A friend', 'חבר/ה'], alert: false }, { text: ['Google', 'גוגל'], alert: false }] },
      { id: 5, type: 'signature' },
    ],
  },
  {
    id: 2, name: ['Health Declaration', 'הצהרת בריאות'], created: ymd(bg(180)),
    blocks: [
      { id: 1, type: 'rich', html: ['<b>Health Declaration.</b><br/>I hereby declare that the details I provided about my medical condition are complete and truthful.', '<b>הצהרת בריאות.</b><br/>אני מצהיר/ה בזאת כי הפרטים שמסרתי על מצבי הרפואי מלאים ונכונים.'] },
      { id: 2, type: 'toggle', q: ['Do you suffer from any chronic illness?', 'האם את/ה סובל/ת ממחלה כרונית?'], alert: true },
      { id: 3, type: 'toggle', q: ['Are you taking blood thinners?', 'האם את/ה נוטל/ת מדללי דם?'], alert: true },
      { id: 4, type: 'options', q: ['Known allergies', 'אלרגיות ידועות'], options: [{ text: ['Lidocaine', 'לידוקאין'], alert: true }, { text: ['Latex', 'לטקס'], alert: true }, { text: ['None', 'ללא'], alert: false }] },
      { id: 5, type: 'signature' },
    ],
  },
];

// Admin-defined alert / notification rules
export const ALERT_RULES = [
  { id: 1, kind: 'medical', text: ['Diabetes mellitus', 'סוכרת'], productId: null, threshold: null, active: true, fromForms: true },
  { id: 2, kind: 'medical', text: ['Pregnancy — no injections', 'הריון — ללא הזרקות'], productId: null, threshold: null, active: true, fromForms: true },
  { id: 3, kind: 'inventory', text: [' ', ' '], productId: 4, threshold: 3, active: true, fromForms: false },
  { id: 4, kind: 'inventory', text: [' ', ' '], productId: 2, threshold: 5, active: true, fromForms: false },
  { id: 5, kind: 'custom', text: ['Unpleasant patient — handle with care', 'מטופל/ת לא נעים/ה — לטפל בזהירות'], productId: null, threshold: null, active: false, fromForms: false },
];

export const MESSAGES = [
  { id: 1, kind: 'system', title: ['Low stock: Dysport 300U', 'מלאי נמוך: דיספורט 300'], body: ['Only 2 vials left on the shelf. Consider placing an order.', 'נותרו רק 2 בקבוקונים במדף. מומלץ לבצע הזמנה.'], date: ymd(bg(1)), read: false },
  { id: 2, kind: 'system', title: ['Payment received', 'התקבל תשלום'], body: ['Yael Cohen paid 800 ₪ in cash for Full Face Botox.', 'יעל כהן שילמה 800 ₪ במזומן עבור בוטוקס פנים מלא.'], date: ymd(T), read: false },
  { id: 3, kind: 'admin', title: ['Order more numbing cream', 'להזמין עוד משחת הרדמה'], body: ['We are running low before the weekend rush.', 'המלאי אוזל לפני העומס של סוף השבוע.'], date: ymd(bg(2)), read: true },
  { id: 4, kind: 'system', title: ['Birthday soon: Maya Mizrahi', 'יום הולדת מתקרב: מאיה מזרחי'], body: ['Her birthday month starts soon — the birthday reward can apply.', 'חודש יום ההולדת שלה מתחיל בקרוב — ניתן להחיל את הטבת יום ההולדת.'], date: ymd(bg(3)), read: true },
];

export const NOTES = [
  { id: 1, text: ['Order new LED lamp for treatment room 2', 'להזמין מנורת LED חדשה לחדר טיפולים 2'], date: ymd(bg(1)) },
  { id: 2, text: ['Call the accountant about Q3 report', 'להתקשר לרואה החשבון לגבי דוח רבעון 3'], date: ymd(bg(2)) },
  { id: 3, text: ['Sterilization certificates renewal next month', 'חידוש אישורי עיקור בחודש הבא'], date: ymd(bg(4)) },
];

// Google-calendar mock: the "Clinic Open" event title drives the day-schedule working hours
export const GCAL_EVENTS = [];
for (let d = -30; d <= 30; d++) {
  const day = addDays(T, d);
  if (day.getDay() !== 6) GCAL_EVENTS.push({ id: `open-${d}`, title: 'Clinic Open 8-12, 13-16, 18-20', date: ymd(day), open: true });
}

export function parseOpenRanges(title) {
  const m = [...title.matchAll(/(\d{1,2})\s*-\s*(\d{1,2})/g)];
  return m.map((x) => [parseInt(x[1], 10) * 60, parseInt(x[2], 10) * 60]).filter(([a, b]) => b > a);
}

export const ADMIN = { username: 'shlomi', password: 'clinic123' };
