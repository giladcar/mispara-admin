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
let uploadMode = "file"; // 'file' or 'url'
let pendingBase64Image = "";

// High-quality client-side image compression
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("שגיאה בקריאת הקובץ"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("קובץ תמונה לא תקין"));
      img.onload = () => {
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderGalleryAdminList() {
  const listEl = document.getElementById("adminGalleryList");
  if (!listEl) return;

  if (galleryItems.length === 0) {
    listEl.innerHTML = `<div class="text-center py-3 text-zinc-500 text-xs bg-zinc-950/60 border border-zinc-800 rounded-xl">אין תמונות בקטלוג (כפתור הקטלוג מוסתר כרגע אצל הלקוחות)</div>`;
    return;
  }

  listEl.innerHTML = galleryItems
    .map((item, idx) => {
      const isUploaded = (item.url || "").startsWith("data:image");
      return `
        <div class="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${item.url}" alt="${item.title}" class="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0" />
            <div class="min-w-0">
              <div class="text-xs font-bold text-white truncate">${item.title}</div>
              <div class="text-[10px] text-zinc-400 truncate" dir="ltr">
                ${isUploaded ? "📷 תמונה שהועלתה מהמכשיר" : item.url}
              </div>
            </div>
          </div>
          <button data-idx="${idx}" class="del-gal-btn bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition shrink-0">
            מחק
          </button>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll(".del-gal-btn").forEach((btn) => {
    btn.onclick = async () => {
      const idx = Number(btn.getAttribute("data-idx"));
      const updated = galleryItems.filter((_, i) => i !== idx);
      await setDoc(doc(db, "config", "settings"), { gallery: updated }, { merge: true });
    };
  });
}

function updateSourceModeUI() {
  const fileBtn = document.getElementById("modeFileBtn");
  const urlBtn = document.getElementById("modeUrlBtn");
  const fileBox = document.getElementById("galFileWrapper");
  const urlBox = document.getElementById("galUrlWrapper");
  if (!fileBtn || !urlBtn) return;

  if (uploadMode === "file") {
    fileBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 transition";
    urlBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 transition";
    fileBox.classList.remove("hidden");
    urlBox.classList.add("hidden");
  } else {
    urlBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 transition";
    fileBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 transition";
    urlBox.classList.remove("hidden");
    fileBox.classList.add("hidden");
  }
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
      <label class="block text-xs font-bold text-amber-400">✂ הוספת תמונה לקטלוג התספורות</label>

      <input type="text" id="galTitleInput" placeholder="שם הסגנון (לדוגמה: פייד נמוך / קרופ)" class="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none" />

      <!-- Toggle: Upload File OR Paste URL -->
      <div class="flex gap-2">
        <button type="button" id="modeFileBtn" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950">
          📷 העלאת תמונה / צילום
        </button>
        <button type="button" id="modeUrlBtn" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-zinc-950 text-zinc-400 border border-zinc-800">
          🔗 קישור לתמונה (URL)
        </button>
      </div>

      <!-- Option A: File Upload / Camera -->
      <div id="galFileWrapper" class="space-y-2">
        <label class="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl bg-zinc-950 cursor-pointer transition">
          <span class="text-xs font-bold text-zinc-300" id="galFileLabel">לחץ כאן לבחירת תמונה מהגלריה או לצילום</span>
          <input type="file" id="galFileInput" accept="image/*" class="hidden" />
        </label>
        <div id="galPreviewBox" class="hidden flex items-center gap-3 bg-zinc-950 border border-emerald-500/30 rounded-xl p-2">
          <img id="galPreviewImg" src="" alt="תצוגה מקדימה" class="w-14 h-14 rounded-lg object-cover border border-zinc-700" />
          <span class="text-xs text-emerald-400 font-bold">התמונה מוכנה להעלאה ✓</span>
        </div>
      </div>

      <!-- Option B: URL Input -->
      <div id="galUrlWrapper" class="hidden">
        <input type="url" id="galUrlInput" placeholder="הדבק קישור לתמונה (https://...)" dir="ltr" class="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none text-left" />
      </div>

      <button id="addGalBtn" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-2.5 px-4 rounded-xl text-xs transition">
        + הוסף לקטלוג התספורות
      </button>

      <div id="adminGalleryList" class="space-y-2 pt-2"></div>
    </div>
  `;

  settingsTab.appendChild(card);

  document.getElementById("modeFileBtn").onclick = () => {
    uploadMode = "file";
    updateSourceModeUI();
  };

  document.getElementById("modeUrlBtn").onclick = () => {
    uploadMode = "url";
    updateSourceModeUI();
  };

  const fileInput = document.getElementById("galFileInput");
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const labelEl = document.getElementById("galFileLabel");
    labelEl.textContent = "מעבד תמונה באיכות גבוהה...";
    try {
      pendingBase64Image = await compressImageFile(file);
      document.getElementById("galPreviewImg").src = pendingBase64Image;
      document.getElementById("galPreviewBox").classList.remove("hidden");
      labelEl.textContent = file.name;
    } catch (err) {
      alert(err.message || "שגיאה בטעינת התמונה");
      pendingBase64Image = "";
      labelEl.textContent = "לחץ כאן לבחירת תמונה מהגלריה או לצילום";
    }
  };

  document.getElementById("saveShopAddressBtn").onclick = async () => {
    const val = document.getElementById("shopAddressInput").value.trim();
    await setDoc(doc(db, "config", "settings"), { shopAddress: val }, { merge: true });
    alert(val ? "כתובת המספרה נשמרה!" : "הכתובת הוסרה וכפתור הניווט הוסתר.");
  };

  document.getElementById("addGalBtn").onclick = async () => {
    const title = document.getElementById("galTitleInput").value.trim();
    if (!title) {
      alert("נא למלא שם סגנון לתספורת");
      return;
    }

    let finalImageUrl = "";
    if (uploadMode === "file") {
      if (!pendingBase64Image) {
        alert("נא לבחור או לצלם תמונה קודם");
        return;
      }
      finalImageUrl = pendingBase64Image;
    } else {
      const urlVal = document.getElementById("galUrlInput").value.trim();
      if (!urlVal) {
        alert("נא להדביק קישור לתמונה");
        return;
      }
      finalImageUrl = urlVal;
    }

    const addBtn = document.getElementById("addGalBtn");
    addBtn.disabled = true;
    addBtn.textContent = "שומר תמונה בקטלוג...";

    try {
      const updated = [...galleryItems, { id: "gal_" + Date.now(), title, url: finalImageUrl }];
      await setDoc(doc(db, "config", "settings"), { gallery: updated }, { merge: true });

      document.getElementById("galTitleInput").value = "";
      document.getElementById("galUrlInput").value = "";
      fileInput.value = "";
      pendingBase64Image = "";
      document.getElementById("galPreviewBox").classList.add("hidden");
      document.getElementById("galFileLabel").textContent = "לחץ כאן לבחירת תמונה מהגלריה או לצילום";
    } catch (err) {
      console.error(err);
      alert("שגיאה בשמירת התמונה (ייתכן שהקובץ גדול מדי). נסה תמונה אחרת.");
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = "+ הוסף לקטלוג התספורות";
    }
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