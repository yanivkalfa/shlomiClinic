import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import * as D from './data.js';

const StoreCtx = createContext(null);

export const PRESETS = {
  p1: { c1: '#0e2a52', c2: '#e8a33d', c3: '#0a1830', dark: true },   // deep blue + orange-gold (default)
  p2: { c1: '#1d4ed8', c2: '#d97706', c3: '#f4f6fb', dark: false },  // bright
  p3: { c1: '#111827', c2: '#8b9dc3', c3: '#05070d', dark: true },   // midnight
  p4: { c1: '#7c2d5c', c2: '#e0a458', c3: '#2a0f22', dark: true },   // rose glow
  p5: { c1: '#065f46', c2: '#c9a227', c3: '#f0f7f4', dark: false },  // emerald bright
};

let nextId = 1000;
export const genId = () => ++nextId;

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null); // {name}
  const [nav, setNav] = useState({ page: 'home', params: {} });
  const [navStack, setNavStack] = useState([]);
  const [popups, setPopups] = useState([]); // stack of {id, type, props}
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    // identity
    clinicName: '', clinicLogo: null,
    // theme
    preset: 'p1', custom: { c1: '#0e2a52', c2: '#e8a33d', c3: '#0a1830' }, useCustom: false,
    corners: 60, fontLevel: 3, shadows: true, borders: true,
    // calendar
    calendar: 'google', googleId: 'clinic@group.calendar.google.com', googleKey: '',
    // right panel blocks
    rp: { quick: true, calendar: true, pulse: true, today: true },
    // home page
    showWelcome: true, homeApptView: 'schedule',
    apptFields: { payStatus: true, lastVisit: true, lastTreatments: true, visitsSpend: true, notes: true, alerts: true },
    // optional lines
    optMemberLine: true, optVisitSummary: true,
  });

  const [users, setUsers] = useState(D.USERS);
  const [visits, setVisits] = useState(D.VISITS);
  const [procedures, setProcedures] = useState(D.PROCEDURES);
  const [treatments, setTreatments] = useState(D.TREATMENTS);
  const [treatProds, setTreatProds] = useState(D.TREAT_PRODS);
  const [payments, setPayments] = useState(D.PAYMENTS);
  const [rewards, setRewards] = useState(D.REWARDS);
  const [rewardDefs] = useState(D.REWARD_DEFS);
  const [campaigns, setCampaigns] = useState(D.CAMPAIGNS);
  const [products, setProducts] = useState(D.PRODUCTS);
  const [inventory, setInventory] = useState(D.INVENTORY);
  const [orders, setOrders] = useState(D.ORDERS);
  const [forms, setForms] = useState(D.FORMS);
  const [messages, setMessages] = useState(D.MESSAGES);
  const [notes, setNotes] = useState(D.NOTES);
  const [alertRules, setAlertRules] = useState(D.ALERT_RULES);

  // ---- navigation (with a back stack for the Back buttons) ----
  const navigate = useCallback((page, params = {}) => {
    setNav((cur) => { setNavStack((s) => [...s, cur]); return { page, params }; });
  }, []);
  const goBack = useCallback(() => {
    setNavStack((s) => {
      if (s.length === 0) { setNav({ page: 'home', params: {} }); return s; }
      setNav(s[s.length - 1]);
      return s.slice(0, -1);
    });
  }, []);
  const canGoBack = navStack.length > 0;

  const openPopup = useCallback((type, props = {}) => setPopups((p) => [...p, { id: genId(), type, props }]), []);
  const closePopup = useCallback((id) => setPopups((p) => (id ? p.filter((x) => x.id !== id) : p.slice(0, -1))), []);
  const showToast = useCallback((text) => { setToast({ id: genId(), text }); setTimeout(() => setToast(null), 2600); }, []);

  // ---- derived helpers ----
  const userById = useCallback((id) => users.find((u) => u.id === id), [users]);
  const visitById = useCallback((id) => visits.find((v) => v.id === id), [visits]);
  const procById = useCallback((id) => procedures.find((p) => p.id === id), [procedures]);
  const productById = useCallback((id) => products.find((p) => p.id === id), [products]);
  const treatmentById = useCallback((id) => treatments.find((t) => t.id === id), [treatments]);

  const treatmentsOfVisit = useCallback((visitId) => treatments.filter((t) => t.visitId === visitId), [treatments]);
  const prodsOfTreatment = useCallback((tid) => treatProds.filter((tp) => tp.treatmentId === tid), [treatProds]);
  const paymentsOfTreatment = useCallback((tid) => payments.filter((p) => p.treatmentId === tid && p.status === 'paid'), [payments]);
  const paidOfTreatment = useCallback((tid) => paymentsOfTreatment(tid).reduce((s, p) => s + p.amount, 0), [paymentsOfTreatment]);
  const leftOfTreatment = useCallback((t) => Math.max(0, t.cost - paidOfTreatment(t.id)), [paidOfTreatment]);
  const statusOfTreatment = useCallback((t) => { const paid = paidOfTreatment(t.id); return paid >= t.cost ? 'paid' : paid > 0 ? 'partial' : 'pending'; }, [paidOfTreatment]);

  const visitTotal = useCallback((visitId) => treatmentsOfVisit(visitId).reduce((s, t) => s + t.cost, 0), [treatmentsOfVisit]);
  const visitPaid = useCallback((visitId) => treatmentsOfVisit(visitId).reduce((s, t) => s + paidOfTreatment(t.id), 0), [treatmentsOfVisit, paidOfTreatment]);
  const visitPayStatus = useCallback((visitId) => { const tot = visitTotal(visitId), paid = visitPaid(visitId); return paid >= tot && tot > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending'; }, [visitTotal, visitPaid]);

  const visitsOfUser = useCallback((userId) => visits.filter((v) => v.userId === userId).sort((a, b) => b.date.localeCompare(a.date)), [visits]);
  const doneVisitsOfUser = useCallback((userId) => visitsOfUser(userId).filter((v) => v.status === 'done'), [visitsOfUser]);
  const userTotalSpent = useCallback((userId) => treatments.filter((t) => t.userId === userId).reduce((s, t) => s + paidOfTreatment(t.id), 0), [treatments, paidOfTreatment]);
  const userLastVisit = useCallback((userId) => doneVisitsOfUser(userId)[0] || null, [doneVisitsOfUser]);
  const userNextVisit = useCallback((userId) => visitsOfUser(userId).filter((v) => v.status === 'scheduled' && v.date >= D.ymd(D.today())).sort((a, b) => a.date.localeCompare(b.date))[0] || null, [visitsOfUser]);
  const pendingTreatmentsOfUser = useCallback((userId) => treatments.filter((t) => t.userId === userId && statusOfTreatment(t) !== 'paid' && (visitById(t.visitId)?.date <= D.ymd(D.today()))), [treatments, statusOfTreatment, visitById]);
  const userPendingSum = useCallback((userId) => pendingTreatmentsOfUser(userId).reduce((s, t) => s + leftOfTreatment(t), 0), [pendingTreatmentsOfUser, leftOfTreatment]);
  const referralsOfUser = useCallback((userId) => users.filter((u) => u.referredBy === userId), [users]);

  const todayVisits = useMemo(() => visits.filter((v) => v.date === D.ymd(D.today())).sort((a, b) => a.start - b.start), [visits]);
  const countOfProduct = useCallback((pid) => inventory.find((i) => i.productId === pid)?.count ?? 0, [inventory]);

  // inventory alert rules that are currently tripped
  const trippedInventoryAlerts = useMemo(() => alertRules.filter((r) => r.kind === 'inventory' && r.active && countOfProduct(r.productId) < r.threshold), [alertRules, countOfProduct]);

  // ---- mutations ----
  const updateUser = useCallback((id, patch) => setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u))), []);
  const addUser = useCallback((u) => { const id = genId(); setUsers((us) => [...us, { ...u, id }]); return id; }, []);
  const updateVisit = useCallback((id, patch) => setVisits((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v))), []);
  const addVisitPhoto = useCallback((visitId, side, img) => setVisits((vs) => vs.map((v) => (v.id === visitId ? { ...v, photos: { ...v.photos, [side]: [...v.photos[side], img] } } : v))), []);

  // treatment plan editing
  const addTreatment = useCallback((visitId, userId, procId) => {
    const proc = D.PROCEDURES.concat(procedures).find((p) => p.id === procId);
    const id = genId();
    setTreatments((ts) => [...ts, { id, procId, userId, visitId, cost: proc?.cost ?? 0 }]);
    if (proc?.products?.length) {
      setTreatProds((tps) => [...tps, ...proc.products.map((pp) => ({ id: genId(), treatmentId: id, productId: pp.productId, amount: pp.amount, unit: pp.unit }))]);
    }
    return id;
  }, [procedures]);
  const updateTreatment = useCallback((id, patch) => setTreatments((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))), []);
  const removeTreatment = useCallback((id) => {
    setTreatments((ts) => ts.filter((t) => t.id !== id));
    setTreatProds((tps) => tps.filter((tp) => tp.treatmentId !== id));
  }, []);
  const addTreatProd = useCallback((treatmentId, productId, amount, unit) => setTreatProds((tps) => [...tps, { id: genId(), treatmentId, productId, amount, unit }]), []);
  const updateTreatProd = useCallback((id, patch) => setTreatProds((tps) => tps.map((tp) => (tp.id === id ? { ...tp, ...patch } : tp))), []);
  const removeTreatProd = useCallback((id) => setTreatProds((tps) => tps.filter((tp) => tp.id !== id)), []);

  const addPayment = useCallback((p) => setPayments((ps) => [...ps, { ...p, id: genId() }]), []);
  const updatePayment = useCallback((id, patch) => setPayments((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);
  const addNote = useCallback((text) => setNotes((ns) => [{ id: genId(), text, date: D.ymd(D.now()) }, ...ns]), []);
  const markMsgRead = useCallback((id) => setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read: true } : m))), []);
  const addReward = useCallback((r) => setRewards((rs) => [...rs, { ...r, id: genId() }]), []);
  const addCampaign = useCallback((c) => setCampaigns((cs) => [...cs, { ...c, id: genId() }]), []);
  const updateCampaign = useCallback((id, patch) => setCampaigns((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))), []);

  const addProduct = useCallback((p, count) => { const id = genId(); setProducts((ps) => [...ps, { ...p, id }]); setInventory((inv) => [...inv, { id: genId(), productId: id, count }]); }, []);
  const updateProduct = useCallback((id, patch, count) => { setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))); if (count !== undefined) setInventory((inv) => inv.map((i) => (i.productId === id ? { ...i, count } : i))); }, []);
  const removeProduct = useCallback((id) => { setProducts((ps) => ps.filter((p) => p.id !== id)); setInventory((inv) => inv.filter((i) => i.productId !== id)); }, []);

  // procedures catalog (the "Treatments" page)
  const addProcedure = useCallback((p) => { const id = genId(); setProcedures((ps) => [...ps, { ...p, id }]); return id; }, []);
  const updateProcedure = useCallback((id, patch) => setProcedures((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);
  const removeProcedure = useCallback((id) => setProcedures((ps) => ps.filter((p) => p.id !== id)), []);

  const addOrder = useCallback((o) => setOrders((os) => [...os, { ...o, id: genId() }]), []);
  const updateOrder = useCallback((id, patch) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, ...patch } : o))), []);
  const removeOrder = useCallback((id) => setOrders((os) => os.filter((o) => o.id !== id)), []);
  const addForm = useCallback((f) => { const id = genId(); setForms((fs) => [...fs, { ...f, id, created: D.ymd(D.now()) }]); return id; }, []);
  const updateForm = useCallback((id, patch) => setForms((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f))), []);
  const removeForm = useCallback((id) => setForms((fs) => fs.filter((f) => f.id !== id)), []);

  const addAlertRule = useCallback((r) => setAlertRules((rs) => [...rs, { ...r, id: genId() }]), []);
  const updateAlertRule = useCallback((id, patch) => setAlertRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r))), []);
  const removeAlertRule = useCallback((id) => setAlertRules((rs) => rs.filter((r) => r.id !== id)), []);

  const value = {
    session, setSession, nav, navigate, goBack, canGoBack, popups, openPopup, closePopup, toast, showToast,
    settings, setSettings,
    users, visits, procedures, treatments, treatProds, payments, rewards, rewardDefs, campaigns, products, inventory, orders, forms, messages, notes, alertRules,
    userById, visitById, procById, productById, treatmentById, countOfProduct, trippedInventoryAlerts,
    treatmentsOfVisit, prodsOfTreatment, paymentsOfTreatment, paidOfTreatment, leftOfTreatment, statusOfTreatment,
    visitTotal, visitPaid, visitPayStatus, visitsOfUser, doneVisitsOfUser, userTotalSpent, userLastVisit, userNextVisit,
    pendingTreatmentsOfUser, userPendingSum, referralsOfUser, todayVisits,
    updateUser, addUser, updateVisit, addVisitPhoto,
    addTreatment, updateTreatment, removeTreatment, addTreatProd, updateTreatProd, removeTreatProd,
    addPayment, updatePayment, addNote, markMsgRead,
    addReward, addCampaign, updateCampaign,
    addProduct, updateProduct, removeProduct,
    addProcedure, updateProcedure, removeProcedure,
    addOrder, updateOrder, removeOrder,
    addForm, updateForm, removeForm,
    addAlertRule, updateAlertRule, removeAlertRule,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
