(function initClientSearch() {
  function mountSearchBar() {
    const listEl = document.getElementById("adminAppointmentsList");
    if (!listEl || document.getElementById("clientSearchBox")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "clientSearchBox";
    wrapper.className = "bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2";
    wrapper.innerHTML = `
      <div class="relative flex-1">
        <input
          type="text"
          id="clientSearchInput"
          placeholder="🔍 חיפוש מהיר לפי שם לקוח, טלפון או אימייל..."
          class="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
        />
      </div>
      <div class="flex items-center justify-between sm:justify-end gap-2">
        <span id="clientSearchCounter" class="hidden text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg"></span>
        <button id="clearClientSearchBtn" class="hidden bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-xl">
          נקה חיפוש ✕
        </button>
      </div>
    `;

    listEl.parentNode.insertBefore(wrapper, listEl);

    const input = document.getElementById("clientSearchInput");
    const clearBtn = document.getElementById("clearClientSearchBtn");

    input.addEventListener("input", applySearchFilter);
    clearBtn.addEventListener("click", () => {
      input.value = "";
      applySearchFilter();
    });

    // Re-apply search whenever the list re-renders
    const observer = new MutationObserver(() => {
      if (input.value.trim()) applySearchFilter();
    });
    observer.observe(listEl, { childList: true });
  }

  function applySearchFilter() {
    const input = document.getElementById("clientSearchInput");
    const listEl = document.getElementById("adminAppointmentsList");
    const counterEl = document.getElementById("clientSearchCounter");
    const clearBtn = document.getElementById("clearClientSearchBtn");
    if (!input || !listEl) return;

    const q = input.value.trim().toLowerCase();
    const cards = Array.from(listEl.children);

    if (!q) {
      cards.forEach((c) => (c.style.display = ""));
      counterEl.classList.add("hidden");
      clearBtn.classList.add("hidden");
      return;
    }

    clearBtn.classList.remove("hidden");
    let visibleCount = 0;

    cards.forEach((card) => {
      const text = (card.textContent || "").toLowerCase();
      if (text.includes(q)) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    counterEl.textContent = `נמצאו ${visibleCount} תורים`;
    counterEl.classList.remove("hidden");
  }

  mountSearchBar();
})();