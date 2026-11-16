import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let blockedUsersList = [];

function emailToSafeId(email) {
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, "%2E");
}

window.blockUserByEmail = async function(email, fullName = "") {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || cleanEmail === "manual-admin@mispara.local") {
    alert("לא ניתן לחסום תור שנקבע ידנית ללא מייל לקוח");
    return;
  }

  const reason = prompt(
    `הזן סיבת חסימה עבור ${fullName ? fullName + " (" + cleanEmail + ")" : cleanEmail}:`,
    "הברזה מתור ללא הודעה מראש"
  );
  if (reason === null) return;

  const cleanReason = reason.trim() || "הפרת נהלי המספרה";
  const docId = emailToSafeId(cleanEmail);

  try {
    // 1. Save blocked user record
    await setDoc(doc(db, "blocked_users", docId), {
      id: docId,
      email: cleanEmail,
      name: fullName,
      reason: cleanReason,
      blockedAt: Date.now()
    });

    // 2. Automatically find and cancel all appointments belonging to this email
    const appsSnap = await getDocs(collection(db, "appointments"));
    const deletePromises = [];
    appsSnap.forEach((docSnap) => {
      const appEmail = (docSnap.data().userEmail || "").trim().toLowerCase();
      if (appEmail === cleanEmail) {
        deletePromises.push(deleteDoc(doc(db, "appointments", docSnap.id)));
      }
    });

    await Promise.all(deletePromises);

    const canceledCount = deletePromises.length;
    alert(
      canceledCount > 0
        ? `המשתמש ${cleanEmail} נחסם בהצלחה, ו-${canceledCount} תורים שלו בוטלו אוטומטית והשעות התפנו! 🚫`
        : `המשתמש ${cleanEmail} נחסם בהצלחה! 🚫`
    );
  } catch (err) {
    console.error("Blacklist error:", err);
    alert(`שגיאה בחסימת המשתמש:\n${err.code || ""} - ${err.message || err}`);
  }
};

window.unblockUserByEmail = async function(docId, email) {
  if (!confirm(`להתיר את החסימה עבור ${email}?`)) return;

  try {
    await deleteDoc(doc(db, "blocked_users", docId));
    alert(`החסימה הוסרה עבור ${email} ✓`);
  } catch (err) {
    console.error("Unblock error:", err);
    alert(`שגיאה בהסרת החסימה:\n${err.message || err}`);
  }
};

function renderBlockedUsersList() {
  const listEl = document.getElementById("blockedUsersListContainer");
  const countEl = document.getElementById("blockedUsersCount");
  if (!listEl) return;

  if (countEl) countEl.textContent = blockedUsersList.length;

  if (blockedUsersList.length === 0) {
    listEl.innerHTML = `<div class="text-center py-4 text-zinc-500 text-xs bg-zinc-950/60 border border-zinc-800/80 rounded-xl">אין כרגע משתמשים חסומים במערכת</div>`;
    return;
  }

  listEl.innerHTML = blockedUsersList.map(u => {
    const safeId = u.id || emailToSafeId(u.email);
    return `
      <div class="bg-zinc-950 border border-rose-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-rose-400" dir="ltr">${u.email}</span>
            ${u.name ? `<span class="text-xs text-zinc-300 font-medium">(${u.name})</span>` : ""}
          </div>
          <p class="text-xs text-zinc-400 mt-1"><b>סיבה:</b> ${u.reason}</p>
        </div>
        <button onclick="unblockUserByEmail('${safeId}', '${u.email}')" class="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition self-start sm:self-auto whitespace-nowrap">
          התר חסימה ✓
        </button>
      </div>
    `;
  }).join("");
}

function mountBlacklistUI() {
  const settingsTab = document.getElementById("settingsTab");
  if (!settingsTab || document.getElementById("blacklistCard")) return;

  const card = document.createElement("div");
  card.id = "blacklistCard";
  card.className = "bg-zinc-900 border border-rose-500/30 rounded-2xl p-5 space-y-4";
  card.innerHTML = `
    <div class="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-bold text-white flex items-center gap-2">🚫 משתמשים חסומים (<span id="blockedUsersCount">0</span>)</h2>
        <p class="text-xs text-zinc-400">חסימת משתמש מבטלת אוטומטית את כל התורים שלו ומונעת ממנו להתחבר למערכת</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        id="manualBlockEmailInput"
        placeholder="הזן אימייל לחסימה ידנית (לדוגמה: client@gmail.com)"
        dir="ltr"
        class="flex-1 bg-zinc-950 border border-zinc-700 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none text-left"
      />
      <button id="manualBlockBtn" class="bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap">
        + חסום אימייל
      </button>
    </div>

    <div id="blockedUsersListContainer" class="space-y-2"></div>
  `;

  settingsTab.prepend(card);

  document.getElementById("manualBlockBtn").onclick = () => {
    const inp = document.getElementById("manualBlockEmailInput");
    if (!inp.value.trim()) {
      alert("נא להזין כתובת אימייל");
      return;
    }
    window.blockUserByEmail(inp.value.trim());
    inp.value = "";
  };

  renderBlockedUsersList();
}

onSnapshot(collection(db, "blocked_users"), (snap) => {
  blockedUsersList = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.blockedAt || 0) - (a.blockedAt || 0));
  renderBlockedUsersList();
}, (err) => {
  console.error("Snapshot blocked_users error:", err);
});

mountBlacklistUI();