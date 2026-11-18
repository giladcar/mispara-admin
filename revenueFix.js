import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const TXT = {
  todayRev: "\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D4\u05D9\u05D5\u05DD (\u05DB\u05D5\u05DC\u05DC \u05DE\u05D4 \u05E9\u05E2\u05D1\u05E8)",
  weekRev: "\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D4\u05E9\u05D1\u05D5\u05E2 (\u05D0'-\u05E9')",
  monthRev: "\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9 \u05D4\u05DE\u05DC\u05D0",
  summaryTitle: "\uD83D\uDCB0 \u05E1\u05D9\u05DB\u05D5\u05DD \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05DE\u05DC\u05D0 (\u05DB\u05D5\u05DC\u05DC \u05EA\u05D5\u05E8\u05D9\u05DD \u05E9\u05DB\u05D1\u05E8 \u05E2\u05D1\u05E8\u05D5)",
  apptsWord: "\u05EA\u05D5\u05E8\u05D9\u05DD"
};

let appointmentsList = [];
let servicesList = [];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getAppPrice(appItem) {
  if (appItem.servicePrice !== undefined && appItem.servicePrice !== null && appItem.servicePrice !== "") {
    return Number(appItem.servicePrice) || 0;
  }
  const matched =
    servicesList.find((s) => s.id === appItem.serviceId) ||
    servicesList.find((s) => s.name === appItem.serviceName);
  return matched ? Number(matched.price) || 0 : 0;
}

function calculateFullRevenues() {
  const now = new Date();
  const todayStr = toDateStr(now);

  // Full week: Sunday (day 0) to Saturday (day 6)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()));
  const weekStartStr = toDateStr(startOfWeek);
  const weekEndStr = toDateStr(endOfWeek);

  // Full month: 1st of month to last day of month
  const monthPrefix = todayStr.slice(0, 7); // YYYY-MM

  let dayTotal = 0, dayCount = 0;
  let weekTotal = 0, weekCount = 0;
  let monthTotal = 0, monthCount = 0;

  appointmentsList.forEach((item) => {
    if (item.status === "canceled_by_admin") return;
    if (!item.date) return;

    const price = getAppPrice(item);

    // Entire Today (past + upcoming hours today)
    if (item.date === todayStr) {
      dayTotal += price;
      dayCount += 1;
    }

    // Entire Week (Sunday through Saturday, including past days this week)
    if (item.date >= weekStartStr && item.date <= weekEndStr) {
      weekTotal += price;
      weekCount += 1;
    }

    // Entire Month (1st through end of month, including all past days this month)
    if (item.date.startsWith(monthPrefix)) {
      monthTotal += price;
      monthCount += 1;
    }
  });

  renderRevenuePanel({ dayTotal, dayCount, weekTotal, weekCount, monthTotal, monthCount });
}

function renderRevenuePanel({ dayTotal, dayCount, weekTotal, weekCount, monthTotal, monthCount }) {
  const appointmentsTab = document.getElementById("appointmentsTab");
  if (!appointmentsTab) return;

  // Hide any old partial revenue box if it exists so there is no confusion
  Array.from(appointmentsTab.children).forEach((child) => {
    if (child.id === "fullRevenueSummaryCard") return;
    const txt = child.textContent || "";
    if (
      (txt.includes("\u05D4\u05D9\u05D5\u05DD") && txt.includes("\u05D4\u05E9\u05D1\u05D5\u05E2") && txt.includes("\u05D4\u05D7\u05D5\u05D3\u05E9") && txt.includes("\u20AA"))
    ) {
      child.style.display = "none";
    }
  });

  let card = document.getElementById("fullRevenueSummaryCard");
  if (!card) {
    card = document.createElement("div");
    card.id = "fullRevenueSummaryCard";
    card.dir = "rtl";
    card.className = "bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl mb-4";
    appointmentsTab.prepend(card);
  }

  card.innerHTML = `
    <div class="flex items-center justify-between border-b border-zinc-800 pb-2.5">
      <h3 class="text-sm sm:text-base font-black text-white">${TXT.summaryTitle}</h3>
    </div>
    <div class="grid grid-cols-3 gap-2.5 text-center">
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
        <div class="text-[11px] text-zinc-400 font-bold">${TXT.todayRev}</div>
        <div class="text-lg sm:text-xl font-black text-emerald-400 mt-1">\u20AA${dayTotal.toLocaleString()}</div>
        <div class="text-[10px] text-zinc-500 mt-0.5">${dayCount} ${TXT.apptsWord}</div>
      </div>
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
        <div class="text-[11px] text-zinc-400 font-bold">${TXT.weekRev}</div>
        <div class="text-lg sm:text-xl font-black text-amber-400 mt-1">\u20AA${weekTotal.toLocaleString()}</div>
        <div class="text-[10px] text-zinc-500 mt-0.5">${weekCount} ${TXT.apptsWord}</div>
      </div>
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
        <div class="text-[11px] text-zinc-400 font-bold">${TXT.monthRev}</div>
        <div class="text-lg sm:text-xl font-black text-sky-400 mt-1">\u20AA${monthTotal.toLocaleString()}</div>
        <div class="text-[10px] text-zinc-500 mt-0.5">${monthCount} ${TXT.apptsWord}</div>
      </div>
    </div>
  `;
}

onSnapshot(doc(db, "config", "settings"), (snap) => {
  if (snap.exists() && Array.isArray(snap.data().services)) {
    servicesList = snap.data().services;
    calculateFullRevenues();
  }
});

onSnapshot(collection(db, "appointments"), (snap) => {
  appointmentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  calculateFullRevenues();
});