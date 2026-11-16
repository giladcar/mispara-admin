(function initOfflineOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "offlineOverlay";
  overlay.dir = "rtl";
  overlay.className = "hidden fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-center";
  overlay.innerHTML = `
    <div class="w-24 h-24 rounded-3xl bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center text-5xl mb-5 animate-pulse shadow-2xl shadow-rose-500/20">
      📡✕
    </div>
    <h1 class="text-4xl sm:text-5xl font-black text-rose-500 tracking-tight mb-3">
      אין אינטרנט!!
    </h1>
    <p class="text-base sm:text-lg text-zinc-300 max-w-md font-medium">
      החיבור לרשת אבד. לא ניתן לשמור שינויים או לצפות בתורים עד שהאינטרנט יחזור.
    </p>
    <div class="mt-6 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
      ממתין לחידוש החיבור באופן אוטומטי...
    </div>
  `;

  document.body.appendChild(overlay);

  function updateNetworkState() {
    if (navigator.onLine) {
      overlay.classList.add("hidden");
    } else {
      overlay.classList.remove("hidden");
    }
  }

  window.addEventListener("online", updateNetworkState);
  window.addEventListener("offline", updateNetworkState);
  updateNetworkState();
})();