// Pawpath — модалки и инструменты: урок, кликер, свисток, таймер, социализация, здоровье, породный профиль.

const Modals = (() => {
  const root = () => document.getElementById("modal-root");
  let activeKeyHandler = null;   // слушатель клавиш активной модалки (кликер)

  function close() {
    try { AudioEngine.whistleStop(); } catch (e) {}
    try { AudioEngine.desensStop(); } catch (e) {}
    if (activeKeyHandler) { document.removeEventListener("keydown", activeKeyHandler); activeKeyHandler = null; }
    root().innerHTML = "";
  }

  function open(html) {
    root().innerHTML = `
      <div class="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" aria-label="Закрыть">×</button>
          ${html}
        </div>
      </div>`;
    const back = root().querySelector(".modal-backdrop");
    back.addEventListener("click", e => { if (e.target === back) close(); });
    root().querySelector(".modal-close").addEventListener("click", close);
  }

  // ============== УРОК ==============
  function openLesson(lesson) {
    const s = State.get();
    const checks = s.lessonChecks[lesson.id] || lesson.checklist.map(() => false);

    const html = `
      <h2>${lesson.title}</h2>
      <p style="font-size:13px;color:var(--ink-3)">⏱ ${lesson.duration} мин · стадия ${lesson.stage}</p>
      <p>${Screens.escapeHtml(lesson.intro)}</p>
      <h3>Чек-лист</h3>
      <ul class="checklist" id="lesson-checklist">
        ${lesson.checklist.map((item, i) => `
          <li class="${checks[i] ? 'done' : ''}" data-i="${i}">
            <span class="ck"></span><span>${Screens.escapeHtml(item)}</span>
          </li>`).join("")}
      </ul>
      <h3>💡 Совет</h3>
      <p>${Screens.escapeHtml(lesson.tip)}</p>
      <div class="modal-actions">
        <button class="btn outline" id="lesson-note">Заметка в дневник</button>
        <button class="btn primary" id="lesson-done">${s.completedLessons[lesson.id] ? "Отменить выполнение" : "Отметить выполненным"}</button>
      </div>
    `;
    open(html);

    root().querySelectorAll("#lesson-checklist li").forEach(li => {
      li.addEventListener("click", () => {
        const i = parseInt(li.dataset.i, 10);
        State.update(st => {
          if (!st.lessonChecks[lesson.id]) st.lessonChecks[lesson.id] = lesson.checklist.map(() => false);
          st.lessonChecks[lesson.id][i] = !st.lessonChecks[lesson.id][i];
        });
        li.classList.toggle("done");
      });
    });

    root().querySelector("#lesson-done").addEventListener("click", () => {
      const cur = State.get();
      const wasDone = !!cur.completedLessons[lesson.id];
      State.update(st => {
        if (cur.completedLessons[lesson.id]) {
          delete st.completedLessons[lesson.id];
        } else {
          st.completedLessons[lesson.id] = { date: new Date().toISOString(), rating: 0 };
          if (st.todayTaskIds.includes(lesson.id)) st.todayDone[lesson.id] = true;
        }
      });
      if (!wasDone) markActivityToday();
      close();
      App.toast(cur.completedLessons[lesson.id] ? "Снято" : "Урок засчитан 👍");
      App.render();
    });

    root().querySelector("#lesson-note").addEventListener("click", () => {
      addDiary(lesson.id);
    });
  }

  // ============== ДНЕВНИК: ДОБАВИТЬ ==============
  function addDiary(lessonId = null) {
    const html = `
      <h2>Запись в дневник</h2>
      <div class="field">
        <label>Что было сегодня?</label>
        <textarea id="diary-text" rows="4" placeholder="Подзыв на длиннике, отлично. Сильно отвлекался на запахи."></textarea>
      </div>
      <div class="field" style="margin-top:12px">
        <label>Оценка сессии</label>
        <div class="chips" id="diary-rating">
          ${[1,2,3,4,5].map(n => `<button class="chip" data-r="${n}">${n} ★</button>`).join("")}
        </div>
      </div>
      <div class="field" style="margin-top:12px">
        <label>Фото (необязательно)</label>
        <button type="button" class="diary-photo-btn" id="diary-photo"><span>📷</span> Добавить фото</button>
        <div id="diary-photo-prev"></div>
      </div>
      <div class="modal-actions">
        <button class="btn outline" id="diary-cancel">Отмена</button>
        <button class="btn primary" id="diary-save">Сохранить</button>
      </div>
    `;
    open(html);
    let rating = 4;
    let photo = null;
    const prev = root().querySelector("#diary-photo-prev");
    root().querySelector("#diary-photo").addEventListener("click", () => {
      PhotoUtil.pick({ max: 820, quality: 0.6 }, (dataUrl) => {
        if (!dataUrl) return;
        photo = dataUrl;
        prev.innerHTML = `<div class="diary-photo-wrap"><img src="${dataUrl}" alt="" /><button type="button" class="diary-photo-del" id="diary-photo-del">×</button></div>`;
        prev.querySelector("#diary-photo-del").addEventListener("click", () => { photo = null; prev.innerHTML = ""; });
      });
    });
    root().querySelectorAll("#diary-rating .chip").forEach(c => {
      if (parseInt(c.dataset.r, 10) === rating) c.classList.add("active");
      c.addEventListener("click", () => {
        root().querySelectorAll("#diary-rating .chip").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        rating = parseInt(c.dataset.r, 10);
      });
    });
    root().querySelector("#diary-cancel").addEventListener("click", close);
    root().querySelector("#diary-save").addEventListener("click", () => {
      const text = root().querySelector("#diary-text").value.trim();
      if (!text) { App.toast("Напишите хотя бы пару слов"); return; }
      State.update(st => {
        st.diary.push({
          id: "d-" + Date.now(),
          date: new Date().toISOString(),
          text, rating, lessonId, photo,
        });
      });
      markActivityToday();
      close();
      App.toast("Записано");
      App.render();
    });
  }

  // ============== КЛИКЕР ==============
  function openClicker() {
    const presets = ["classic", "soft", "high", "double", "sweep"];
    const labels = { classic: "Classic", soft: "Soft", high: "High", double: "Double", sweep: "Sweep" };
    let active = "classic";
    let counter = 0;

    const html = `
      <h2>Кликер</h2>
      <p>Маркер должен звучать ровно в момент правильного действия. Лакомство — следствие.</p>
      <div class="clicker-stage">
        <div class="clicker-counter" id="cl-count">0</div>
        <div class="clicker-counter-sub">кликов в этой сессии</div>
        <button class="clicker-btn" id="cl-btn">CLICK</button>
        <div class="clicker-sounds">
          ${presets.map(p => `<button class="sound-pill ${p===active?'active':''}" data-p="${p}">${labels[p]}</button>`).join("")}
        </div>
      </div>
    `;
    open(html);

    const btn = root().querySelector("#cl-btn");
    const cnt = root().querySelector("#cl-count");
    btn.addEventListener("click", () => {
      AudioEngine.click(active);
      counter++;
      cnt.textContent = counter;
    });
    root().querySelectorAll(".sound-pill").forEach(p => {
      p.addEventListener("click", () => {
        root().querySelectorAll(".sound-pill").forEach(x => x.classList.remove("active"));
        p.classList.add("active");
        active = p.dataset.p;
        AudioEngine.click(active);
      });
    });

    // Пробел = клик
    function keyHandler(e) {
      if (e.code === "Space") {
        e.preventDefault();
        AudioEngine.click(active);
        counter++; cnt.textContent = counter;
      }
    }
    document.addEventListener("keydown", keyHandler);
    activeKeyHandler = keyHandler;
    const back = root().querySelector(".modal-backdrop");
    const cleanup = () => document.removeEventListener("keydown", keyHandler);
    back.addEventListener("click", cleanup);
    root().querySelector(".modal-close").addEventListener("click", cleanup);
  }

  // ============== СВИСТОК ==============
  function openWhistle() {
    const html = `
      <h2>Свисток</h2>
      <p>Galton-свисток (5500–12000 Гц). Один и тот же тон должен означать одну и ту же команду — обычно подзыв.</p>
      <div class="whistle-stage">
        <div class="whistle-freq" id="wh-freq">8000 Гц</div>
        <input type="range" min="3000" max="14000" step="100" value="8000" class="whistle-slider" id="wh-slider" />
        <div class="timer-controls" style="margin-top:18px">
          <button class="btn primary" id="wh-play">Удерживать для свистка</button>
        </div>
        <p style="font-size:13px;color:var(--ink-3);margin-top:14px">Совет: для подзыва используют 3 коротких сигнала по 0.5–1 сек.</p>
      </div>
    `;
    open(html);
    const slider = root().querySelector("#wh-slider");
    const freqEl = root().querySelector("#wh-freq");
    const play = root().querySelector("#wh-play");
    slider.addEventListener("input", () => {
      freqEl.textContent = slider.value + " Гц";
      AudioEngine.whistleSetFreq(parseInt(slider.value, 10));
    });
    const start = () => AudioEngine.whistleStart(parseInt(slider.value, 10));
    const stop = () => AudioEngine.whistleStop();
    play.addEventListener("mousedown", start);
    play.addEventListener("mouseup", stop);
    play.addEventListener("mouseleave", stop);
    play.addEventListener("touchstart", e => { e.preventDefault(); start(); });
    play.addEventListener("touchend", stop);
    play.addEventListener("touchcancel", stop);
    const back = root().querySelector(".modal-backdrop");
    const cleanup = () => stop();
    back.addEventListener("click", cleanup);
    root().querySelector(".modal-close").addEventListener("click", cleanup);
  }

  // ============== ТАЙМЕР СЕССИИ ==============
  function openTimer() {
    let target = 5 * 60;
    let remain = target;
    let interval = null;
    let running = false;

    const html = `
      <h2>Таймер сессии</h2>
      <p>Короткие сессии 5–15 минут эффективнее одной длинной. Заканчиваем, пока интересно.</p>
      <div class="timer-stage">
        <div class="timer-display" id="tm-disp">05:00</div>
        <div class="timer-presets">
          ${[3,5,7,10,15].map(m => `<button class="chip" data-m="${m}">${m} мин</button>`).join("")}
        </div>
        <div class="timer-controls">
          <button class="btn outline" id="tm-reset">Сброс</button>
          <button class="btn primary" id="tm-toggle">Старт</button>
        </div>
      </div>
    `;
    open(html);
    const disp = root().querySelector("#tm-disp");
    const toggle = root().querySelector("#tm-toggle");
    const reset = root().querySelector("#tm-reset");

    function fmt(s) {
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return `${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
    }
    function update() { disp.textContent = fmt(remain); }
    function tick() {
      remain--;
      update();
      if (remain <= 0) {
        clearInterval(interval); interval = null; running = false;
        toggle.textContent = "Старт";
        AudioEngine.beep(660, 0.2); setTimeout(() => AudioEngine.beep(880, 0.4), 250);
        App.toast("Сессия завершена");
        State.update(st => st.diary.push({
          id: "t-" + Date.now(), date: new Date().toISOString(),
          text: `Тренировочная сессия — ${target/60} мин.`, rating: 4, lessonId: null,
        }));
        markActivityToday();
      }
    }
    function setTime(m) {
      target = m * 60; remain = target; update();
    }

    root().querySelectorAll(".chip").forEach(c => {
      if (parseInt(c.dataset.m, 10) === 5) c.classList.add("active");
      c.addEventListener("click", () => {
        root().querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        if (running) { clearInterval(interval); interval = null; running = false; toggle.textContent = "Старт"; }
        setTime(parseInt(c.dataset.m, 10));
      });
    });

    toggle.addEventListener("click", () => {
      if (!running) {
        if (remain <= 0) { remain = target; update(); }  // не стартуем с нуля → без дублей
        AudioEngine.beep(880, 0.12);
        interval = setInterval(tick, 1000);
        running = true; toggle.textContent = "Пауза";
      } else {
        clearInterval(interval); interval = null; running = false; toggle.textContent = "Старт";
      }
    });
    reset.addEventListener("click", () => {
      clearInterval(interval); interval = null; running = false; toggle.textContent = "Старт";
      remain = target; update();
    });

    const back = root().querySelector(".modal-backdrop");
    back.addEventListener("click", () => { if (interval) clearInterval(interval); });
    root().querySelector(".modal-close").addEventListener("click", () => { if (interval) clearInterval(interval); });
  }

  // ============== СОЦИАЛИЗАЦИЯ ==============
  function openSocialization() {
    const s = State.get();
    const total = Object.values(SOCIALIZATION).reduce((a, arr) => a + arr.length, 0);
    let done = Object.keys(s.socialChecked).filter(k => s.socialChecked[k]).length;

    const sections = Object.entries(SOCIALIZATION).map(([sec, items]) => `
      <div class="social-section">
        <h3>${sec}</h3>
        <ul class="checklist">
          ${items.map(item => {
            const key = `${sec}::${item}`;
            const ok = !!s.socialChecked[key];
            return `<li class="${ok?'done':''}" data-key="${Screens.escapeHtml(key)}"><span class="ck"></span><span>${Screens.escapeHtml(item)}</span></li>`;
          }).join("")}
        </ul>
      </div>
    `).join("");

    open(`
      <h2>Чек-лист социализации</h2>
      <p class="social-progress" id="soc-progress">${done} / ${total} пунктов</p>
      ${sections}
      <p style="font-size:12px;color:var(--ink-3);margin-top:12px">AVSAB рекомендует социализацию даже до полной вакцинации (умеренно): окно 3–14 недель важнее риска инфекции.</p>
    `);

    const prog = root().querySelector("#soc-progress");
    root().querySelectorAll(".checklist li").forEach(li => {
      li.addEventListener("click", () => {
        const key = li.dataset.key;
        State.update(st => {
          st.socialChecked[key] = !st.socialChecked[key];
        });
        li.classList.toggle("done");
        const cur = State.get();
        const cnt = Object.values(cur.socialChecked).filter(Boolean).length;
        prog.textContent = `${cnt} / ${total} пунктов`;
      });
    });
  }

  // ============== ЗДОРОВЬЕ ==============
  function openHealth() {
    const s = State.get();
    const dob = s.dog.dob ? new Date(s.dog.dob) : null;
    const events = [];
    if (dob) {
      const add = (weeks, label) => {
        const d = new Date(dob.getTime() + weeks * 7 * 86400000);
        events.push({ date: d, label });
      };
      add(6, "1-я вакцинация (мультивалентная)");
      add(9, "2-я вакцинация");
      add(12, "3-я вакцинация + бешенство");
      add(52, "Ежегодная ревакцинация");
      add(13, "Можно полноценно гулять (через 10 дней после 2-й вакцинации)");
      // Дегельминтизация — каждые 3 месяца
      for (let m = 3; m <= 24; m += 3) add(Math.round(m * 4.345), `Дегельминтизация (${m} мес)`);
    }
    events.sort((a, b) => a.date - b.date);
    const future = events.filter(e => e.date >= new Date());

    open(`
      <h2>Календарь здоровья</h2>
      <p>Расписание на основе даты рождения. Без геолокации, без чужих данных.</p>
      ${future.length ? future.slice(0, 10).map(e => `
        <div class="profile-card" style="margin:8px 0;padding:12px">
          <div class="pr-row"><span class="pr-key">${e.date.toLocaleDateString("ru-RU")}</span><span class="pr-val">${e.label}</span></div>
        </div>
      `).join("") : `<div class="empty">Сначала укажите дату рождения собаки в профиле.</div>`}
      <p style="font-size:12px;color:var(--ink-3);margin-top:12px">Это ориентир. Точное расписание определяет ветеринар.</p>
    `);
  }

  // ============== ПОРОДНЫЙ ПРОФИЛЬ ==============
  function openBreedProfile() {
    const s = State.get();
    const g = getGroupById(s.dog.breedGroup);
    const d = getBreedDetails(s.dog.breedName);

    const groupBlock = `
      <h2>${g.title}</h2>
      <p style="font-size:13px;color:var(--ink-3)">${g.fci}${g.examples ? " · " + g.examples.slice(0, 4).join(", ") : ""}</p>
      <h3>Темперамент</h3><p>${g.temperament}</p>
      <h3>Сильные стороны</h3><p>${g.strengths}</p>
      <h3>Сложности</h3><p>${g.challenges}</p>
      <h3>Здоровье</h3><p>${g.health}</p>
      <h3>Адаптация методики</h3>
      <ul class="checklist" style="pointer-events:none">
        ${g.methodology.map(m => `<li><span class="ck" style="background:var(--accent);border-color:var(--accent);color:#fff;">✓</span><span>${m}</span></li>`).join("")}
      </ul>
      <h3>Нагрузка взрослой собаки</h3><p>${g.load}</p>
    `;

    const detailBlock = d ? `
      <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
      <h2>${Screens.escapeHtml(s.dog.breedName)}</h2>
      <p style="font-size:13px;color:var(--ink-3)">${d.fci || ""} · ${d.weight || ""} · ${d.life || ""}</p>
      <p>${Screens.escapeHtml(d.summary)}</p>
      ${d.origin ? `<p style="font-size:13px;color:var(--ink-2)"><em>${Screens.escapeHtml(d.origin)}</em></p>` : ""}

      <h3>Сильные стороны</h3>
      <ul class="checklist" style="pointer-events:none">
        ${d.strengths.map(x => `<li><span class="ck" style="background:var(--accent);border-color:var(--accent);color:#fff;">✓</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
      </ul>

      <h3>Сложности</h3>
      <ul class="checklist" style="pointer-events:none">
        ${d.challenges.map(x => `<li><span class="ck" style="background:var(--warn);border-color:var(--warn);color:#fff;">!</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
      </ul>

      <h3>Здоровье — ключевые риски</h3>
      <ul class="checklist" style="pointer-events:none">
        ${d.health.map(x => `<li><span class="ck" style="background:var(--danger);border-color:var(--danger);color:#fff;">+</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
      </ul>

      <h3>Методика под породу</h3>
      <ul class="checklist" style="pointer-events:none">
        ${d.methodology.map(x => `<li><span class="ck" style="background:var(--accent);border-color:var(--accent);color:#fff;">✓</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
      </ul>

      ${d.routine ? `
        <h3>Распорядок дня</h3>
        <div class="profile-card" style="margin:6px 0">
          <div class="pr-row"><span class="pr-key">Прогулки</span><span class="pr-val">${Screens.escapeHtml(d.routine.walks)}</span></div>
          <div class="pr-row"><span class="pr-key">Тренировки</span><span class="pr-val">${Screens.escapeHtml(d.routine.training)}</span></div>
          <div class="pr-row"><span class="pr-key">Менталка</span><span class="pr-val">${Screens.escapeHtml(d.routine.mental)}</span></div>
          <div class="pr-row"><span class="pr-key">Уход</span><span class="pr-val">${Screens.escapeHtml(d.routine.grooming)}</span></div>
        </div>` : ""}

      ${d.redFlags ? `
        <h3>🚨 Красные флаги</h3>
        <div class="banner fear" style="margin:6px 0">
          <span class="b-ico">⚠️</span>
          <div><div class="b-text">
            ${d.redFlags.map(f => `• ${Screens.escapeHtml(f)}`).join("<br>")}
          </div></div>
        </div>` : ""}

      ${d.vetChecks ? `
        <h3>Ветеринарные осмотры</h3>
        <ul class="checklist" style="pointer-events:none">
          ${d.vetChecks.map(x => `<li><span class="ck" style="background:var(--accent);border-color:var(--accent);color:#fff;">✓</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
        </ul>` : ""}

      ${d.do || d.dont ? `
        <h3>Делать / не делать</h3>
        ${d.do ? `<p style="margin:4px 0;color:var(--accent);font-weight:600">Делать</p>
          <ul class="checklist" style="pointer-events:none">
            ${d.do.map(x => `<li><span class="ck" style="background:var(--accent);border-color:var(--accent);color:#fff;">✓</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
          </ul>` : ""}
        ${d.dont ? `<p style="margin:10px 0 4px;color:var(--danger);font-weight:600">Не делать</p>
          <ul class="checklist" style="pointer-events:none">
            ${d.dont.map(x => `<li><span class="ck" style="background:var(--danger);border-color:var(--danger);color:#fff;">×</span><span>${Screens.escapeHtml(x)}</span></li>`).join("")}
          </ul>` : ""}
      ` : ""}
    ` : "";

    open(groupBlock + detailBlock);
  }

  // ============== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ==============
  function openEditProfile() {
    const s = State.get();
    const d = {
      name: s.dog.name, passportName: s.dog.passportName || "", sex: s.dog.sex, dob: s.dog.dob,
      breedName: s.dog.breedName, breedGroup: s.dog.breedGroup, photo: s.dog.photo,
    };
    open(`
      <h2>Профиль питомца</h2>
      <div class="onb-avatar" style="margin:6px 0 14px">
        <button type="button" class="avatar-pick ${d.photo ? "has" : ""}" id="ep-avatar" ${d.photo ? `style="background-image:url(${d.photo})"` : ""}>
          ${d.photo ? `<span class="ap-edit">Изменить</span>` : `<span class="ap-ico">📷</span><small>Добавить фото</small>`}
        </button>
      </div>
      <div class="field"><label>Кличка</label><input type="text" id="ep-name" value="${Screens.escapeHtml(d.name || "")}" /></div>
      <div class="field" style="margin-top:10px"><label>Имя по паспорту (необязательно)</label><input type="text" id="ep-passport" value="${Screens.escapeHtml(d.passportName || "")}" placeholder="Например: Rex von Stolzberg" /></div>
      <div class="field" style="margin-top:10px"><label>Пол</label>
        <div class="chips" id="ep-sex">
          <button class="chip ${d.sex === "male" ? "active" : ""}" data-v="male">Кобель</button>
          <button class="chip ${d.sex === "female" ? "active" : ""}" data-v="female">Сука</button>
        </div></div>
      <div class="field" style="margin-top:10px"><label>Дата рождения</label>
        <input type="date" id="ep-dob" value="${d.dob ? new Date(d.dob).toISOString().slice(0, 10) : ""}" max="${todayKey()}" /></div>
      <div class="field" style="margin-top:10px"><label>Порода</label>
        <input type="text" id="ep-breed" value="${Screens.escapeHtml(d.breedName || "")}" placeholder="например: лабрадор" autocomplete="off" />
        <div class="search-list" id="ep-breed-list" style="margin-top:6px;max-height:200px;display:none"></div></div>
      <div class="modal-actions">
        <button class="btn outline" id="ep-cancel">Отмена</button>
        <button class="btn primary" id="ep-save">Сохранить</button>
      </div>
    `);

    root().querySelector("#ep-avatar").addEventListener("click", () => {
      PhotoUtil.pickAndCrop({ size: 600 }, (dataUrl) => {
        if (!dataUrl) return;
        d.photo = dataUrl;
        const b = root().querySelector("#ep-avatar");
        b.classList.add("has");
        b.style.backgroundImage = `url(${dataUrl})`;
        b.innerHTML = `<span class="ap-edit">Изменить</span>`;
      });
    });
    root().querySelector("#ep-name").addEventListener("input", e => d.name = e.target.value);
    root().querySelector("#ep-passport").addEventListener("input", e => d.passportName = e.target.value);
    root().querySelectorAll("#ep-sex .chip").forEach(c => {
      c.addEventListener("click", () => {
        d.sex = c.dataset.v;
        root().querySelectorAll("#ep-sex .chip").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
      });
    });
    root().querySelector("#ep-dob").addEventListener("change", e => d.dob = e.target.value);

    const bInput = root().querySelector("#ep-breed");
    const bList = root().querySelector("#ep-breed-list");
    bInput.addEventListener("input", () => {
      const f = bInput.value.trim().toLowerCase();
      if (!f) { bList.style.display = "none"; return; }
      const matches = BREEDS.filter(b => b.name.toLowerCase().includes(f)).slice(0, 20);
      bList.innerHTML = matches.map(b => {
        const g = getGroupById(b.group);
        return `<div class="item" data-name="${Screens.escapeHtml(b.name)}" data-group="${b.group}"><div>${Screens.escapeHtml(b.name)}</div><small>${g.title}</small></div>`;
      }).join("") || `<div class="empty">Ничего не найдено</div>`;
      bList.style.display = "block";
      bList.querySelectorAll(".item").forEach(i => {
        i.addEventListener("click", () => {
          d.breedName = i.dataset.name; d.breedGroup = i.dataset.group;
          bInput.value = d.breedName; bList.style.display = "none";
        });
      });
    });

    root().querySelector("#ep-cancel").addEventListener("click", close);
    root().querySelector("#ep-save").addEventListener("click", () => {
      if (!d.name.trim()) { App.toast("Введите имя"); return; }
      State.update(st => {
        st.dog.name = d.name.trim();
        st.dog.passportName = d.passportName.trim();
        st.dog.sex = d.sex;
        st.dog.dob = d.dob || null;
        st.dog.breedName = d.breedName;
        st.dog.breedGroup = d.breedGroup;
        st.dog.photo = d.photo || null;
      });
      close();
      App.toast("Профиль обновлён");
      App.render();
    });
  }

  // ============== ЗВУКИ ДЕСЕНСИБИЛИЗАЦИИ ==============
  function openSounds() {
    const sounds = [
      { k: "rain", ico: "🌧", label: "Дождь" },
      { k: "thunder", ico: "⛈", label: "Гроза" },
      { k: "fireworks", ico: "🎆", label: "Фейерверк" },
      { k: "traffic", ico: "🚗", label: "Город, транспорт" },
      { k: "vacuum", ico: "🧹", label: "Пылесос" },
      { k: "doorbell", ico: "🔔", label: "Дверной звонок" },
    ];
    open(`
      <h2>Звуки для привыкания</h2>
      <p>Десенсибилизация: включайте звук <b>очень тихо</b>, пока собака спокойна, и подкрепляйте лакомством. Громкость повышайте чуть-чуть день за днём.</p>
      <div class="sound-grid">
        ${sounds.map(s => `<button class="sound-card" data-k="${s.k}"><span class="sc-ico">${s.ico}</span><span>${s.label}</span></button>`).join("")}
      </div>
      <div class="sound-player" id="sound-player" hidden>
        <div class="sp-now" id="sp-now"></div>
        <label style="font-size:13px;color:var(--ink-2)">Громкость (начинайте с минимума)</label>
        <input type="range" min="0" max="100" value="30" class="whistle-slider" id="sp-vol" />
        <div class="timer-controls" style="margin-top:14px">
          <button class="btn outline" id="sp-stop">Выключить</button>
        </div>
      </div>
      <div class="banner fear" style="margin-top:14px">
        <span class="b-ico">⚠️</span>
        <div><div class="b-text">Прижатые уши, дрожь, попытка уйти — сразу тише или стоп. Страх нельзя «пересидеть» громко: это только закрепит его.</div></div>
      </div>
    `);
    const player = root().querySelector("#sound-player");
    const now = root().querySelector("#sp-now");
    const vol = root().querySelector("#sp-vol");
    root().querySelectorAll(".sound-card").forEach(c => {
      c.addEventListener("click", () => {
        const k = c.dataset.k;
        if (k === "doorbell") { AudioEngine.doorbell(); return; }
        const label = c.querySelector("span:last-child").textContent;
        AudioEngine.desensStart(k, vol.value / 100);
        now.textContent = "▶ " + label;
        player.hidden = false;
        root().querySelectorAll(".sound-card").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
      });
    });
    vol.addEventListener("input", () => AudioEngine.desensSetLevel(vol.value / 100));
    root().querySelector("#sp-stop").addEventListener("click", () => {
      AudioEngine.desensStop();
      player.hidden = true;
      root().querySelectorAll(".sound-card").forEach(x => x.classList.remove("active"));
    });
    const cleanup = () => AudioEngine.desensStop();
    root().querySelector(".modal-backdrop").addEventListener("click", cleanup);
    root().querySelector(".modal-close").addEventListener("click", cleanup);
  }

  // ============== КАЛЬКУЛЯТОР ПОРЦИИ КОРМА ==============
  function openFood() {
    const stages = [
      { f: 2.5, t: "Щенок до 4 мес" },
      { f: 2.0, t: "Щенок 4–12 мес" },
      { f: 1.6, t: "Взрослый активный" },
      { f: 1.4, t: "Взрослый обычный" },
      { f: 1.2, t: "Стерилизован / спокойный" },
      { f: 1.3, t: "Пожилой" },
      { f: 1.0, t: "Похудение" },
    ];
    open(`
      <h2>Калькулятор порции корма</h2>
      <p>Ориентир суточной калорийности и порции сухого корма по формуле RER × фактор активности. Это отправная точка — сверяйтесь с упаковкой и ветеринаром.</p>
      <div class="field"><label>Вес собаки, кг</label>
        <input type="number" id="fc-weight" min="0.5" max="90" step="0.1" placeholder="например, 12" inputmode="decimal" /></div>
      <div class="field" style="margin-top:12px"><label>Возраст / состояние</label>
        <div class="chips" id="fc-stage">
          ${stages.map((s, i) => `<button class="chip ${i === 2 ? "active" : ""}" data-f="${s.f}">${s.t} ×${s.f}</button>`).join("")}
        </div>
      </div>
      <div class="field" style="margin-top:12px"><label>Калорийность корма, ккал на 100 г (с упаковки)</label>
        <input type="number" id="fc-kcal" min="200" max="500" step="5" value="360" inputmode="numeric" /></div>
      <div class="fc-result" id="fc-result"><span class="fc-hint">Введите вес — покажу норму.</span></div>
      <p style="font-size:12px;color:var(--ink-3);margin-top:10px">Щенков кормят 3–4 раза в день, взрослых — 2 раза. При недо/переборе веса корректируйте с ветеринаром.</p>
    `);
    let factor = 1.6;
    const calc = () => {
      const w = parseFloat(root().querySelector("#fc-weight").value);
      const kcal = parseFloat(root().querySelector("#fc-kcal").value) || 360;
      const res = root().querySelector("#fc-result");
      if (!w || w <= 0) { res.innerHTML = `<span class="fc-hint">Введите вес — покажу норму.</span>`; return; }
      const rer = 70 * Math.pow(w, 0.75);
      const mer = Math.round(rer * factor);
      const grams = Math.round(mer / (kcal / 100));
      const meals = factor >= 2 ? 3 : 2;
      res.innerHTML = `
        <div class="fc-big">${grams} г <small>в день</small></div>
        <div class="fc-sub">≈ ${mer} ккал/день · по ${Math.round(grams / meals)} г × ${meals} приёма</div>`;
    };
    root().querySelectorAll("#fc-stage .chip").forEach(c => {
      c.addEventListener("click", () => {
        root().querySelectorAll("#fc-stage .chip").forEach(x => x.classList.remove("active"));
        c.classList.add("active"); factor = parseFloat(c.dataset.f); calc();
      });
    });
    root().querySelector("#fc-weight").addEventListener("input", calc);
    root().querySelector("#fc-kcal").addEventListener("input", calc);
  }

  // ============== МЕТОДИКА (НА ЧЁМ ОСНОВАНО) ==============
  function openMethodology() {
    open(`
      <h2>На чём основан «Путь лапок»</h2>
      <p>Мы используем только гуманные, научно обоснованные методы. Никаких рывков, шоковых ошейников, доминирования и наказаний.</p>
      <h3>🐾 Позитивное подкрепление</h3>
      <p>Собака повторяет то, что приводит к хорошему. Мы отмечаем правильное действие маркером (кликер/«Да!») и награждаем. Карен Прайор, Иан Данбар.</p>
      <h3>🪜 LIMA</h3>
      <p>Least Intrusive, Minimally Aversive — «наименее навязчиво и неприятно». Сначала меняем среду и обучаем альтернативе; ограничения — крайний шаг.</p>
      <h3>🧠 AVSAB</h3>
      <p>Американское общество ветеринарных специалистов по поведению: наказание не учит правильному поведению, а подавляет всё поведение и повышает тревогу и агрессию.</p>
      <h3>🌱 Сензитивные периоды</h3>
      <p>План учитывает окна развития (социализация 3–14 недель, страховые периоды) и подстраивается под возраст, породную группу FCI и темперамент.</p>
      <div class="banner info" style="margin-top:14px">
        <span class="b-ico">🔒</span>
        <div><div class="b-title">Приватность</div><div class="b-text">Всё хранится только на вашем устройстве. Без аккаунтов, без серверов, без рекламы и подписок. Работает офлайн.</div></div>
      </div>
      <p style="font-size:12px;color:var(--ink-3);margin-top:12px">«Путь лапок» — помощник, а не замена ветеринара или сертифицированного кинолога (CCPDT-KA / IAABC / РКФ).</p>
    `);
  }

  // ============== ПОДТВЕРЖДЕНИЕ ==============
  function confirm(title, text, onYes) {
    open(`
      <h2>${title}</h2>
      <p>${text}</p>
      <div class="modal-actions">
        <button class="btn outline" id="cf-no">Отмена</button>
        <button class="btn danger" id="cf-yes">Да</button>
      </div>
    `);
    root().querySelector("#cf-no").addEventListener("click", close);
    root().querySelector("#cf-yes").addEventListener("click", () => { close(); onYes(); });
  }

  return {
    openLesson, addDiary, openClicker, openWhistle, openTimer,
    openSocialization, openHealth, openBreedProfile, confirm, close,
    openSounds, openFood, openMethodology, openEditProfile,
  };
})();
