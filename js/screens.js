// Pawpath — рендер экранов: Home, Lessons, Diary, Profile.

const Screens = (() => {

  function tplClone(id) {
    const tpl = document.getElementById(id);
    return tpl.content.firstElementChild.cloneNode(true);
  }

  // ===================== HOME =====================
  function renderHome(root) {
    const s = State.get();
    const node = tplClone("tpl-main");

    // Шапка
    const dogName = node.querySelector(".dog-name");
    const dogSub = node.querySelector(".dog-sub");
    dogName.textContent = s.dog.name || "Без имени";
    if (s.dog.photo) {
      const av = node.querySelector(".dog-avatar");
      av.classList.add("has-photo");
      av.style.backgroundImage = `url(${s.dog.photo})`;
    }
    const stage = currentStage(s);
    const breedLabel = s.dog.breedName || "—";
    dogSub.textContent = `${humanAge(s.dog.dob)} · ${breedLabel} · ${stage.title}`;

    // Тема — кнопка
    node.querySelector('[data-action="theme"]').addEventListener("click", () => {
      const newTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = newTheme;
      State.update(st => st.theme = newTheme);
    });

    // Banner: страховой период или подсказка
    const banner = node.querySelector(".banner-slot");
    const fp = activeFearPeriod(s);
    const isBrachy = hasBreedTag(s, "brachycephalic");
    if (fp) {
      banner.innerHTML = `
        <div class="banner fear">
          <span class="b-ico">⚠️</span>
          <div>
            <div class="b-title">${fp.title} (${fp.range})</div>
            <div class="b-text">${fp.advice}</div>
          </div>
        </div>`;
    } else if (isBrachy) {
      banner.innerHTML = `
        <div class="banner fear">
          <span class="b-ico">🌡</span>
          <div>
            <div class="b-title">Брахицефал — особый режим</div>
            <div class="b-text">Прогулки рано утром и поздно вечером. При +22°C и выше избегать прямого солнца. Только шлейка. Сессии 3–5 минут, паузы каждые 5–10 минут на улице.</div>
          </div>
        </div>`;
    } else {
      const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
      banner.innerHTML = `
        <div class="banner info">
          <span class="b-ico">💡</span>
          <div>
            <div class="b-title">Совет дня</div>
            <div class="b-text">${tip}</div>
          </div>
        </div>`;
    }

    // Серия тренировок (streak)
    const streak = trainingStreak(s);
    const longest = longestStreak(s);
    const streakEl = document.createElement("div");
    streakEl.className = "streak-card" + (streak > 0 ? " lit" : "");
    streakEl.innerHTML = `
      <div class="streak-flame">${streak > 0 ? "🔥" : "🌱"}</div>
      <div class="streak-body">
        <div class="streak-num">${streak} ${dayWord(streak)} подряд</div>
        <div class="streak-sub">${streak > 0 ? "Так держать!" : "Сделайте любое занятие сегодня"} · рекорд ${longest} ${dayWord(longest)}</div>
      </div>`;
    banner.after(streakEl);

    // Напоминания на сегодня
    const reminders = (typeof Reminders !== "undefined") ? Reminders.todayList(s) : [];
    if (reminders.length) {
      const rmEl = document.createElement("section");
      rmEl.className = "block";
      rmEl.innerHTML = `
        <div class="block-head"><h2>Напоминания</h2>
          <span class="block-sub" data-go="reminders" style="cursor:pointer">настроить ›</span></div>
        <div class="rm-today">
          ${reminders.map(r => `<div class="rm-chip"><span>${r.ico}</span> ${escapeHtml(r.label)} <b>${r.time}</b></div>`).join("")}
        </div>`;
      rmEl.querySelector("[data-go]").addEventListener("click", () => App.go("reminders"));
      streakEl.after(rmEl);
    }

    // Сегодняшние задачи
    const tasks = buildTodayTasks(s);
    const taskEl = node.querySelector("#today-tasks");
    const progressEl = node.querySelector("#today-progress");
    const totalMin = tasks.reduce((a, l) => a + (l.duration || 5), 0);
    const doneCount = tasks.filter(l => s.todayDone[l.id]).length;
    progressEl.textContent = `${doneCount}/${tasks.length} · ~${totalMin} мин`;

    if (!tasks.length) {
      taskEl.innerHTML = `<div class="empty">Нет уроков для текущей стадии. Откройте «Уроки».</div>`;
    } else {
      tasks.forEach(l => {
        const t = document.createElement("div");
        t.className = "task" + (s.todayDone[l.id] ? " done" : "");
        const cat = CATEGORIES.find(c => c.id === l.category);
        t.innerHTML = `
          <button class="check" aria-label="Отметить"></button>
          <div class="t-body">
            <div class="t-title">${l.title}</div>
            <div class="t-meta">⏱ ${l.duration} мин · ${cat?.ico || ""} ${cat?.label || ""}</div>
          </div>
        `;
        t.querySelector(".check").addEventListener("click", (e) => {
          e.stopPropagation();
          State.update(st => {
            st.todayDone[l.id] = !st.todayDone[l.id];
            if (st.todayDone[l.id]) {
              st.completedLessons[l.id] = { date: new Date().toISOString(), rating: 0 };
            }
          });
          if (State.get().todayDone[l.id]) markActivityToday();
          App.toast(s.todayDone[l.id] ? "Снято" : "Готово!");
          App.render();
        });
        t.addEventListener("click", () => Modals.openLesson(l));
        taskEl.appendChild(t);
      });
    }

    // ===== Ваш план обучения (по реальным навыкам собаки) =====
    const plan = (typeof trainingPlan !== "undefined") ? trainingPlan(s) : [];
    const pb = document.createElement("section");
    pb.className = "block";
    if (plan.length) {
      const top = plan.slice(0, 3);
      pb.innerHTML = `
        <div class="block-head"><h2>Ваш план обучения</h2>
          <span class="block-sub" data-go="commands" style="cursor:pointer">все команды ›</span></div>
        <div class="reinforce-list">
          ${top.map(t => `
            <div class="reinforce" data-id="${t.id}" data-idx="${t.nextIdx}" data-kind="${t.kind}">
              <div class="rf-art">${CommandArt.svg(t.pose)}</div>
              <div class="rf-body">
                <div class="rf-title">${escapeHtml(t.title)}</div>
                <div class="rf-sub">${escapeHtml(t.label)}</div>
              </div>
              <button class="rf-done">${t.kind === "learn" ? "Начать" : "Сделали"}</button>
            </div>`).join("")}
        </div>`;
      pb.querySelector("[data-go]").addEventListener("click", () => App.go("commands"));
      pb.querySelectorAll(".reinforce").forEach(el => {
        const id = el.dataset.id, kind = el.dataset.kind, idx = parseInt(el.dataset.idx, 10);
        const openCard = () => CommandsScreen.open(COMMANDS.find(c => c.id === id));
        el.querySelector(".rf-art").addEventListener("click", openCard);
        el.querySelector(".rf-body").addEventListener("click", openCard);
        el.querySelector(".rf-done").addEventListener("click", () => {
          if (kind === "learn") { openCard(); return; }
          State.update(st => {
            if (!st.commandLevels) st.commandLevels = {};
            if (!st.commandLevels[id]) st.commandLevels[id] = [false, false, false, false];
            if (idx >= 0) st.commandLevels[id][idx] = true;
          });
          markActivityToday();
          App.toast("Молодец! 🎯");
          App.render();
        });
      });
    } else {
      pb.innerHTML = `<div class="all-done">🎉 Собака знает все команды из приложения. Отличная работа!</div>`;
    }
    taskEl.closest(".block").before(pb);

    // Quick actions
    node.querySelectorAll(".quick").forEach(b => {
      b.addEventListener("click", () => App.go(b.dataset.go));
    });

    // Прогресс по категориям
    const grid = node.querySelector("#progress-grid");
    const cats = categoryProgress(s);
    Object.entries(cats).forEach(([id, c]) => {
      const div = document.createElement("div");
      div.className = "progress-item";
      div.innerHTML = `
        <div class="pi-head"><span>${c.ico} ${c.label}</span><span>${c.pct}%</span></div>
        <div class="pi-bar"><div class="pi-fill" style="width:${c.pct}%"></div></div>
      `;
      grid.appendChild(div);
    });

    // Stage card
    const sCard = node.querySelector("#stage-card");
    const sp = Math.round(stageProgress(s, stage.id) * 100);
    sCard.innerHTML = `
      <h3>Стадия ${stage.id}. ${stage.title}</h3>
      <p>${stage.range} · ${stage.summary}</p>
      <div class="stage-progress"><div class="fill" style="width:${sp}%"></div></div>
      <p style="margin-top:8px;font-size:13px;color:var(--ink-3)">Освоено: ${sp}%</p>
    `;

    // Блок помощи с поведением
    const helpBlock = document.createElement("section");
    helpBlock.className = "block";
    helpBlock.innerHTML = `
      <button class="help-card" data-go="behavior">
        <span class="hc-ico">🆘</span>
        <div class="hc-body">
          <div class="hc-title">Что-то идёт не так?</div>
          <div class="hc-sub">Лай, прыжки, тянет поводок, боится один — гуманные решения частых проблем</div>
        </div>
        <span class="hc-arrow">›</span>
      </button>`;
    helpBlock.querySelector(".help-card").addEventListener("click", () => App.go("behavior"));
    node.appendChild(helpBlock);

    root.replaceChildren(node);
  }

  // ===================== LESSONS =====================
  function renderLessons(root) {
    const s = State.get();
    const node = tplClone("tpl-lessons");
    const tabsEl = node.querySelector("#stage-tabs");
    const listEl = node.querySelector("#lessons-list");

    let activeStageId = currentStage(s).id;

    function renderTabs() {
      tabsEl.innerHTML = "";
      let activeBtn = null;
      STAGES.forEach(st => {
        const unlocked = isStageUnlocked(s, st.id);
        const b = document.createElement("button");
        b.className = "stage-tab" + (st.id === activeStageId ? " active" : "") + (!unlocked ? " locked" : "");
        b.innerHTML = `${st.id}. ${st.title}`;
        b.addEventListener("click", () => {
          if (!unlocked) {
            App.toast("Освойте 80% предыдущей стадии или дождитесь возраста");
            return;
          }
          activeStageId = st.id;
          renderTabs();
          renderList();
        });
        tabsEl.appendChild(b);
        if (st.id === activeStageId) activeBtn = b;
      });
      if (activeBtn) {
        requestAnimationFrame(() => activeBtn.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" }));
      }
    }

    function renderList() {
      listEl.innerHTML = "";
      const list = lessonsForStage(activeStageId);
      if (!list.length) {
        listEl.innerHTML = `<div class="empty">В этой стадии пока нет уроков.</div>`;
        return;
      }
      list.forEach(l => {
        const div = document.createElement("div");
        const done = !!s.completedLessons[l.id];
        div.className = "lesson" + (done ? " done" : "");
        const cat = CATEGORIES.find(c => c.id === l.category);
        div.innerHTML = `
          <div class="l-row">
            <div>
              <div class="l-title">${l.title}</div>
              <div class="l-meta">
                <span class="l-cat">${cat?.ico || ""} ${cat?.label || ""}</span>
                <span>⏱ ${l.duration} мин</span>
              </div>
            </div>
            <span style="font-size:20px;color:var(--ink-3)">›</span>
          </div>
        `;
        div.addEventListener("click", () => Modals.openLesson(l));
        listEl.appendChild(div);
      });
    }

    renderTabs();
    renderList();
    root.replaceChildren(node);
  }

  // ===================== DIARY =====================
  function renderDiary(root) {
    const s = State.get();
    const node = tplClone("tpl-diary");

    // Сводка
    const summary = node.querySelector("#diary-summary");
    const completedCount = Object.keys(s.completedLessons).length;
    const sessionsCount = s.diary.length;
    const last7 = s.diary.filter(d => Date.now() - new Date(d.date).getTime() < 7 * 86400000).length;
    summary.innerHTML = `
      <div><div class="ds-num">${completedCount}</div><div class="ds-lbl">уроков пройдено</div></div>
      <div><div class="ds-num">${sessionsCount}</div><div class="ds-lbl">записей в дневнике</div></div>
      <div><div class="ds-num">${last7}</div><div class="ds-lbl">за 7 дней</div></div>
    `;

    node.querySelector('[data-action="add-entry"]').addEventListener("click", () => Modals.addDiary());

    const log = node.querySelector("#diary-log");
    if (!s.diary.length) {
      log.innerHTML = `<div class="empty">Дневник пуст. Записывайте короткие заметки после прогулок и сессий.</div>`;
    } else {
      [...s.diary].reverse().forEach(e => {
        const div = document.createElement("div");
        div.className = "diary-entry";
        const stars = "★".repeat(e.rating || 0) + "☆".repeat(5 - (e.rating || 0));
        const lessonInfo = e.lessonId ? ` · ${LESSONS.find(l => l.id === e.lessonId)?.title || ""}` : "";
        div.innerHTML = `
          <div class="de-head">
            <span>${shortDate(e.date)}${lessonInfo}</span>
            <span class="de-rating"><span class="star">${stars}</span></span>
          </div>
          <div class="de-text">${escapeHtml(e.text || "")}</div>
          ${e.photo ? `<img class="de-photo" src="${e.photo}" alt="" loading="lazy" />` : ""}
        `;
        log.appendChild(div);
      });
    }

    root.replaceChildren(node);
  }

  // ===================== PROFILE =====================
  function renderProfile(root) {
    const s = State.get();
    const node = tplClone("tpl-profile");
    const body = node.querySelector("#profile-body");

    const group = getGroupById(s.dog.breedGroup);
    const stage = currentStage(s);

    body.innerHTML = `
      <div class="profile-hero">
        <div class="profile-avatar ${s.dog.photo ? "has-photo" : ""}" ${s.dog.photo ? `style="background-image:url(${s.dog.photo})"` : ""}></div>
        <div class="profile-hero-name">${escapeHtml(s.dog.name || "—")}</div>
        <button class="btn outline" id="edit-profile">Изменить профиль</button>
      </div>
      <div class="profile-card">
        <div class="pr-row"><span class="pr-key">Кличка</span><span class="pr-val">${escapeHtml(s.dog.name || "—")}</span></div>
        ${s.dog.passportName ? `<div class="pr-row"><span class="pr-key">Имя по паспорту</span><span class="pr-val">${escapeHtml(s.dog.passportName)}</span></div>` : ""}
        <div class="pr-row"><span class="pr-key">Пол</span><span class="pr-val">${s.dog.sex === "male" ? "Кобель" : "Сука"}</span></div>
        <div class="pr-row"><span class="pr-key">Дата рождения</span><span class="pr-val">${s.dog.dob ? new Date(s.dog.dob).toLocaleDateString("ru-RU") : "—"}</span></div>
        <div class="pr-row"><span class="pr-key">Возраст</span><span class="pr-val">${humanAge(s.dog.dob)}</span></div>
        <div class="pr-row"><span class="pr-key">Порода</span><span class="pr-val">${escapeHtml(s.dog.breedName || "—")}</span></div>
        <div class="pr-row"><span class="pr-key">Группа FCI</span><span class="pr-val">${group.fci} · ${group.title}</span></div>
        <div class="pr-row"><span class="pr-key">Текущая стадия</span><span class="pr-val">${stage.id}. ${stage.title}</span></div>
        <div class="pr-row"><span class="pr-key">Опыт владельца</span><span class="pr-val">${experienceLabel(s.dog.experience)}</span></div>
        <div class="pr-row"><span class="pr-key">Цели</span><span class="pr-val">${(s.dog.goals||[]).map(goalLabel).join(", ") || "—"}</span></div>
      </div>

      <div class="block-head" style="margin-top:6px"><h2 style="font-size:17px">Достижения</h2>
        <span class="block-sub">${ACHIEVEMENTS.filter(a => a.check(s)).length} / ${ACHIEVEMENTS.length}</span></div>
      <div class="badge-grid">
        ${ACHIEVEMENTS.map(a => {
          const got = a.check(s);
          return `<div class="badge ${got ? "got" : ""}" title="${escapeHtml(a.desc)}">
            <span class="bd-ico">${a.ico}</span>
            <span class="bd-title">${escapeHtml(a.title)}</span>
            <span class="bd-desc">${escapeHtml(a.desc)}</span>
          </div>`;
        }).join("")}
      </div>

      <button class="help-card" id="open-method" style="margin-top:16px">
        <span class="hc-ico">📚</span>
        <div class="hc-body">
          <div class="hc-title">На чём основан «Путь лапок»</div>
          <div class="hc-sub">Позитивное подкрепление, LIMA, AVSAB, приватность</div>
        </div>
        <span class="hc-arrow">›</span>
      </button>
    `;

    body.querySelector("#open-method").addEventListener("click", () => Modals.openMethodology());
    body.querySelector("#edit-profile").addEventListener("click", () => Modals.openEditProfile());

    node.querySelector('[data-action="reset"]').addEventListener("click", () => {
      Modals.confirm("Сбросить все данные?", "Это удалит профиль собаки и весь прогресс.", () => {
        State.reset();
        document.documentElement.dataset.theme = "light";
        App.start();
      });
    });
    node.querySelector('[data-action="export"]').addEventListener("click", () => {
      const data = JSON.stringify(State.get(), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `put-lapok-${(s.dog.name || "dog").replace(/\s+/g, "-")}-${todayKey()}.json`;
      a.click(); URL.revokeObjectURL(url);
      App.toast("Копия сохранена");
    });

    node.querySelector('[data-action="import"]').addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "application/json,.json";
      inp.addEventListener("change", () => {
        const file = inp.files && inp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          let data;
          try { data = JSON.parse(e.target.result); }
          catch (_) { App.toast("Файл повреждён или не тот формат"); return; }
          if (!data || typeof data !== "object" || !data.dog) {
            App.toast("Это не похоже на копию «Путь лапок»"); return;
          }
          const name = data.dog && data.dog.name ? ` (${data.dog.name})` : "";
          Modals.confirm("Восстановить данные?",
            `Текущий прогресс будет заменён данными из файла${name}. Отменить это потом нельзя.`,
            () => {
              const ok = State.replaceAll(data);
              if (!ok) { App.toast("Не удалось сохранить — мало места на устройстве"); return; }
              document.documentElement.dataset.theme = State.get().theme === "dark" ? "dark" : "light";
              App.toast("Данные восстановлены 🐾");
              App.go("home");
            });
        };
        reader.onerror = () => App.toast("Не удалось прочитать файл");
        reader.readAsText(file);
      });
      inp.click();
    });

    root.replaceChildren(node);
  }

  // ===================== TOOLS =====================
  function renderTools(root) {
    const node = tplClone("tpl-tools");
    node.querySelectorAll("[data-go]").forEach(b => {
      b.addEventListener("click", () => App.go(b.dataset.go));
    });
    root.replaceChildren(node);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function dayWord(n) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return "дней";
    if (b === 1) return "день";
    if (b >= 2 && b <= 4) return "дня";
    return "дней";
  }
  function experienceLabel(e) {
    return { first: "Первая собака", second: "Вторая собака", expert: "Опытный" }[e] || e;
  }
  function goalLabel(g) {
    return ({
      obedience: "Базовое послушание",
      sport: "Спорт",
      city: "Городская жизнь",
      esa: "ESA / помощник",
      protection: "Защита",
      show: "Выставки",
    })[g] || g;
  }

  return { renderHome, renderLessons, renderDiary, renderProfile, renderTools, escapeHtml };
})();
