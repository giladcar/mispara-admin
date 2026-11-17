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

let noShowCounts = {};

function normalizeKey(raw) {
  return (raw || "").trim().toLowerCase();
}

async function changeNoShow(key, label, delta) {
  if (!key) {
    alert("לא נמצא מזהה לקוח (אימייל או טלפון)");
    return;
  }
  const current = Number(noShowCounts[key]) || 0;
  const next = Math.max(0, current + delta);

  const actionText = delta > 0
    ? `לסמן שהלקוח (${label}) לא הגיע לתור?\nסך הברזות מעודכן: ${next}`
    : `לבטל הברזה אחת עבור (${label})?\nסך הברזות מעודכן: ${next}`;

  if (!confirm(actionText)) return;

  const updated = { ...noShowCounts };
  if (next === 0) {
    delete updated[key];
  } else {
    updated[key] = next;
  }

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
    const displayLabel = emailKey || (phoneMatch ? phoneMatch[0] : "");
    const count = lookupKey ? Number(noShowCounts[lookupKey]) || 0 : 0;

    // 1. Update or remove orange warning badge
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

    if (!lookupKey) return;
    const actionRow = card.querySelector(".border-t") || card;

    // 2. Ensure "לא הגיע" (+1) button exists
    if (!card.querySelector(".noshow-action-btn")) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className =
        "noshow-action-btn bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-zinc-950 border border-orange-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg transition";
      addBtn.textContent = "לא הגיע 👻";
      addBtn.onclick = () => changeNoShow(lookupKey, displayLabel, 1);
      actionRow.appendChild(addBtn);
    }

    // 3. Show or hide "בטל הברזה" (-1) button based on current count
    let undoBtn = card.querySelector(".noshow-undo-btn");
    if (count > 0) {
      if (!undoBtn) {
        undoBtn = document.createElement("button");
        undoBtn.type = "button";
        undoBtn.className =
          "noshow-undo-btn bg-zinc-800 hover:bg-emerald-500 text-zinc-200 hover:text-zinc-950 border border-zinc-700 hover:border-emerald-400 text-xs font-bold px-2.5 py-1.5 rounded-lg transition";
        undoBtn.textContent = "בטל הברזה ↩️";
        undoBtn.onclick = () => changeNoShow(lookupKey, displayLabel, -1);
        actionRow.appendChild(undoBtn);
      }
    } else if (undoBtn) {
      undoBtn.remove();
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