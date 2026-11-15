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

function mountBannerEditor() {
  const settingsTab = document.getElementById("settingsTab");
  if (!settingsTab || document.getElementById("bannerCard")) return;

  const card = document.createElement("div");
  card.id = "bannerCard";
  card.className = "bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 space-y-3";
  card.innerHTML = `
    <div class="border-b border-zinc-800 pb-3">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">📢 הודעה כללית / באנר בראש אתר הלקוחות</h2>
      <p class="text-xs text-zinc-400">כתוב הודעה חשובה (לדוגמה: "המספרה סגורה בחול המועד"). השאר ריק ולחץ שמור כדי להסתיר את הבאנר.</p>
    </div>
    <div class="flex flex-col sm:flex-row gap-2.5">
      <input
        type="text"
        id="bannerTextInput"
        placeholder="הזן הודעה שתופיע בראש האתר אצל כל הלקוחות..."
        class="flex-1 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
      />
      <div class="flex gap-2">
        <button id="saveBannerBtn" class="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap">
          פרסם הודעה ✓
        </button>
        <button id="clearBannerBtn" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-3 py-2.5 rounded-xl text-xs whitespace-nowrap">
          נקה
        </button>
      </div>
    </div>
  `;

  settingsTab.prepend(card);

  const inputEl = document.getElementById("bannerTextInput");
  const saveBtn = document.getElementById("saveBannerBtn");
  const clearBtn = document.getElementById("clearBannerBtn");

  onSnapshot(doc(db, "config", "settings"), (snap) => {
    if (snap.exists() && document.activeElement !== inputEl) {
      inputEl.value = snap.data().announcementBanner || "";
    }
  });

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "שומר...";
    try {
      await setDoc(doc(db, "config", "settings"), {
        announcementBanner: inputEl.value.trim(),
        updatedAt: Date.now()
      }, { merge: true });
      alert(inputEl.value.trim() ? "הבאנר פורסם בראש אתר הלקוחות! ✓" : "הבאנר הוסר מאתר הלקוחות ✓");
    } catch {
      alert("שגיאה בשמירת הבאנר");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "פרסם הודעה ✓";
    }
  };

  clearBtn.onclick = async () => {
    inputEl.value = "";
    saveBtn.click();
  };
}

mountBannerEditor();