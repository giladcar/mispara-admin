(function initAdminInstallButton() {
  let deferredPrompt = null;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Create floating install button
  const btn = document.createElement("button");
  btn.id = "installAdminAppBtn";
  btn.dir = "rtl";
  btn.className =
    "hidden fixed bottom-5 left-5 z-50 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl shadow-amber-500/30 border border-amber-300 flex items-center gap-2 transition transform hover:scale-105";
  btn.innerHTML = `<span>📲</span><span>התקן אפליקציית ניהול</span>`;

  // Create iOS instructions modal
  const iosModal = document.createElement("div");
  iosModal.id = "iosInstallModal";
  iosModal.dir = "rtl";
  iosModal.className =
    "hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4";
  iosModal.innerHTML = `
    <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mx-auto">📲</div>
      <h3 class="text-lg font-black text-white">התקנת האפליקציה באייפון</h3>
      <ol class="text-right text-xs text-zinc-300 space-y-2.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <li>1. לחץ על כפתור השיתוף <b>(ריבוע עם חץ למעלה ⬆️)</b> בתחתית הדפדפן Safari.</li>
        <li>2. גלול מעט למטה ובחר ב-<b>"הוסף למסך הבית" (Add to Home Screen)</b>.</li>
        <li>3. לחץ על <b>"הוסף" (Add)</b> בפינה העליונה.</li>
      </ol>
      <button id="closeIosInstallModal" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs">
        הבנתי, תודה!
      </button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(iosModal);

  document.getElementById("closeIosInstallModal").onclick = () => {
    iosModal.classList.add("hidden");
  };

  if (isIOS) {
    btn.classList.remove("hidden");
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.classList.remove("hidden");
  });

  btn.onclick = async () => {
    if (isIOS) {
      iosModal.classList.remove("hidden");
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      btn.classList.add("hidden");
    }
    deferredPrompt = null;
  };

  window.addEventListener("appinstalled", () => {
    btn.classList.add("hidden");
    deferredPrompt = null;
  });
})();