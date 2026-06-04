// Pawpath — точка входа: онбординг, роутинг, общее.

const App = (() => {
  let route = "home";

  function start() {
    const s = State.get();
    document.documentElement.dataset.theme = s.theme === "dark" ? "dark" : "light";
    if (!s.onboarded) {
      document.getElementById("tabbar").classList.add("hidden");
      Onboarding.run();
    } else {
      if (typeof Reminders !== "undefined") Reminders.scheduleToday();
      go("home");
    }
  }

  function render() {
    const s = State.get();
    if (!s.onboarded) { start(); return; }
    document.getElementById("tabbar").classList.remove("hidden");
    const root = document.getElementById("app");
    switch (route) {
      case "home":    Screens.renderHome(root);    break;
      case "lessons": Screens.renderLessons(root); break;
      case "commands": CommandsScreen.render(root); break;
      case "behavior": BehaviorScreen.render(root); break;
      case "growth":   GrowthScreen.render(root); break;
      case "reminders": RemindersScreen.render(root); break;
      case "diary":   Screens.renderDiary(root);   break;
      case "tools":   Screens.renderTools(root);   break;
      case "profile": Screens.renderProfile(root); break;
      case "clicker": Screens.renderTools(root); Modals.openClicker(); break;
      case "whistle": Screens.renderTools(root); Modals.openWhistle(); break;
      case "timer":   Screens.renderTools(root); Modals.openTimer(); break;
      case "social":  Screens.renderTools(root); Modals.openSocialization(); break;
      case "health":  Screens.renderTools(root); Modals.openHealth(); break;
      case "breed":   Screens.renderTools(root); Modals.openBreedProfile(); break;
      case "sounds":  Screens.renderTools(root); Modals.openSounds(); break;
      case "food":    Screens.renderTools(root); Modals.openFood(); break;
      case "methodology": Screens.renderTools(root); Modals.openMethodology(); break;
      default: Screens.renderHome(root);
    }
    // Tabbar активный
    document.querySelectorAll("#tabbar .tab").forEach(t => {
      const goId = t.dataset.go;
      const baseRoute = ["clicker","whistle","timer","social","health","breed","sounds","food","methodology","behavior","growth","reminders"].includes(route) ? "tools" : route;
      t.classList.toggle("active", goId === baseRoute);
    });
  }

  function go(r) {
    if (typeof Modals !== "undefined") Modals.close();  // закрыть модалку и заглушить звук при переходе
    route = r;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function toast(text) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  function bindTabbar() {
    document.querySelectorAll("#tabbar .tab").forEach(t => {
      t.addEventListener("click", () => go(t.dataset.go));
    });
  }

  return { start, render, go, toast, bindTabbar };
})();

// =============================== WHEEL PICKER (барабан выбора даты) ===============================
const WheelPicker = (() => {
  const ITEM_H = 38;
  const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля",
                  "августа","сентября","октября","ноября","декабря"];
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const pad = n => String(n).padStart(2, "0");
  const toIso = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

  function highlight(el, i) {
    el.querySelectorAll(".wp-item").forEach(x => x.classList.toggle("sel", +x.dataset.i === i));
  }

  function buildCol(el, labels, sel, onPick) {
    el.innerHTML = `<div class="wp-pad"></div>` +
      labels.map((t, i) => `<div class="wp-item" data-i="${i}">${t}</div>`).join("") +
      `<div class="wp-pad"></div>`;
    const start = Math.max(0, Math.min(labels.length - 1, sel));
    const setTop = top => {                 // программная прокрутка не должна считаться выбором пользователя
      el._mute = true;
      el.scrollTop = top;
      requestAnimationFrame(() => { el._mute = false; });
    };
    highlight(el, start);
    setTop(start * ITEM_H);
    let t;
    el.onscroll = () => {
      highlight(el, Math.round(el.scrollTop / ITEM_H));
      if (el._mute) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const i = Math.max(0, Math.min(labels.length - 1, Math.round(el.scrollTop / ITEM_H)));
        el._mute = true;
        el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
        setTimeout(() => { el._mute = false; }, 260);
        highlight(el, i);
        onPick(i);
      }, 120);
    };
    el.querySelectorAll(".wp-item").forEach(it => {
      it.onclick = () => {
        const i = +it.dataset.i;
        el._mute = true;
        el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
        setTimeout(() => { el._mute = false; }, 260);
        highlight(el, i);
        onPick(i);
      };
    });
  }

  // mountDate(container, {value, min, max, onChange}) — value/min/max: Date, onChange(Date, isoString)
  function mountDate(container, opts) {
    const min = opts.min, max = opts.max;
    let cur = opts.value ? new Date(opts.value) : new Date(max);
    if (cur < min) cur = new Date(min);
    if (cur > max) cur = new Date(max);
    let y = cur.getFullYear(), m = cur.getMonth(), d = cur.getDate();

    container.classList.add("wheel");
    container.innerHTML =
      `<div class="wp-band"></div>` +
      `<div class="wp-col wp-day"></div><div class="wp-col wp-mon"></div><div class="wp-col wp-year"></div>`;
    const colD = container.querySelector(".wp-day");
    const colM = container.querySelector(".wp-mon");
    const colY = container.querySelector(".wp-year");

    const emit = () => opts.onChange(new Date(y, m, d), toIso(new Date(y, m, d)));

    const years = () => {
      const a = []; for (let yy = min.getFullYear(); yy <= max.getFullYear(); yy++) a.push(yy); return a;
    };
    const monthsFor = yy => {
      const lo = yy === min.getFullYear() ? min.getMonth() : 0;
      const hi = yy === max.getFullYear() ? max.getMonth() : 11;
      const a = []; for (let mm = lo; mm <= hi; mm++) a.push(mm); return a;
    };
    const daysFor = (yy, mm) => {
      const lo = (yy === min.getFullYear() && mm === min.getMonth()) ? min.getDate() : 1;
      const hi = (yy === max.getFullYear() && mm === max.getMonth()) ? max.getDate() : daysIn(yy, mm);
      const a = []; for (let dd = lo; dd <= hi; dd++) a.push(dd); return a;
    };

    function rebuildDay() {
      const ds = daysFor(y, m);
      d = Math.max(ds[0], Math.min(d, ds[ds.length - 1]));
      buildCol(colD, ds.map(String), ds.indexOf(d), i => { d = ds[i]; emit(); });
    }
    function rebuildMonth() {
      const ms = monthsFor(y);
      if (!ms.includes(m)) m = ms[ms.length - 1];
      buildCol(colM, ms.map(x => MONTHS[x]), ms.indexOf(m), i => { m = ms[i]; rebuildDay(); emit(); });
    }
    function rebuildYear() {
      const ys = years();
      buildCol(colY, ys.map(String), ys.indexOf(y), i => { y = ys[i]; rebuildMonth(); rebuildDay(); emit(); });
    }
    // блок ещё не вставлен в DOM на этом шаге render() — позиционируем после вставки
    requestAnimationFrame(() => { rebuildYear(); rebuildMonth(); rebuildDay(); emit(); });
  }

  return { mountDate };
})();

