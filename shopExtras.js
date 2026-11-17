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

let shopAddress = "";
let galleryItems = [];

function renderGalleryAdminList() {
  const listEl = document.getElementById("adminGalleryList");
  if (!listEl) return;

  if (galleryItems.length === 0) {
    listEl.innerHTML = `<div class="text-center py-3 text-zinc-500 text-xs bg-zinc-950/60 border border-zinc-800 rounded-xl">אין תמונות בקטלוג (כפתור הקטלוג מוסתר כרגע אצל הלקוחות)</div>`;
    return;
  }

  listEl.innerHTML = galleryItems
    .map(
      (item, idx) => `
      <div class="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${item.url}" alt="${item.title}" class="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0" />
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">${item.title}</div>
            <div class="text-[10px] text-zinc-500 truncate" dir="ltr">${item.url}</div>
          </div>
        </div>
        <button data-idx="${idx}" class="del-gal-btn bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition shrink-0">
          מחק
        </button>
      </div>
    `
    )
    .join("");

  listEl.querySelectorAll(".del-gal-btn").forEach((btn) => {
    btn.onclick = async () => {
      const idx = Number(btn.getAttribute("data-idx"));
      const updated = galleryItems.filter((_, i) => i !== idx);
      await setDoc(doc(db, "config", "settings"), { gallery: updated }, { merge: true });
    };
  });
}

function mountShopExtrasCard() {
  const settingsTab = document.getElementById("settingsTab");
  if (!settingsTab || document.getElementById("shopExtrasCard")) return;

  const card = document.createElement("div");
  card.id = "shopExtrasCard";
  card.className = "bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5";
  card.innerHTML = `
    <div class="border-b border-zinc-800 pb-3">
      <h2 class="text-lg font-bold text-white">📍 כתובת לניווט וקטלוג תספורות</h2>
      <p class="text-xs text-zinc-400">הגדר כתובת לכפתור Waze/Maps אצל הלקוח ותמונות השראה (אם אין תמונות — הכפתור נעלם אוטומטית)</p>
    </div>

    <div class="space-y-2">
      <label class="block text-xs font-bold text-amber-400">כתובת המספרה לניווט מהיר</label>
      <div class="flex flex-col sm:flex-row gap-2">
        <input type="text" id="shopAddressInput" placeholder="לדוגמה: הרצל 15, תל אביב" class="flex-1 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none" />
        <button id="saveShopAddressBtn" class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap">
          שמור כתובת ✓
        </button>
      </div>
    </div>

    <div class="space-y-3 pt-3 border-t border-zinc-800">
      <label class="block text-xs font-bold text-amber-400">✂ קטלוג תספורות / תמונות השראה</label>
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <input type="text" id="galTitleInput" placeholder="שם הסגנון (לדוגמה: פייד נמוך)" class="sm:col-span-4 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
        <input type="url" id="galUrlInput" placeholder="קישור לתמונה (https://...)" dir="ltr" class="sm:col-span-6 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none text-left" />
        <button id="addGalBtn" class="sm:col-span-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 px-3 rounded-xl text-xs">
          + הוסף
        </button>
      </div>
      <div id="adminGalleryList" class="space-y-2"></div>
    </div>
  `;

  settingsTab.appendChild(card);

  document.getElementById("saveShopAddressBtn").onclick = async () => {
    const val = document.getElementById("shopAddressInput").value.trim();
    await setDoc(doc(db, "config", "settings"), { shopAddress: val }, { merge: true });
    alert(val ? "כתובת המספרה נשמרה!" : "הכתובת הוסרה וכפתור הניווט הוסתר.");
  };

  document.getElementById("addGalBtn").onclick = async () => {
    const title = document.getElementById("galTitleInput").value.trim();
    const url = document.getElementById("galUrlInput").value.trim();
    if (!title || !url) {
      alert("נא למלא שם סגנון וקישור לתמונה");
      return;
    }
    const updated = [...galleryItems, { id: "gal_" + Date.now(), title, url }];
    await setDoc(doc(db, "config", "settings"), { gallery: updated }, { merge: true });
    document.getElementById("galTitleInput").value = "";
    document.getElementById("galUrlInput").value = "";
  };
}

mountShopExtrasCard();

onSnapshot(doc(db, "config", "settings"), (snap) => {
  if (!snap.exists()) return;
  const data = snap.data();
  shopAddress = data.shopAddress || "";
  galleryItems = Array.isArray(data.gallery) ? data.gallery : [];

  const addrInp = document.getElementById("shopAddressInput");
  if (addrInp && document.activeElement !== addrInp) {
    addrInp.value = shopAddress;
  }
  renderGalleryAdminList();
});