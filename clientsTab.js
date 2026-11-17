import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let allAppointments = [];
let savedProfiles = {};
let blockedDocs = [];
let noShowCounts = {};
let lateCounts = {};
let searchQuery = "";
let isClientsTabActive = false;

function normKey(raw) {
  return (raw || "").trim().toLowerCase();
}

function getClientKey(email, phone) {
  const cleanEmail = normKey(email);
  if (cleanEmail && cleanEmail !== "manual-admin@mispara.local") return cleanEmail;
  return (phone || "").replace(/\D/g, "");
}

function findTopTabsBar() {
  const appointmentsTab = document.getElementById("appointmentsTab");
  if (!appointmentsTab) return null;

  const parent = appointmentsTab.parentElement;
  if (parent) {
    const siblingBar = Array.from(parent.children).find(
      (el) =>
        el !== appointmentsTab &&
        el.id !== "clientsProfilesTab" &&
        el.querySelectorAll("button").length >= 2
    );
    if (siblingBar) return siblingBar;
  }

  const allButtons = Array.from(document.querySelectorAll("button"));
  const settingsTabBtn = allButtons.find((b) =>
    (b.textContent || "").includes("??????")
  );
  return settingsTabBtn ? settingsTabBtn.parentElement : null;
}

function setClientsTabVisibility(active) {
  isClientsTabActive = active;
  const clientsPanel = document.getElementById("clientsProfilesTab");
  const appointmentsTab = document.getElementById("appointmentsTab");
  const settingsTab = document.getElementById("settingsTab");
  const tabBtn = document.getElementById("tabBtnClients");
  const tabsBar = findTopTabsBar();

  if (active) {
    if (appointmentsTab) appointmentsTab.classList.add("hidden");
    if (settingsTab) settingsTab.classList.add("hidden");
    if (clientsPanel) clientsPanel.classList.remove("hidden");

    if (tabsBar) {
      Array.from(tabsBar.querySelectorAll("button")).forEach((b) => {
        if (b.id === "tabBtnClients") {
          b.className = "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 transition";
        } else {
          b.classList.remove("bg-emerald-500", "bg-amber-500", "text-zinc-950");
          b.classList.add("bg-zinc-900", "text-zinc-400");
        }
      });
    }
    renderClientsDirectory();
  } else {
    if (clientsPanel) clientsPanel.classList.add("hidden");
    if (tabBtn) {
      tabBtn.className = "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition";
    }
  }
}

function mountClientsTabUI() {
  const appointmentsTab = document.getElementById("appointmentsTab");
  if (!appointmentsTab) return;

  let tabsBar = findTopTabsBar();

  if (!tabsBar && !document.getElementById("customAdminTabsBar")) {
    tabsBar = document.createElement("div");
    tabsBar.id = "customAdminTabsBar";
    tabsBar.className = "flex flex-wrap gap-2 mb-4";
    appointmentsTab.parentElement.insertBefore(tabsBar, appointmentsTab);
  }

  if (tabsBar && !document.getElementById("tabBtnClients")) {
    const btn = document.createElement("button");
    btn.id = "tabBtnClients";
    btn.type = "button";
    btn.className = "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition";
    btn.textContent = "?? ?????? ?????????";
    tabsBar.appendChild(btn);

    btn.addEventListener("click", () => setClientsTabVisibility(true));

    Array.from(tabsBar.querySelectorAll("button")).forEach((otherBtn) => {
      if (otherBtn.id === "tabBtnClients") return;
      otherBtn.addEventListener("click", () => {
        setClientsTabVisibility(false);
      });
    });
  }

  if (!document.getElementById("clientsProfilesTab")) {
    const panel = document.createElement("div");
    panel.id = "clientsProfilesTab";
    panel.className = "hidden space-y-4 mt-4";
    panel.innerHTML = `
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-black text-white">?? ???????? ?????????? ??????</h2>
            <p class="text-xs text-zinc-400">????? ?????? ??? ??? ?????, ????? ??????, ??????? ??????? (Ban / Unban)</p>
          </div>
          <span id="totalClientsBadge" class="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-xl self-start sm:self-auto">
            0 ??????
          </span>
        </div>
        <input
          type="text"
          id="clientsDirectorySearch"
          placeholder="?? ??? ???? ??? ??, ????? ?? ??????..."
          class="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
        />
      </div>
      <div id="clientsDirectoryList" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
    `;

    const settingsTab = document.getElementById("settingsTab");
    const anchor = settingsTab || appointmentsTab;
    anchor.insertAdjacentElement("afterend", panel);

    document.getElementById("clientsDirectorySearch").addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderClientsDirectory();
    });
  }
}

