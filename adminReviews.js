import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

function mountReviewsSection() {
  const tab = document.getElementById("appointmentsTab");
  if (!tab || document.getElementById("adminReviewsCard")) return;

  const card = document.createElement("div");
  card.id = "adminReviewsCard";
  card.className = "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl";
  card.innerHTML = `
    <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
      <div>
        <h2 class="text-base font-bold text-white flex items-center gap-2">⭐ דירוגים ומשובים מלקוחות</h2>
        <p class="text-xs text-zinc-400">משובים שלקוחות השאירו בסיום התספורת</p>
      </div>
      <div id="adminAvgRatingBadge" class="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black px-3 py-1.5 rounded-xl">
        אין דירוגים עדיין
      </div>
    </div>
    <div id="adminReviewsList" class="space-y-2 max-h-72 overflow-y-auto"></div>
  `;
  tab.appendChild(card);
}

onSnapshot(collection(db, "appointments"), (snap) => {
  mountReviewsSection();
  const listEl = document.getElementById("adminReviewsList");
  const avgEl = document.getElementById("adminAvgRatingBadge");
  if (!listEl || !avgEl) return;

  const reviewed = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => Number(a.rating) >= 1)
    .sort((a, b) => (b.ratedAt || 0) - (a.ratedAt || 0));

  if (reviewed.length === 0) {
    avgEl.textContent = "אין דירוגים עדיין";
    listEl.innerHTML = `<div class="text-center py-4 text-zinc-500 text-xs">עדיין לא התקבלו דירוגים מלקוחות</div>`;
    return;
  }

  const sum = reviewed.reduce((acc, item) => acc + Number(item.rating), 0);
  const avg = (sum / reviewed.length).toFixed(1);
  avgEl.textContent = `⭐ ${avg} / 5 (${reviewed.length} דירוגים)`;

  listEl.innerHTML = reviewed
    .map((r) => {
      const stars = "⭐".repeat(Math.min(5, Math.max(1, Number(r.rating))));
      return `
        <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">${r.firstName} ${r.lastName} <span class="text-zinc-500 font-normal">(${r.serviceName || "תספורת"})</span></span>
            <span class="text-xs">${stars}</span>
          </div>
          ${r.reviewComment ? `<p class="text-xs text-zinc-300">"${r.reviewComment}"</p>` : ""}
          <div class="text-[10px] text-zinc-500">${r.date} | ${r.time}</div>
        </div>
      `;
    })
    .join("");
});