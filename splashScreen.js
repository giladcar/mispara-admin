(function initAdminSplashScreen() {
  if (document.getElementById("adminSplashOverlay")) return;

  const splash = document.createElement("div");
  splash.id = "adminSplashOverlay";
  splash.dir = "rtl";
  splash.className =
    "fixed inset-0 bg-zinc-950 z-[99999] flex flex-col items-center justify-between p-8 transition-opacity duration-500";

  splash.innerHTML = `
    <div class="flex-1 flex flex-col items-center justify-center text-center space-y-5">
      <div class="relative flex items-center justify-center">
        <div class="w-24 h-24 rounded-3xl border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
        <div class="absolute w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-zinc-950 font-black text-3xl shadow-lg shadow-emerald-500/30">
          ✂
        </div>
      </div>
      <div class="space-y-1.5">
        <h1 class="text-2xl font-black text-white tracking-wide">המספרה — ניהול</h1>
        <p class="text-xs text-zinc-400 animate-pulse">טוען נתונים ויומן...</p>
      </div>
    </div>

    <div class="pb-4 text-center">
      <span class="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-black tracking-widest px-4 py-2 rounded-full shadow-lg" dir="ltr">
        MADE BY <span class="text-emerald-400">gilad_c</span>
      </span>
    </div>
  `;

  document.body.appendChild(splash);

  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => splash.remove(), 500);
  }, 3000);
})();