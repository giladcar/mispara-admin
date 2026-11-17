import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN3-QXjz-6u8ynxjN8END8kEKuxXBF43U",
  authDomain: "saparot-51229.firebaseapp.com",
  projectId: "saparot-51229",
  storageBucket: "saparot-51229.firebasestorage.app",
  messagingSenderId: "421595658226",
  appId: "1:421595658226:web:840b3f1c4920766bb51d6b"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

let allAppointments = [];
let servicesList = [];

function formatDateLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getAppointmentPrice(appItem) {
  if (typeof appItem.servicePrice === "number" && !Number.isNaN(appItem.servicePrice)) {
    return appItem.servicePrice;
  }
  if (appItem.servicePrice !== undefined && appItem.servicePrice !== null && appItem.servicePrice !== "") {
    const parsed = Number(appItem.servicePrice);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (appItem.serviceId) {
    const byId = servicesList.find((s) => s.id === appItem.serviceId);
    if (byId) return Number(byId.price) || 0;
  }
  if (appItem.serviceName) {
    const byName = servicesList.find((s) => s.name === appItem.serviceName);
    if (byName) return Number(byName.price) || 0;
  }
  return 0;
}

function mountStatsBoard() {
  const appointmentsTab = document.getElementById("appointmentsTab");
  if (!appointmentsTab || document.getElementById("revenueStatsBoard")) return;

  const board = document.createElement("div");
  board.id = "revenueStatsBoard";
  board.className = "grid grid-cols-1 sm:grid-cols-3 gap-3";
  board.innerHTML = `
    <div class="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
      <div>
        <span class="text-xs font-bold text-emerald-400">היום</span>
        <div id="statTodayRev" class="text-2xl font-black text-white mt-0.5">₪0</div>
        <div id="statTodayCount" class="text-[11px] text-zinc-400 mt-0.5">0 תורים</div>
      </div>
      <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl">
        💵
      </div>
    </div>

    <div class="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
      <div>
        <span class="text-xs font-bold text-amber-400">השבוע (א'–ש')</span>
        <div id="statWeekRev" class="text-2xl font-black text-white mt-0.5">₪0</div>
        <div id="statWeekCount" class="text-[11px] text-zinc-400 mt-0.5">0 תורים</div>
      </div>
      <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
        📊
      </div>
    </div>

    <div class="bg-zinc-900 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
      <div>
        <span class="text-xs font-bold text-sky-400">החודש הנוכחי</span>
        <div id="statMonthRev" class="text-2xl font-black text-white mt-0.5">₪0</div>
        <div id="statMonthCount" class="text-[11px] text-zinc-400 mt-0.5">0 תורים</div>
      </div>
      <div class="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xl">
        🏆
      </div>
    </div>
  `;

  appointmentsTab.prepend(board);
}

function updateStatsNumbers() {
  mountStatsBoard();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = formatDateLocal(now);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekStartStr = formatDateLocal(startOfWeek);
  const weekEndStr = formatDateLocal(endOfWeek);
  const monthPrefix = todayStr.slice(0, 7);

  let todayCount = 0;
  let todayRev = 0;
  let weekCount = 0;
  let weekRev = 0;
  let monthCount = 0;
  let monthRev = 0;

  for (const item of allAppointments) {
    if (!item.date || item.status === "canceled_by_admin") continue;
    const price = getAppointmentPrice(item);

    if (item.date === todayStr) {
      todayCount++;
      todayRev += price;
    }
    if (item.date >= weekStartStr && item.date <= weekEndStr) {
      weekCount++;
      weekRev += price;
    }
    if (item.date.startsWith(monthPrefix)) {
      monthCount++;
      monthRev += price;
    }
  }

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt("statTodayRev", `₪${todayRev.toLocaleString("he-IL")}`);
  setTxt("statTodayCount", `${todayCount} ${todayCount === 1 ? "תור" : "תורים"}`);

  setTxt("statWeekRev", `₪${weekRev.toLocaleString("he-IL")}`);
  setTxt("statWeekCount", `${weekCount} ${weekCount === 1 ? "תור" : "תורים"}`);

  setTxt("statMonthRev", `₪${monthRev.toLocaleString("he-IL")}`);
  setTxt("statMonthCount", `${monthCount} ${monthCount === 1 ? "תור" : "תורים"}`);
}

mountStatsBoard();

onSnapshot(doc(db, "config", "settings"), (snap) => {
  if (snap.exists() && Array.isArray(snap.data().services)) {
    servicesList = snap.data().services;
    updateStatsNumbers();
  }
});

onSnapshot(collection(db, "appointments"), (snapshot) => {
  allAppointments = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => a.status !== "canceled_by_admin");
  updateStatsNumbers();
});