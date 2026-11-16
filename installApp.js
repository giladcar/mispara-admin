(function initAdminInstallButton() {
  let deferredPrompt = null;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) return;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isFirefox = /Firefox|FxiOS/i.test(ua);

  const btn = document.createElement("button");
  btn.id = "installAdminAppBtn";
  btn.dir = "rtl";
  btn.className =
    "hidden fixed bottom-5 left-5 z-50 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl shadow-amber-500/30 border border-amber-300 flex items-center gap-2 transition transform hover:scale-105";
  btn.innerHTML = `<span>??</span><span>???? ????????? ?????</span>`;

  const helpModal = document.createElement("div");
  helpModal.id = "manualInstallModal";
  helpModal.dir = "rtl";
  helpModal.className =
    "hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4";

  const instructionsHtml = isIOS
    ? `
      <h3 class="text-lg font-black text-white">????? ????????? ???????</h3>
      <ol class="text-right text-xs text-zinc-300 space-y-2.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <li>1. ??? ?? ????? ?????? <b>(????? ?? ?? ????? ??)</b> ?????? Safari.</li>
        <li>2. ???? ???? ???? ?-<b>"???? ???? ????" (Add to Home Screen)</b>.</li>
        <li>3. ??? ?? <b>"????" (Add)</b> ????? ???????.</li>
      </ol>
    `
    : `
      <h3 class="text-lg font-black text-white">????? ??? ????? Firefox</h3>
      <ol class="text-right text-xs text-zinc-300 space-y-2.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <li>1. <b>?????? (????????):</b> ??? ?? <b>???? ??????? (?)</b> ????? -> ??? ?-<b>"????" (Install)</b> ?? <b>"???? ???? ????"</b>.</li>
        <li>2. <b>?????:</b> ????? Firefox ????? ???? ???? ?????? ?????????. ??? ?? ?????? ?????? <b>Chrome</b> ?? <b>Edge</b> ??? ?????? ?????? ???.</li>
      </ol>
    `;

  helpModal.innerHTML = `
    <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mx-auto">??</div>
      ${instructionsHtml}
      <button id="closeManualInstallModal" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs">
        ?????, ????!
      </button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(helpModal);

  document.getElementById("closeManualInstallModal").onclick = () => {
    helpModal.classList.add("hidden");
  };

  if (isIOS || isFirefox) {
    btn.classList.remove("hidden");
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.classList.remove("hidden");
  });

  btn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        btn.classList.add("hidden");
      }
      deferredPrompt = null;
      return;
    }
    helpModal.classList.remove("hidden");
  };

  window.addEventListener("appinstalled", () => {
    btn.classList.add("hidden");
    deferredPrompt = null;
  });
})();