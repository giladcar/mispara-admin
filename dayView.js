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

let dvSettings = null;
let dvAppointments = [];
let selectedDayStr = formatLocal(new Date());

function formatLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMins(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function mountDayViewCard() {
  const appointmentsTab = document.getElementById("appointmentsTab");
  if (!appointmentsTab || document.getElementById("dayTimelineCard")) return;

  const card = document.createElement("div");
  card.id = "dayTimelineCard";
  card.className = "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl";
  card.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
      <div>
        <h2 class="text-base font-bold text-white flex items-center gap-2">🕒 ציר שעות יומי חזותי (לו״ז ורווחים)</h2>
        <p class="text-xs text-zinc-400">מציג את רצף התורים, החורים הפנויים והשעות החסומות ביום הנבחר</p>
      </div>
      <div class="flex items-center gap-2">
        <button id="dvTodayBtn" class="bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl">היום</button>
        <input type="date" id="dvDateInput" value="${selectedDayStr}" class="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none" />
      </div>
    </div>
    <div id="dvTimelineList" class="space-y-2"></div>
  `;

  appointmentsTab.appendChild(card);

  const dateInp = document.getElementById("dvDateInput");
  dateInp.onchange = () => {
    selectedDayStr = dateInp.value;
    renderTimeline();
  };

  document.getElementById("dvTodayBtn").onclick = () => {
    selectedDayStr = formatLocal(new Date());
    dateInp.value = selectedDayStr;
    renderTimeline();
  };
}

function renderTimeline() {
  mountDayViewCard();
  const listEl = document.getElementById("dvTimelineList");
  if (!listEl || !dvSettings) return;

  const dObj = new Date(selectedDayStr + "T00:00:00");
  const dayIdx = dObj.getDay();
  const rule = (dvSettings.weeklyRules && dvSettings.weeklyRules[dayIdx]) || {
    enabled: (dvSettings.activeDays || []).includes(dayIdx),
    startTime: dvSettings.startTime || "15:00",
    endTime: dvSettings.endTime || "20:00",
    interval: Number(dvSettings.interval) || 30,
    bufferMinutes: Number(dvSettings.bufferMinutes) || 0,
    maxAppointmentsPerDay: Number(dvSettings.maxAppointmentsPerDay) || 0
  };

  const isDateBlocked = (dvSettings.blockedDates || []).includes(selectedDayStr);
  if (!rule.enabled || isDateBlocked) {
    listEl.innerHTML = `<div class="text-center py-6 text-zinc-500 text-xs bg-zinc-950/60 border border-zinc-800 rounded-xl">יום זה סגור או חסום לפעילות</div>`;
    return;
  }

  let cur = toMins(rule.startTime);
  const end = toMins(rule.endTime);
  const step = Number(rule.interval) || 30;
  const buf = Number(rule.bufferMinutes) || 0;
  const maxPerDay = Number(rule.maxAppointmentsPerDay) || 0;

  const slots = [];
  while (cur + step <= end) {
    if (maxPerDay > 0 && slots.length >= maxPerDay) break;
    slots.push(fromMins(cur));
    cur += step + buf;
  }

  const activeDayApps = dvAppointments.filter(
    (a) => a.date === selectedDayStr && a.status !== "canceled_by_admin"
  );

  if (slots.length === 0) {
    listEl.innerHTML = `<div class="text-center py-6 text-zinc-500 text-xs">לא הוגדרו שעות עבודה ליום זה</div>`;
    return;
  }

  listEl.innerHTML = slots
    .map((timeStr) => {
      const sStart = toMins(timeStr);
      const sEnd = sStart + step;
      const endLabel = fromMins(sEnd);

      const matchedApp = activeDayApps.find((a) => {
        const aStart = toMins(a.time);
        const aEnd = aStart + (Number(a.serviceDuration) || step);
        return sStart < aEnd && sEnd > aStart;
      });

      const isBlocked = (dvSettings.blockedSlots || []).includes(`${selectedDayStr}_${timeStr}`);

      if (matchedApp) {
        return `
          <div class="flex items-center gap-3 bg-amber-500/10 border border-amber-500/40 rounded-xl p-3">
            <div class="w-24 text-center border-l border-amber-500/30 pl-3 shrink-0">
              <div class="text-sm font-black text-amber-400">${timeStr}</div>
              <div class="text-[10px] text-zinc-400">עד ${endLabel}</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white truncate">${matchedApp.firstName} ${matchedApp.lastName}</span>
                <span class="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">${matchedApp.serviceName || "תספורת"}</span>
              </div>
              <div class="text-[11px] text-zinc-400 mt-0.5" dir="ltr">📞 ${matchedApp.phone}</div>
            </div>
            <span class="text-xs font-bold text-amber-400 shrink-0">תפוס ●</span>
          </div>
        `;
      }

      if (isBlocked) {
        return `
          <div class="flex items-center gap-3 bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 opacity-75">
            <div class="w-24 text-center border-l border-rose-500/20 pl-3 shrink-0">
              <div class="text-sm font-bold text-rose-400 line-through">${timeStr}</div>
              <div class="text-[10px] text-zinc-500">עד ${endLabel}</div>
            </div>
            <div class="flex-1 text-xs font-bold text-rose-400">שעה חסומה ע"י האדמין</div>
          </div>
        `;
      }

      return `
        <div class="flex items-center justify-between gap-3 bg-zinc-950 border border-dashed border-emerald-500/40 rounded-xl p-3">
          <div class="flex items-center gap-3">
            <div class="w-24 text-center border-l border-zinc-800 pl-3 shrink-0">
              <div class="text-sm font-bold text-emerald-400">${timeStr}</div>
              <div class="text-[10px] text-zinc-500">עד ${endLabel}</div>
            </div>
            <div>
              <span class="text-xs font-bold text-emerald-400">חור פנוי ביומן (${step} דק')</span>
            </div>
          </div>
          <button onclick="openManualBookingModal('${selectedDayStr}', '${timeStr}')" class="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0">
            + שבץ תור
          </button>
        </div>
      `;
    })
    .join("");
}

onSnapshot(doc(db, "config", "settings"), (snap) => {
  if (snap.exists()) {
    dvSettings = snap.data();
    renderTimeline();
  }
});

onSnapshot(collection(db, "appointments"), (snap) => {
  dvAppointments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderTimeline();
});