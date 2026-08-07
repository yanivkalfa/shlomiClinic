import React, { useEffect } from 'react';
import { useLang } from './i18n.jsx';
import { useStore, PRESETS } from './store.jsx';
import { TopBar, LeftPanel, RightPanel } from './components/layout.jsx';
import { PhotoPopup, QuickPaymentPopup, RewardPopup, AddUserPopup, NotePopup, EditNotesPopup, UserPickerPopup, LightboxPopup, ConsentDocsPopup } from './components/popups.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Messaging from './pages/Messaging.jsx';
import UsersManagement from './pages/UsersManagement.jsx';
import UserPage from './pages/UserPage.jsx';
import VisitPage from './pages/VisitPage.jsx';
import TreatmentInfo from './pages/TreatmentInfo.jsx';
import Finances from './pages/Finances.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import LegalForms from './pages/LegalForms.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = {
  home: Home, appointments: CalendarPage, messaging: Messaging, users: UsersManagement,
  user: UserPage, visit: VisitPage, treatment: TreatmentInfo,
  finances: Finances, inventory: Inventory, orders: Orders, legal: LegalForms, settings: Settings,
};

const POPUPS = {
  photo: PhotoPopup, quickPay: QuickPaymentPopup, reward: RewardPopup, addUser: AddUserPopup,
  note: NotePopup, editNotes: EditNotesPopup, userPicker: UserPickerPopup, lightbox: LightboxPopup, consent: ConsentDocsPopup,
};

const FONT_SIZES = [12.5, 13.8, 15, 16.3, 17.6];

const isDarkColor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
};

function ThemeSync() {
  const { lang, isRTL, t } = useLang();
  const { settings } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    const scheme = settings.useCustom ? settings.custom : PRESETS[settings.preset];
    const dark = settings.useCustom ? isDarkColor(settings.custom.c3) : PRESETS[settings.preset].dark;
    root.style.setProperty('--c1', scheme.c1);
    root.style.setProperty('--c2', scheme.c2);
    root.style.setProperty('--c3', scheme.c3);
    root.style.setProperty('--radius', `${(settings.corners / 100) * 26}px`);
    root.style.fontSize = `${FONT_SIZES[settings.fontLevel - 1]}px`;
    root.dataset.dark = dark ? '1' : '0';
    root.dataset.shadows = settings.shadows ? '1' : '0';
    root.dataset.borders = settings.borders ? '1' : '0';
  }, [settings]);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.title = t('app.name');
  }, [lang, isRTL, t]);

  return null;
}

export default function App() {
  const { session, nav, popups, closePopup, toast } = useStore();
  const Page = PAGES[nav.page] || Home;

  return (
    <>
      <ThemeSync />
      <div className="bg-anim" />
      {!session ? <Login /> : (
        <div className="app">
          <TopBar />
          <div className="frame">
            <LeftPanel />
            <div className="content"><Page /></div>
            <RightPanel />
          </div>
        </div>
      )}
      {popups.map((p) => {
        const C = POPUPS[p.type];
        return C ? <C key={p.id} close={() => closePopup(p.id)} {...p.props} /> : null;
      })}
      {toast && <div className="toast">{toast.text}</div>}
    </>
  );
}
