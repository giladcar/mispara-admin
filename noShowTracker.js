import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let noShowCounts = {}; // key: normalized email or phone -> number

function normalizeKey(raw) {
  return (raw || "").trim().toLowerCase();
}

async function incrementNoShow(key, label) {
  if (!key) {
    alert("לא נמצא מזהה לקוח (אימייל או טלפון) לרישום הברזה");
    return;
  }
  const current = Number(noShowCounts[key]) || 0;
  const next = current + 1;
  if (!confirm(`לסמן שהלקוח (${label}) לא הגיע לתור?\nסך הברזות מעודכן: ${next}`)) return;

  const updated = { ...noShowCounts, [key]: next };
  await setDoc(doc(db, "config", "no_shows"), { counts: updated }, { merge: true });
}

function enhanceAppointmentCards() {
  const listEl = document.getElementById("adminAppointmentsList");
  if (!listEl) return;

  const cards = Array.from(listEl.children);
  cards.forEach((card) => {
    const text = card.textContent || "";
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/05\d[-]?\d{7}/);

    const emailKey = emailMatch && emailMatch[0] !== "manual-admin@mispara.local" ? normalizeKey(emailMatch[0]) : "";
    const phoneKey = phoneMatch ? phoneMatch[0].replace(/\D/g, "") : "";
    const lookupKey = emailKey || phoneKey;
    const count = lookupKey ? Number(noShowCounts[lookupKey]) || 0 : 0;

    // 1. Update or inject orange warning badge
    let badge = card.querySelector(".noshow-warning-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("div");
        badge.className =
          "noshow-warning-badge inline-flex items-center gap-1 bg-orange-500/20 border border-orange-500/50 text-orange-300 text-[11px] font-black px-2.5 py-0.5 rounded-lg mt-1.5";
        const firstBlock = card.querySelector("div");
        if (firstBlock) firstBlock.appendChild(badge);
      }
      badge.textContent = `⚠️ הבריז ${count === 1 ? "פעם אחת" : count + " פעמים"}`;
    } else if (badge) {
      badge.remove();
    }

    // 2. Inject "לא הגיע" button once per card
    if (!card.querySelector(".noshow-action-btn") && lookupKey) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "noshow-action-btn bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-zinc-950 border border-orange-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg transition";
      btn.textContent = "לא הגיע 👻";
      btn.onclick = () => incrementNoShow(lookupKey, emailKey || phoneMatch[0]);

      const actionRow = card.querySelector(".border-t") || card;
      actionRow.appendChild(btn);
    }
  });
}

onSnapshot(doc(db, "config", "no_shows"), (snap) => {
  noShowCounts = snap.exists() && snap.data().counts ? snap.data().counts : {};
  enhanceAppointmentCards();
});

const listNode = document.getElementById("adminAppointmentsList");
if (listNode) {
  const obs = new MutationObserver(() => enhanceAppointmentCards());
  obs.observe(listNode, { childList: true });
}