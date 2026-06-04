// Pawpath — напоминания. Уведомления работают в установленном на телефон приложении
// (iOS 16.4+, экран «Домой»). В обычной вкладке браузера — только как план на день.

const Reminders = (() => {
  function supported() { return typeof Notification !== "undefined"; }
  function isStandalone() {
    return window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  }
  function permission() { return supported() ? Notification.permission : "unsupported"; }

  async function requestPermission() {
    if (!supported()) return "unsupported";
    try { return await Notification.requestPermission(); }
    catch (e) { return "denied"; }
  }

  function notify(title, body) {
    if (!supported() || Notification.permission !== "granted") return;
    const opts = { body, icon: "assets/icon-192.png", badge: "assets/icon-192.png", tag: "pawpath" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then(reg => reg.showNotification(title, opts))
        .catch(() => { try { new Notification(title, opts); } catch (e) {} });
    } else {
      try { new Notification(title, opts); } catch (e) {}
    }
  }

  // Планируем уведомления на оставшуюся часть сегодняшнего дня (пока приложение открыто).
  let timers = [];
  function scheduleToday() {
    timers.forEach(clearTimeout); timers = [];
    if (permission() !== "granted") return;
    const s = State.get();
    const items = (s.reminders && s.reminders.items) || [];
    const now = new Date();
    items.filter(r => r.enabled).forEach(r => {
      const [h, m] = String(r.time).split(":").map(Number);
      const t = new Date(); t.setHours(h, m, 0, 0);
      const diff = t.getTime() - now.getTime();
      if (diff > 1000 && diff < 24 * 3600 * 1000) {
        timers.push(setTimeout(() => notify(`${r.ico} ${r.label}`, "Время заняться с собакой 🐾"), diff));
      }
    });
  }

  function todayList(s) {
    const items = ((s.reminders && s.reminders.items) || []).filter(r => r.enabled);
    return items.slice().sort((a, b) => a.time.localeCompare(b.time));
  }

  return { supported, isStandalone, permission, requestPermission, notify, scheduleToday, todayList };
})();