// =============================== ONBOARDING ===============================

const Onboarding = (() => {
  let step = 0;
  const totalSteps = 10;
  const draft = {
    isFuture: false,
    breedName: "", breedGroup: "",
    dob: "", name: "", passportName: "", sex: "male", neuteredAt: null,
    photo: "", weight: "",
    experience: "first",
    goals: [],
    livingPlace: "apartment", yardAccess: false, walkTimePerDay: 60,
    kids: false, otherPets: false,
    health: { vaccinated: false, notes: "" },
    temperament: { arousal: 2, preyDrive: 2, sensitivity: 2, persistence: 2 },
    commandSkill: {},  // { commandId: 'none'|'low'|'mid'|'high' } — насколько собака знает команду
  };

  function run() {
    step = 0;
    render();
  }

  function render() {
    const root = document.getElementById("app");
    const node = document.getElementById("tpl-onboarding").content.firstElementChild.cloneNode(true);

    const dots = node.querySelector(".step-dots");
    for (let i = 0; i < totalSteps; i++) {
      const d = document.createElement("div");
      d.className = "dot" + (i === step ? " active" : "");
      dots.appendChild(d);
    }

    const body = node.querySelector(".onb-body");
    const back = node.querySelector('[data-action="back"]');
    const next = node.querySelector('[data-action="next"]');
    if (step === 0) back.style.visibility = "hidden";

    let canProceed = true;

    switch (step) {
      case 0: { // Welcome / есть/планирую
        body.innerHTML = `
          <h1>Привет! Это «Путь лапок» 🐾</h1>
          <p class="lead">Помогу вырастить послушную и счастливую собаку. Простые занятия по 5–10 минут в день — без криков и наказаний.</p>
          <p class="lead" style="margin-top:-6px">Для начала скажите: собака уже есть?</p>
          <div class="choice-grid" style="margin-top:6px">
            <button class="choice ${!draft.isFuture ? 'active' : ''}" data-set="have">
              <span class="ico">🐶</span><strong>У меня уже есть собака</strong>
              <small>Сразу подберём план под возраст и породу</small>
            </button>
            <button class="choice ${draft.isFuture ? 'active' : ''}" data-set="future">
              <span class="ico">🌱</span><strong>Планирую завести</strong>
              <small>Подготовим к появлению щенка</small>
            </button>
          </div>
        `;
        body.querySelectorAll(".choice").forEach(c => {
          c.addEventListener("click", () => {
            draft.isFuture = c.dataset.set === "future";
            body.querySelectorAll(".choice").forEach(x => x.classList.remove("active"));
            c.classList.add("active");
          });
        });
        break;
      }

      case 1: { // Порода
        body.innerHTML = `
          <h1>Какая порода?</h1>
          <p class="lead">Поиск среди 70+ популярных пород. Если метис — выберите пункт «Метис» или ближайшую породу.</p>
          <div class="field">
            <input type="text" id="breed-input" placeholder="Например: лабрадор" autocomplete="off" value="${Screens.escapeHtml(draft.breedName)}" />
          </div>
          <div class="search-list" id="breed-list"></div>
        `;
        const input = body.querySelector("#breed-input");
        const list = body.querySelector("#breed-list");
        function renderList(filter = "") {
          const f = filter.trim().toLowerCase();
          const matches = BREEDS.filter(b => b.name.toLowerCase().includes(f)).slice(0, 30);
          list.innerHTML = matches.map(b => {
            const g = getGroupById(b.group);
            return `<div class="item ${b.name === draft.breedName ? 'active' : ''}" data-name="${Screens.escapeHtml(b.name)}" data-group="${b.group}">
              <div>${Screens.escapeHtml(b.name)}</div><small>${g.title}</small>
            </div>`;
          }).join("") || `<div class="empty">Ничего не найдено</div>`;
          list.querySelectorAll(".item").forEach(i => {
            i.addEventListener("click", () => {
              draft.breedName = i.dataset.name;
              draft.breedGroup = i.dataset.group;
              input.value = draft.breedName;
              list.querySelectorAll(".item").forEach(x => x.classList.remove("active"));
              i.classList.add("active");
              canProceed = true;                // ← обновляем и флаг, и кнопку
              next.disabled = false;
            });
          });
        }
        renderList();
        input.addEventListener("input", () => {
          renderList(input.value);
          // Поддержка ручного ввода: если текст точно совпал с породой — выбираем её.
          const typed = input.value.trim().toLowerCase();
          const match = BREEDS.find(b => b.name.toLowerCase() === typed);
          if (match) { draft.breedName = match.name; draft.breedGroup = match.group; }
          else { draft.breedName = ""; draft.breedGroup = ""; }
          canProceed = !!draft.breedName;
          next.disabled = !canProceed;
        });
        canProceed = !!draft.breedName;
        break;
      }

      case 2: { // Возраст или старт планирования — барабан выбора даты
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (draft.isFuture) {
          const maxF = new Date(today); maxF.setMonth(maxF.getMonth() + 18);
          const def = new Date(today); def.setMonth(def.getMonth() + 2);
          body.innerHTML = `
            <h1>Когда ждёте щенка?</h1>
            <p class="lead">Крутите барабан и выберите примерную дату. Покажем план подготовки до момента появления.</p>
            <div id="future-wheel"></div>
            <p class="dob-age" id="dob-age"></p>
          `;
          const ageEl = body.querySelector("#dob-age");
          WheelPicker.mountDate(body.querySelector("#future-wheel"), {
            value: draft.dob || def, min: today, max: maxF,
            onChange: (dt, iso) => {
              draft.dob = iso;
              const days = Math.max(0, Math.round((dt - today) / 86400000));
              ageEl.textContent = days <= 0 ? "Уже скоро!" : `Осталось примерно ${days} дн.`;
            }
          });
        } else {
          const minD = new Date(today); minD.setFullYear(today.getFullYear() - 25);
          const def = new Date(today); def.setMonth(def.getMonth() - 4); // ~щенок по умолчанию
          body.innerHTML = `
            <h1>Дата рождения</h1>
            <p class="lead">Крутите колёсики, чтобы выбрать день, месяц и год — так удобнее. Если точную дату не знаете, поставьте приблизительную, позже можно уточнить.</p>
            <div id="dob-wheel"></div>
            <p class="dob-age" id="dob-age"></p>
          `;
          const ageEl = body.querySelector("#dob-age");
          WheelPicker.mountDate(body.querySelector("#dob-wheel"), {
            value: draft.dob || def, min: minD, max: today,
            onChange: (dt, iso) => {
              draft.dob = iso;
              ageEl.innerHTML = `Возраст: <strong>${humanAge(draft.dob)}</strong>`;
              canProceed = true;
              next.disabled = false;
            }
          });
          canProceed = !!draft.dob;
        }
        break;
      }

      case 3: { // Имя и пол
        body.innerHTML = `
          <h1>Имя и фото</h1>
          <p class="lead">Имя будет первой ассоциацией собаки. Фото можно добавить сейчас или позже в профиле.</p>
          <div class="onb-avatar">
            <button type="button" class="avatar-pick ${draft.photo ? "has" : ""}" id="avatar-pick" ${draft.photo ? `style="background-image:url(${draft.photo})"` : ""}>
              ${draft.photo ? `<span class="ap-edit">Изменить</span>` : `<span class="ap-ico">📷</span><small>Добавить фото</small>`}
            </button>
          </div>
          <div class="field">
            <label>Кличка (как зовёте дома)</label>
            <input type="text" id="name" value="${Screens.escapeHtml(draft.name)}" placeholder="${draft.isFuture ? "Можно оставить пустым" : "Например: Рекс"}" />
          </div>
          <div class="field" style="margin-top:10px">
            <label>Имя по паспорту (необязательно)</label>
            <input type="text" id="passport-name" value="${Screens.escapeHtml(draft.passportName)}" placeholder="Например: Rex von Stolzberg" />
          </div>
          <div class="field" style="margin-top:10px">
            <label>Вес, кг (если знаете)</label>
            <input type="number" id="weight" min="0.3" max="120" step="0.1" inputmode="decimal" value="${draft.weight}" placeholder="например, 8.5" />
          </div>
          <div class="field" style="margin-top:10px">
            <label>Пол</label>
            <div class="chips" id="sex">
              <button class="chip ${draft.sex === 'male' ? 'active' : ''}" data-v="male">Кобель</button>
              <button class="chip ${draft.sex === 'female' ? 'active' : ''}" data-v="female">Сука</button>
            </div>
          </div>
        `;
        body.querySelector("#avatar-pick").addEventListener("click", () => {
          PhotoUtil.pickAndCrop({ size: 600 }, (dataUrl) => {
            if (dataUrl) { draft.photo = dataUrl; render(); }
          });
        });
        body.querySelector("#name").addEventListener("input", e => draft.name = e.target.value);
        body.querySelector("#passport-name").addEventListener("input", e => draft.passportName = e.target.value);
        body.querySelector("#weight").addEventListener("input", e => draft.weight = e.target.value);
        body.querySelectorAll("#sex .chip").forEach(c => {
          c.addEventListener("click", () => {
            draft.sex = c.dataset.v;
            body.querySelectorAll("#sex .chip").forEach(x => x.classList.remove("active"));
            c.classList.add("active");
          });
        });
        break;
      }

      case 4: { // Характер собаки — понятные жизненные ситуации
        const Q = [
          { id: "arousal", emoji: "⚡️",
            q: "Как бы вы описали характер собаки?",
            opts: [
              { t: "Спокойная, любит полежать", s: "Редко перевозбуждается" },
              { t: "Золотая середина", s: "Активна, но легко успокаивается" },
              { t: "Неугомонный энерджайзер", s: "Постоянно в движении" },
            ] },
          { id: "preyDrive", emoji: "🐿️",
            q: "Увидела кошку, птицу или летящий мяч — что делает?",
            opts: [
              { t: "Почти не реагирует", s: "" },
              { t: "Заинтересуется, но слушает вас", s: "" },
              { t: "Срывается в погоню", s: "Трудно остановить" },
            ] },
          { id: "sensitivity", emoji: "💗",
            q: "Вы расстроены или сказали строгим голосом. Собака…",
            opts: [
              { t: "Не обращает внимания", s: "«Толстокожая»" },
              { t: "Замечает ваше настроение", s: "" },
              { t: "Сильно переживает, ранимая", s: "Может зажаться" },
            ] },
          { id: "persistence", emoji: "🦴",
            q: "Просите перестать (тянуть, выпрашивать, копать)…",
            opts: [
              { t: "Легко уступает и переключается", s: "" },
              { t: "Когда как", s: "" },
              { t: "Стоит на своём, упрямится", s: "Будет добиваться" },
            ] },
        ];
        body.innerHTML = `
          <h1>Характер собаки</h1>
          <p class="lead">4 простых вопроса о поведении — по ним подберём подход и темп уроков. У каждой собаки они свои, правильных ответов нет 🙂</p>
          ${Q.map(q => `
            <div class="tq-card">
              <div class="tq-title"><span>${q.emoji}</span>${q.q}</div>
              <div class="tq-opts">
                ${q.opts.map((o, i) => `
                  <button class="tq-opt ${draft.temperament[q.id] === i + 1 ? 'active' : ''}" data-q="${q.id}" data-v="${i + 1}">
                    <span class="tq-dot"></span>
                    <span class="tq-txt"><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ""}</span>
                  </button>`).join("")}
              </div>
            </div>
          `).join("")}
        `;
        body.querySelectorAll(".tq-opt").forEach(o => {
          o.addEventListener("click", () => {
            draft.temperament[o.dataset.q] = parseInt(o.dataset.v, 10);
            o.parentElement.querySelectorAll(".tq-opt").forEach(x => x.classList.remove("active"));
            o.classList.add("active");
          });
        });
        break;
      }

      case 5: { // Цели
        const goals = [
          { id: "obedience",  label: "🎯 Базовое послушание" },
          { id: "city",       label: "🏙 Городская жизнь" },
          { id: "sport",      label: "🏆 Спорт" },
          { id: "esa",        label: "🤝 Помощник / ESA" },
          { id: "protection", label: "🛡 Защита" },
          { id: "show",       label: "✨ Выставки" },
        ];
        body.innerHTML = `
          <h1>Цели</h1>
          <p class="lead">Можно выбрать несколько. Это влияет на акценты плана.</p>
          <div class="chips" id="goals">
            ${goals.map(g => `<button class="chip ${draft.goals.includes(g.id) ? 'active' : ''}" data-v="${g.id}">${g.label}</button>`).join("")}
          </div>
        `;
        body.querySelectorAll("#goals .chip").forEach(c => {
          c.addEventListener("click", () => {
            const v = c.dataset.v;
            const idx = draft.goals.indexOf(v);
            if (idx >= 0) draft.goals.splice(idx, 1); else draft.goals.push(v);
            c.classList.toggle("active");
          });
        });
        break;
      }

      case 6: { // Образ жизни
        body.innerHTML = `
          <h1>Образ жизни</h1>
          <p class="lead">Это меняет рекомендации по нагрузке и местам тренировок.</p>
          <div class="field">
            <label>Где живёте?</label>
            <div class="chips" id="live">
              <button class="chip ${draft.livingPlace==='apartment'?'active':''}" data-v="apartment">Квартира</button>
              <button class="chip ${draft.livingPlace==='house'?'active':''}" data-v="house">Дом</button>
            </div>
          </div>
          <div class="field" style="margin-top:8px">
            <label>Двор / огороженная территория</label>
            <div class="chips" id="yard">
              <button class="chip ${draft.yardAccess?'active':''}" data-v="1">Есть</button>
              <button class="chip ${!draft.yardAccess?'active':''}" data-v="0">Нет</button>
            </div>
          </div>
          <div class="field" style="margin-top:8px">
            <label>Время на прогулки в день</label>
            <input type="range" min="20" max="240" step="10" id="walk" value="${draft.walkTimePerDay}" />
            <p style="margin:0;color:var(--ink-2)"><span id="walk-val">${draft.walkTimePerDay}</span> мин/день</p>
          </div>
          <div class="field" style="margin-top:8px">
            <label>В семье есть</label>
            <div class="chips">
              <button class="chip ${draft.kids?'active':''}" id="kids">👶 Дети</button>
              <button class="chip ${draft.otherPets?'active':''}" id="pets">🐾 Другие животные</button>
            </div>
          </div>
        `;
        body.querySelectorAll("#live .chip").forEach(c => {
          c.addEventListener("click", () => {
            draft.livingPlace = c.dataset.v;
            body.querySelectorAll("#live .chip").forEach(x => x.classList.remove("active"));
            c.classList.add("active");
          });
        });
        body.querySelectorAll("#yard .chip").forEach(c => {
          c.addEventListener("click", () => {
            draft.yardAccess = c.dataset.v === "1";
            body.querySelectorAll("#yard .chip").forEach(x => x.classList.remove("active"));
            c.classList.add("active");
          });
        });
        const walk = body.querySelector("#walk");
        const walkVal = body.querySelector("#walk-val");
        walk.addEventListener("input", () => { draft.walkTimePerDay = +walk.value; walkVal.textContent = walk.value; });
        body.querySelector("#kids").addEventListener("click", () => {
          draft.kids = !draft.kids;
          body.querySelector("#kids").classList.toggle("active");
        });
        body.querySelector("#pets").addEventListener("click", () => {
          draft.otherPets = !draft.otherPets;
          body.querySelector("#pets").classList.toggle("active");
        });
        break;
      }

      case 7: { // Опыт
        const opts = [
          { v: "first",  t: "Первая собака", s: "Будем поддерживать на каждом шаге" },
          { v: "second", t: "Уже была", s: "Дадим больше акцент на адаптацию" },
          { v: "expert", t: "Опытный", s: "Минимум объяснений, больше плана" },
        ];
        body.innerHTML = `
          <h1>Ваш опыт</h1>
          <p class="lead">Подстроим тон и глубину уроков.</p>
          <div class="choice-grid" style="grid-template-columns:1fr">
            ${opts.map(o => `
              <button class="choice ${draft.experience === o.v ? 'active' : ''}" data-v="${o.v}" style="flex-direction:column">
                <strong>${o.t}</strong><small>${o.s}</small>
              </button>`).join("")}
          </div>
        `;
        body.querySelectorAll(".choice").forEach(c => {
          c.addEventListener("click", () => {
            draft.experience = c.dataset.v;
            body.querySelectorAll(".choice").forEach(x => x.classList.remove("active"));
            c.classList.add("active");
          });
        });
        break;
      }

      case 8: { // Что собака уже умеет — по уровням
        const LEVELS = [
          { v: "none", t: "Не умеет" },
          { v: "low", t: "Плохо" },
          { v: "mid", t: "Средне" },
          { v: "high", t: "Хорошо" },
        ];
        body.innerHTML = `
          <h1>Что уже умеет ${draft.name ? Screens.escapeHtml(draft.name) : "собака"}?</h1>
          <p class="lead">${draft.isFuture
            ? "Щенка ещё нет — смело пропускайте этот шаг. Потом отметите в разделе «Команды»."
            : "Для каждой команды выберите, насколько хорошо собака её знает. По этому мы составим план: чему учить с нуля, что подтянуть, а что просто повторять."}</p>
          <div class="rate-list">
            ${COMMANDS.map(c => {
              const cur = draft.commandSkill[c.id] || "none";
              return `<div class="rate-row" data-id="${c.id}">
                <div class="rate-head">
                  <span class="rate-art">${CommandArt.media(c)}</span>
                  <span class="rate-name">${Screens.escapeHtml(c.title)}</span>
                </div>
                <div class="rate-opts">
                  ${LEVELS.map(l => `<button type="button" class="rate-opt ${cur === l.v ? "on " + l.v : ""}" data-v="${l.v}">${l.t}</button>`).join("")}
                </div>
              </div>`;
            }).join("")}
          </div>
        `;
        body.querySelectorAll(".rate-row").forEach(row => {
          const id = row.dataset.id;
          row.querySelectorAll(".rate-opt").forEach(b => {
            b.addEventListener("click", () => {
              draft.commandSkill[id] = b.dataset.v;
              row.querySelectorAll(".rate-opt").forEach(x => x.className = "rate-opt");
              b.className = "rate-opt on " + b.dataset.v;
            });
          });
        });
        break;
      }

      case 9: { // Готово — генерация
        const g = getGroupById(draft.breedGroup);
        const tempStage = (function() {
          if (draft.isFuture || !draft.dob) return STAGES[0];
          const w = ageInWeeks(draft.dob);
          for (const st of STAGES) if (w >= st.minWeeks && w < st.maxWeeks) return st;
          return STAGES[STAGES.length - 1];
        })();
        body.innerHTML = `
          <h1>План готов!</h1>
          <p class="lead">Резюме того, что мы поняли о ${draft.name || "вашей собаке"}.</p>
          <div class="profile-card" style="margin-top:8px">
            <div class="pr-row"><span class="pr-key">Порода</span><span class="pr-val">${draft.breedName} (${g.title})</span></div>
            <div class="pr-row"><span class="pr-key">Стадия</span><span class="pr-val">${tempStage.id}. ${tempStage.title}</span></div>
            <div class="pr-row"><span class="pr-key">Возраст</span><span class="pr-val">${draft.isFuture ? "будущий щенок" : humanAge(draft.dob)}</span></div>
            <div class="pr-row"><span class="pr-key">Жизнь</span><span class="pr-val">${draft.livingPlace === "apartment" ? "Квартира" : "Дом"}${draft.yardAccess ? " · с двором" : ""} · ${draft.walkTimePerDay} мин/день</span></div>
            ${(() => {
              const vals = Object.values(draft.commandSkill);
              const knows = vals.filter(v => v === "mid" || v === "high").length;
              const teach = COMMANDS.length - knows;
              return `<div class="pr-row"><span class="pr-key">Уже знает</span><span class="pr-val">${knows} команд · учим ${teach}</span></div>`;
            })()}
          </div>
          <div class="banner info" style="margin-top:14px">
            <span class="b-ico">🌟</span>
            <div>
              <div class="b-title">Наш подход</div>
              <div class="b-text">Учим через похвалу и лакомства, а не через наказания. Спокойно, по-доброму и в радость собаке.</div>
            </div>
          </div>
          <p style="font-size:13px;color:var(--ink-3);margin-top:14px">«Путь лапок» — помощник, а не замена ветеринара или кинолога. Если собака проявляет агрессию или сильно боится — обратитесь к специалисту.</p>
        `;
        next.textContent = "Поехали!";
        break;
      }
    }

    next.disabled = !canProceed;
    if (step !== 9) next.textContent = "Далее";

    back.onclick = () => { if (step > 0) { step--; render(); } };
    next.onclick = () => {
      if (!canProceed) return;
      if (step < totalSteps - 1) { step++; render(); }
      else finalize();
    };

    root.replaceChildren(node);
  }

  function finalize() {
    State.update(s => {
      Object.assign(s.dog, {
        name: draft.name || (draft.isFuture ? "Будущий щенок" : "Друг"),
        passportName: draft.passportName || "",
        sex: draft.sex,
        dob: draft.dob || null,
        photo: draft.photo || null,
        breedName: draft.breedName,
        breedGroup: draft.breedGroup,
        isFuture: draft.isFuture,
        experience: draft.experience,
        goals: draft.goals,
        livingPlace: draft.livingPlace,
        yardAccess: draft.yardAccess,
        walkTimePerDay: draft.walkTimePerDay,
        kids: draft.kids,
        otherPets: draft.otherPets,
        temperament: draft.temperament,
      });
      // По уровню каждой команды строим стартовый план:
      // «Хорошо» — знает и закреплено; «Средне» — знает, надо повторять; «Плохо»/«Не умеет» — учим.
      const nowIso = new Date().toISOString();
      const w0 = parseFloat(draft.weight);
      if (w0 > 0) {
        if (!s.weightLog) s.weightLog = [];
        s.weightLog.push({ id: "w-" + Date.now(), date: nowIso, kg: Math.round(w0 * 10) / 10 });
      }
      if (!s.learnedCommands) s.learnedCommands = {};
      s.commandSkill = Object.assign({}, draft.commandSkill);
      Object.keys(draft.commandSkill).forEach(id => {
        const lv = draft.commandSkill[id];
        const cmd = (typeof COMMANDS !== "undefined") && COMMANDS.find(c => c.id === id);
        if (lv === "high") {
          s.learnedCommands[id] = { date: nowIso, known: true };
          s.commandLevels[id] = [true, true, false, false];
          if (cmd && cmd.lessonId) s.completedLessons[cmd.lessonId] = { date: nowIso, rating: 0, known: true };
        } else if (lv === "mid") {
          s.learnedCommands[id] = { date: nowIso, known: true };
          s.commandLevels[id] = [true, false, false, false];
        }
        // 'low' и 'none' — оставляем для обучения (попадут в «Ваш план обучения»)
      });
      s.onboarded = true;
    });
    App.go("home");
    App.toast(`Добро пожаловать, ${State.get().dog.name}! 🐾`);
  }

  return { run };
})();

// =============================== INIT ===============================
window.addEventListener("DOMContentLoaded", () => {
  App.bindTabbar();
  App.start();
});