async function updateCounter(docName, currentMap, key, delta) {
  const current = Number(currentMap[key]) || 0;
  const next = Math.max(0, current + delta);
  const updated = { ...currentMap };
  if (next === 0) {
    delete updated[key];
  } else {
    updated[key] = next;
  }
  await setDoc(doc(db, "config", docName), { counts: updated });
}

async function handleBanToggle(client) {
  const existingBlocks = blockedDocs.filter((b) => {
    const bEmail = normKey(b.email);
    const bPhone = (b.phone || "").replace(/\D/g, "");
    return (client.email && bEmail === client.email) || (client.phoneDigits && bPhone === client.phoneDigits);
  });

  if (existingBlocks.length > 0) {
    if (!confirm(`????? ????? (Unban) ???? ${client.fullName}?`)) return;
    for (const blk of existingBlocks) {
      await deleteDoc(doc(db, "blocked_users", blk.id));
    }
    alert(`?????? ????? ???? ${client.fullName} ?`);
    return;
  }

  const reason = prompt(`???? ?????? ???? ${client.fullName}:`, "?????? ?????? / ???? ?????");
  if (reason === null) return;

  await addDoc(collection(db, "blocked_users"), {
    email: client.email || "",
    phone: client.phone || "",
    fullName: client.fullName,
    reason: reason.trim() || "???? ???? ??????",
    blockedAt: Date.now()
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const futureApps = allAppointments.filter((a) => {
    if (a.status === "canceled_by_admin" || a.date < todayStr) return false;
    const sameEmail = client.email && normKey(a.userEmail) === client.email;
    const samePhone = client.phoneDigits && (a.phone || "").replace(/\D/g, "") === client.phoneDigits;
    return sameEmail || samePhone;
  });

  for (const fa of futureApps) {
    await updateDoc(doc(db, "appointments", fa.id), {
      status: "canceled_by_admin",
      canceledAt: Date.now()
    });
  }

  alert(`????? ${client.fullName} ???? ??????.`);
}

function buildClientsMap() {
  const map = new Map();

  Object.entries(savedProfiles).forEach(([email, prof]) => {
    const key = getClientKey(email, prof.phone);
    if (!key) return;
    map.set(key, {
      key,
      email: normKey(email),
      phone: prof.phone || "",
      phoneDigits: (prof.phone || "").replace(/\D/g, ""),
      fullName: `${prof.firstName || ""} ${prof.lastName || ""}`.trim() || email,
      totalBookings: 0,
      serviceBreakdown: {}
    });
  });

  allAppointments.forEach((app) => {
    if (app.status === "canceled_by_admin") return;
    const key = getClientKey(app.userEmail, app.phone);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        key,
        email: app.userEmail && app.userEmail !== "manual-admin@mispara.local" ? normKey(app.userEmail) : "",
        phone: app.phone || "",
        phoneDigits: (app.phone || "").replace(/\D/g, ""),
        fullName: `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.userEmail || app.phone,
        totalBookings: 0,
        serviceBreakdown: {}
      });
    }

    const entry = map.get(key);
    if (app.firstName || app.lastName) {
      entry.fullName = `${app.firstName || ""} ${app.lastName || ""}`.trim();
    }
    if (app.phone) {
      entry.phone = app.phone;
      entry.phoneDigits = app.phone.replace(/\D/g, "");
    }

    entry.totalBookings += 1;
    const srv = app.serviceName || "??????";
    entry.serviceBreakdown[srv] = (entry.serviceBreakdown[srv] || 0) + 1;
  });

  return Array.from(map.values()).sort((a, b) => b.totalBookings - a.totalBookings);
}

function renderClientsDirectory() {
  mountClientsTabUI();
  const listEl = document.getElementById("clientsDirectoryList");
  const badgeEl = document.getElementById("totalClientsBadge");
  if (!listEl) return;

  let clients = buildClientsMap();
  if (searchQuery) {
    clients = clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(searchQuery) ||
        c.email.includes(searchQuery) ||
        c.phone.includes(searchQuery)
    );
  }

  if (badgeEl) badgeEl.textContent = `${clients.length} ??????`;

  if (clients.length === 0) {
    listEl.innerHTML = `<div class="col-span-full text-center py-10 text-zinc-500 text-xs bg-zinc-900 border border-zinc-800 rounded-2xl">?? ????? ??????? ?????? ??????</div>`;
    return;
  }

  listEl.innerHTML = "";

  clients.forEach((c) => {
    const noShows = Number(noShowCounts[c.key]) || 0;
    const lates = Number(lateCounts[c.key]) || 0;
    const isBanned = blockedDocs.some((b) => {
      const bEmail = normKey(b.email);
      const bPhone = (b.phone || "").replace(/\D/g, "");
      return (c.email && bEmail === c.email) || (c.phoneDigits && bPhone === c.phoneDigits);
    });

    const servicesTags = Object.entries(c.serviceBreakdown)
      .map(
        ([srvName, cnt]) =>
          `<span class="bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] font-bold px-2.5 py-1 rounded-lg">${srvName}: <b class="text-amber-400">${cnt}</b></span>`
      )
      .join("");

    const card = document.createElement("div");
    card.className = `bg-zinc-900 border ${isBanned ? "border-rose-500/60" : "border-zinc-800"} rounded-2xl p-4 space-y-3 shadow-lg`;
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-base font-black text-white">${c.fullName}</h3>
            ${isBanned ? `<span class="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black px-2 py-0.5 rounded-md">???? ??</span>` : ""}
          </div>
          <div class="text-xs text-zinc-400 mt-0.5" dir="ltr">${c.phone || ""} ${c.email ? `? ${c.email}` : ""}</div>
        </div>
        <div class="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black px-3 py-1 rounded-xl shrink-0">
          ??"?: ${c.totalBookings}
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5">
        ${servicesTags || `<span class="text-[11px] text-zinc-500">??? ?????? ??????</span>`}
      </div>

      <!-- Counters Summary -->
      <div class="grid grid-cols-2 gap-2 pt-1">
        <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-zinc-400">?????? (?? ????)</div>
            <div class="text-sm font-black ${noShows > 0 ? "text-orange-400" : "text-zinc-300"}">${noShows}</div>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="btn-noshow-add bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-zinc-950 text-xs font-black px-2 py-1 rounded-lg transition" title="???? ?????">+1</button>
            ${noShows > 0 ? `<button type="button" class="btn-noshow-sub bg-zinc-800 hover:bg-emerald-500 text-zinc-300 hover:text-zinc-950 text-xs font-bold px-2 py-1 rounded-lg transition" title="??? ?????">-1</button>` : ""}
          </div>
        </div>

        <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-zinc-400">???????</div>
            <div class="text-sm font-black ${lates > 0 ? "text-yellow-400" : "text-zinc-300"}">${lates}</div>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="btn-late-add bg-yellow-500/20 hover:bg-yellow-500 text-yellow-300 hover:text-zinc-950 text-xs font-black px-2 py-1 rounded-lg transition" title="???? ?????">+1</button>
            ${lates > 0 ? `<button type="button" class="btn-late-sub bg-zinc-800 hover:bg-emerald-500 text-zinc-300 hover:text-zinc-950 text-xs font-bold px-2 py-1 rounded-lg transition" title="??? ?????">-1</button>` : ""}
          </div>
        </div>
      </div>

      <!-- Ban / Unban Button -->
      <div class="pt-2 border-t border-zinc-800 flex justify-end">
        <button type="button" class="btn-ban-toggle w-full py-2 rounded-xl text-xs font-black transition ${
          isBanned
            ? "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-zinc-950 border border-emerald-500/40"
            : "bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40"
        }">
          ${isBanned ? "? ??? ????? (Unban)" : "?? ?? ??? (???? ????)"}
        </button>
      </div>
    `;

    card.querySelector(".btn-noshow-add").onclick = () => updateCounter("no_shows", noShowCounts, c.key, 1);
    const subNoShowBtn = card.querySelector(".btn-noshow-sub");
    if (subNoShowBtn) subNoShowBtn.onclick = () => updateCounter("no_shows", noShowCounts, c.key, -1);

    card.querySelector(".btn-late-add").onclick = () => updateCounter("client_lates", lateCounts, c.key, 1);
    const subLateBtn = card.querySelector(".btn-late-sub");
    if (subLateBtn) subLateBtn.onclick = () => updateCounter("client_lates", lateCounts, c.key, -1);

    card.querySelector(".btn-ban-toggle").onclick = () => handleBanToggle(c);

    listEl.appendChild(card);
  });
}

function decorateAppointmentCardsWithBadges() {
  const listEl = document.getElementById("adminAppointmentsList");
  if (!listEl) return;

  Array.from(listEl.children).forEach((card) => {
    const text = card.textContent || "";
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/05\d[-]?\d{7}/);
    const key = getClientKey(emailMatch ? emailMatch[0] : "", phoneMatch ? phoneMatch[0] : "");
    if (!key) return;

    const noShows = Number(noShowCounts[key]) || 0;
    const lates = Number(lateCounts[key]) || 0;

    let badgeWrap = card.querySelector(".client-behavior-badges");
    if (noShows === 0 && lates === 0) {
      if (badgeWrap) badgeWrap.remove();
      return;
    }

    if (!badgeWrap) {
      badgeWrap = document.createElement("div");
      badgeWrap.className = "client-behavior-badges flex flex-wrap gap-1.5 mt-1.5";
      const firstBlock = card.querySelector("div");
      if (firstBlock) firstBlock.appendChild(badgeWrap);
    }

    badgeWrap.innerHTML = `
      ${noShows > 0 ? `<span class="bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black px-2 py-0.5 rounded-md">?? ????? ${noShows}</span>` : ""}
      ${lates > 0 ? `<span class="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-md">? ???? ${lates}</span>` : ""}
    `;
  });
}

function highlightTodayInAdminCalendar() {
  const today = new Date();
  const todayDayStr = String(today.getDate());
  const monthsHe = ["?????", "??????", "???", "?????", "???", "????", "????", "??????", "??????", "???????", "??????", "?????"];
  const expectedTitle = `${monthsHe[today.getMonth()]} ${today.getFullYear()}`;

  const tab = document.getElementById("appointmentsTab");
  if (!tab) return;

  const heading = Array.from(tab.querySelectorAll("h2, h3, div, span")).find(
    (el) => el.children.length === 0 && (el.textContent || "").trim() === expectedTitle
  );
  if (!heading) return;

  const calSection = heading.closest("section, div.bg-zinc-900") || tab;
  const dayButtons = Array.from(calSection.querySelectorAll("button")).filter((btn) => {
    const firstLine = (btn.textContent || "").trim().split(/\s+/)[0];
    return firstLine === todayDayStr && !btn.disabled;
  });

  dayButtons.forEach((btn) => {
    const isCurrentlySelected = btn.classList.contains("bg-emerald-500");
    if (!isCurrentlySelected) {
      btn.classList.remove("bg-zinc-950", "border-zinc-800", "text-zinc-200", "text-white");
      btn.classList.add("bg-emerald-400/25", "border-emerald-400", "text-emerald-200", "font-black", "shadow-md", "shadow-emerald-400/15");
    }
  });
}

setTimeout(mountClientsTabUI, 300);
const bodyObs = new MutationObserver(() => {
  if (!document.getElementById("tabBtnClients")) mountClientsTabUI();
});
bodyObs.observe(document.body, { childList: true, subtree: true });

onSnapshot(collection(db, "appointments"), (snap) => {
  allAppointments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderClientsDirectory();
  decorateAppointmentCardsWithBadges();
});

onSnapshot(collection(db, "barber_users"), (snap) => {
  const map = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data();
  });
  savedProfiles = map;
  renderClientsDirectory();
});

onSnapshot(collection(db, "blocked_users"), (snap) => {
  blockedDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderClientsDirectory();
});

onSnapshot(doc(db, "config", "no_shows"), (snap) => {
  noShowCounts = snap.exists() && snap.data().counts ? snap.data().counts : {};
  renderClientsDirectory();
  decorateAppointmentCardsWithBadges();
});

onSnapshot(doc(db, "config", "client_lates"), (snap) => {
  lateCounts = snap.exists() && snap.data().counts ? snap.data().counts : {};
  renderClientsDirectory();
  decorateAppointmentCardsWithBadges();
});

const appListNode = document.getElementById("adminAppointmentsList");
if (appListNode) {
  const obs = new MutationObserver(() => decorateAppointmentCardsWithBadges());
  obs.observe(appListNode, { childList: true });
}

const adminTabNode = document.getElementById("appointmentsTab");
if (adminTabNode) {
  highlightTodayInAdminCalendar();
  const calObserver = new MutationObserver(() => highlightTodayInAdminCalendar());
  calObserver.observe(adminTabNode, { childList: true, subtree: true });
}