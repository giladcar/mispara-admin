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

function mountBarberPhoneEditor() {
  const settingsTab = document.getElementById("settingsTab");
  if (!settingsTab || document.getElementById("barberPhoneCard")) return;

  const card = document.createElement("div");
  card.id = "barberPhoneCard";
  card.className = "bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3";
  card.innerHTML = `
    <div class="border-b border-zinc-800 pb-3">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">📱 טלפון המספרה לעדכוני וואטסאפ מלקוחות</h2>
      <p class="text-xs text-zinc-400">אליו יישלחו הודעות "אני מאחר" שלקוחות שולחים מתוך "התורים שלי"</p>
    </div>
    <div class="flex flex-col sm:flex-row gap-2.5">
      <input
        type="tel"
        id="barberPhoneInput"
        placeholder="לדוגמה: 050-1234567"
        dir="ltr"
        class="flex-1 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none text-left"
      />
      <button id="saveBarberPhoneBtn" class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-xs whitespace-nowrap">
        שמור מספר מספרה ✓
      </button>
    </div>
  `;

  settingsTab.prepend(card);

  const inputEl = document.getElementById("barberPhoneInput");
  const saveBtn = document.getElementById("saveBarberPhoneBtn");

  onSnapshot(doc(db, "config", "settings"), (snap) => {
    if (snap.exists() && document.activeElement !== inputEl) {
      inputEl.value = snap.data().barberPhone || "";
    }
  });

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "שומר...";
    try {
      await setDoc(doc(db, "config", "settings"), {
        barberPhone: inputEl.value.trim(),
        updatedAt: Date.now()
      }, { merge: true });
      alert("מספר הטלפון של המספרה נשמר בהצלחה! ✓");
    } catch {
      alert("שגיאה בשמירת המספר");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "שמור מספר מספרה ✓";
    }
  };
}

mountBarberPhoneEditor();