// ======================= ЭКРАН НАПОМИНАНИЙ =======================
const RemindersScreen = (() => {
  const modalRoot = () => document.getElementById("modal-root");
  function closeModal() { modalRoot().innerHTML = ""; }

  function statusBanner() {
    const perm = Reminders.permission();
    if (!Reminders.supported() || (!Reminders.isStandalone() && perm !== "granted")) {
      return `<div class="banner fear" style="margin:0 0 14px">
        <span class="b-ico">📲</span>
        <div><div class="b-title">Чтобы приходили уведомления</div>
        <div class="b-text">Добавьте приложение на экран «Домой» (кнопка «Поделиться» → «На экран Домой») и откройте его оттуда. В обычной вкладке браузера iPhone не присылает уведомления — но план на день работает и так.</div></div>
      </div>`;
    }
    if (perm === "granted") {
      return `<div class="banner info" style="margin:0 0 14px"><span class="b-ico">✅</span>
        <div><div class="b-title">Уведомления включены</div>
        <div class="b-text">Напоминания придут в заданное время. Держите приложение на экране «Домой» — iPhone может задерживать фоновые уведомления.</div></div></div>`;
    }
    if (perm === "denied") {
      return `<div class="banner fear" style="margin:0 0 14px"><span class="b-ico">🔕</span>
        <div><div class="b-title">Уведомления выключены</div>
        <div class="b-text">Включите их в Настройках телефона → «Путь лапок» → Уведомления.</div></div></div>`;
    }
    return `<button class="btn primary" id="rm-allow" style="width:100%;margin-bottom:14px">Разрешить уведомления</button>`;
  }

  function healthEvents(s) {
    if (!s.dog.dob) return [];
    const dob = new Date(s.dog.dob);
    const ev = [];
    const add = (weeks, label) => ev.push({ date: new Date(dob.getTime() + weeks * 7 * 86400000), label });
    add(6, "1-я вакцинация"); add(9, "2-я вакцинация"); add(12, "3-я вакцинация + бешенство");
    add(52, "Ежегодная ревакцинация");
    for (let mo = 3; mo <= 24; mo += 3) add(Math.round(mo * 4.345), `Дегельминтизация (${mo} мес)`);
    return ev.filter(e => e.date >= new Date()).sort((a, b) => a.date - b.date).slice(0, 4);
  }

  function render(root) {
    const s = State.get();
    const items = (s.reminders && s.reminders.items) || [];
    const health = healthEvents(s);

    const wrap = document.createElement("section");
    wrap.className = "screen reminders";
    wrap.innerHTML = `
      <header class="page-head">
        <h1>Напоминания</h1>
        <p>Тренировка, прогулка, кормление, туалет. Время можно менять, лишнее — выключить.</p>
      </header>
      ${statusBanner()}
      <div class="reminder-list">
        ${items.map(r => `
          <div class="reminder-row" data-id="${r.id}">
            <span class="rr-ico">${r.ico || "⏰"}</span>
            <div class="rr-body">
              <div class="rr-label">${Screens.escapeHtml(r.label)}</div>
            </div>
            <input type="time" class="rr-time" value="${r.time}" />
            <button class="rr-toggle ${r.enabled ? "on" : ""}" aria-label="Вкл/выкл"></button>
            ${r.id.startsWith("rc-") ? `<button class="rr-del" aria-label="Удалить">×</button>` : ""}
          </div>`).join("")}
      </div>
      <button class="help-card" id="rm-add" style="margin-top:12px">
        <span class="hc-ico">➕</span>
        <div class="hc-body"><div class="hc-title">Добавить своё напоминание</div>
        <div class="hc-sub">Например, «таблетка от клещей» или «нюхо-игра»</div></div>
        <span class="hc-arrow">›</span>
      </button>

      ${health.length ? `
        <div class="block-head" style="margin:20px 4px 10px"><h2 style="font-size:17px">Здоровье — впереди</h2></div>
        <div class="profile-card">
          ${health.map(e => `<div class="pr-row"><span class="pr-key">${e.date.toLocaleDateString("ru-RU")}</span><span class="pr-val">${e.label}</span></div>`).join("")}
        </div>
        <p style="font-size:12px;color:var(--ink-3);margin:8px 4px 0">Даты ориентировочные, по дате рождения. Точное расписание — у ветеринара.</p>
      ` : ""}
    `;

    const allow = wrap.querySelector("#rm-allow");
    if (allow) allow.addEventListener("click", async () => {
      await Reminders.requestPermission();
      Reminders.scheduleToday();
      App.go("reminders");
    });

    wrap.querySelectorAll(".reminder-row").forEach(row => {
      const id = row.dataset.id;
      row.querySelector(".rr-time").addEventListener("change", e => {
        State.update(st => { const r = st.reminders.items.find(x => x.id === id); if (r) r.time = e.target.value; });
        Reminders.scheduleToday();
      });
      row.querySelector(".rr-toggle").addEventListener("click", () => {
        State.update(st => { const r = st.reminders.items.find(x => x.id === id); if (r) r.enabled = !r.enabled; });
        Reminders.scheduleToday();
        App.go("reminders");
      });
      const del = row.querySelector(".rr-del");
      if (del) del.addEventListener("click", () => {
        State.update(st => { st.reminders.items = st.reminders.items.filter(x => x.id !== id); });
        App.go("reminders");
      });
    });

    wrap.querySelector("#rm-add").addEventListener("click", addCustom);
    root.replaceChildren(wrap);
  }

  function addCustom() {
    modalRoot().innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Закрыть">×</button>
      <h2>Своё напоминание</h2>
      <div class="field"><label>Название</label><input type="text" id="rc-label" placeholder="например, таблетка от клещей" /></div>
      <div class="field" style="margin-top:10px"><label>Время</label><input type="time" id="rc-time" value="12:00" /></div>
      <div class="modal-actions">
        <button class="btn outline" id="rc-cancel">Отмена</button>
        <button class="btn primary" id="rc-save">Добавить</button>
      </div></div></div>`;
    const back = modalRoot().querySelector(".modal-backdrop");
    back.addEventListener("click", e => { if (e.target === back) closeModal(); });
    modalRoot().querySelector(".modal-close").addEventListener("click", closeModal);
    modalRoot().querySelector("#rc-cancel").addEventListener("click", closeModal);
    modalRoot().querySelector("#rc-save").addEventListener("click", () => {
      const label = modalRoot().querySelector("#rc-label").value.trim();
      const time = modalRoot().querySelector("#rc-time").value || "12:00";
      if (!label) { App.toast("Введите название"); return; }
      State.update(st => {
        if (!st.reminders) st.reminders = { items: [], done: {} };
        st.reminders.items.push({ id: "rc-" + Date.now(), label, ico: "⏰", time, enabled: true });
      });
      Reminders.scheduleToday();
      closeModal();
      App.go("reminders");
    });
  }

  return { render };
})();
