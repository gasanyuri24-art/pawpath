// Pawpath — состояние, persistence в localStorage, расчёт стадии и плана.

const STORE_KEY = "pawpath:v1";

const defaultState = () => ({
  onboarded: false,
  theme: "light",
  dog: {
    name: "",             // кличка для обращения
    passportName: "",     // полное имя по паспорту/родословной (РКФ/FCI)
    sex: "male",
    dob: null,            // ISO date string
    breedName: "",
    breedGroup: "",
    photo: null,          // dataURL аватара питомца
    isFuture: false,      // "планирую завести"
    neuteredAt: null,
    experience: "first",  // first | second | expert
    goals: [],            // ["obedience","social",...]
    livingPlace: "apartment", // apartment | house
    yardAccess: false,
    walkTimePerDay: 60,    // мин
    kids: false,
    otherPets: false,
    health: { vaccinated: false, notes: "" },
    temperament: {
      arousal: 2,         // 1..3
      preyDrive: 2,
      sensitivity: 2,
      persistence: 2,
    },
  },
  // Сделанные уроки и пункты чек-листов
  completedLessons: {},   // { lessonId: { date, rating } }
  lessonChecks: {},       // { lessonId: [boolFlags...] }
  socialChecked: {},      // { itemKey: true }
  diary: [],              // [{ id, date, text, rating, lessonId? }]
  todayDate: null,        // YYYY-MM-DD — для ротации дневных задач
  todayTaskIds: [],       // выбранные на сегодня
  todayDone: {},          // { lessonId: true }
  customCommands: [],
  learnedCommands: {},    // { commandId: { date } } — выученные команды из библиотеки
  commandLevels: {},      // { commandId: [дома, двор, улица, отвлечения] } — закрепление навыка
  commandSkill: {},       // { commandId: 'none'|'low'|'mid'|'high' } — уровень из онбординга
  activityDates: {},      // { 'YYYY-MM-DD': true } — дни активности для серий (streak)
  weightLog: [],          // [{ id, date, kg }] — измерения веса
  growthPhotos: [],       // [{ id, date, photo, note }] — фото роста/прогресса
  reminders: {            // напоминания
    items: [
      { id: "r-train", label: "Тренировка", ico: "🎓", time: "18:00", enabled: true },
      { id: "r-walk",  label: "Прогулка",   ico: "🦮", time: "08:00", enabled: false },
      { id: "r-feed",  label: "Кормление",  ico: "🍲", time: "07:30", enabled: false },
      { id: "r-potty", label: "Туалет (щенок)", ico: "💧", time: "12:00", enabled: false },
    ],
    done: {},             // { 'YYYY-MM-DD::id': true } — отмеченные сегодня
  },
});

const State = (() => {
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      console.warn("State load failed", e);
      return defaultState();
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn("State save failed (возможно, переполнена память устройства)", e);
      if (typeof App !== "undefined" && App.toast) App.toast("Недостаточно места на устройстве. Удалите старые фото.");
      return false;
    }
  }
  function get() { return state; }
  function set(patch) {
    state = Object.assign({}, state, patch);
    save();
  }
  function update(fn) {
    fn(state);
    save();
  }
  function reset() {
    state = defaultState();
    save();
  }
  // Полная замена состояния из резервной копии (с подстановкой новых полей по умолчанию).
  function replaceAll(obj) {
    if (!obj || typeof obj !== "object") return false;
    const base = defaultState();
    const next = Object.assign(base, obj);
    next.dog = Object.assign(defaultState().dog, obj.dog || {});
    if (obj.reminders) next.reminders = Object.assign(defaultState().reminders, obj.reminders);
    state = next;
    return save();
  }

  return { get, set, update, reset, save, replaceAll };
})();

// ======================== РАСЧЁТЫ ========================

function ageInWeeks(dobIso) {
  if (!dobIso) return -1;
  const ms = Date.now() - new Date(dobIso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}
function ageInMonths(dobIso) {
  return Math.floor(ageInWeeks(dobIso) / 4.345);
}
function humanAge(dobIso) {
  if (!dobIso) return "—";
  const w = ageInWeeks(dobIso);
  if (w < 0) return "будущий щенок";
  if (w < 8) return `${w} нед.`;
  if (w < 52) {
    const months = Math.floor(w / 4.345);
    return `${months} мес.`;
  }
  const years = Math.floor(w / 52);
  const months = Math.floor((w % 52) / 4.345);
  return months > 0 ? `${years} г. ${months} мес.` : `${years} г.`;
}

function currentStage(s) {
  const dog = s.dog;
  if (dog.isFuture || !dog.dob) return STAGES[0];
  const w = ageInWeeks(dog.dob);
  let stage = STAGES[STAGES.length - 1];
  for (const st of STAGES) {
    if (w >= st.minWeeks && w < st.maxWeeks) { stage = st; break; }
  }
  return stage;
}

function activeFearPeriod(s) {
  if (!s.dog.dob) return null;
  const w = ageInWeeks(s.dog.dob);
  for (const f of FEAR_PERIODS) {
    if (w >= f.minWeeks && w <= f.maxWeeks) return f;
  }
  return null;
}

function lessonsForStage(stageId) {
  return LESSONS.filter(l => l.stage === stageId);
}

function lessonsForCurrentDog(s) {
  const stage = currentStage(s);
  return lessonsForStage(stage.id);
}

// Доступность стадии: предыдущая должна быть на 80%+
function stageProgress(s, stageId) {
  const list = lessonsForStage(stageId);
  if (!list.length) return 1;
  const done = list.filter(l => s.completedLessons[l.id]).length;
  return done / list.length;
}
function isStageUnlocked(s, stageId) {
  if (stageId === 0) return true;
  if (stageId === currentStage(s).id) return true;
  // Любая стадия в прошлом возрасте автоматически открыта.
  const w = ageInWeeks(s.dog.dob);
  const stage = STAGES.find(st => st.id === stageId);
  if (stage && w >= stage.minWeeks) return true;
  // Иначе — требуется 80% предыдущей.
  return stageProgress(s, stageId - 1) >= 0.8;
}

// Подбор задач на сегодня (1–3, до 15 минут суммарно для щенка)
function buildTodayTasks(s) {
  const today = new Date().toISOString().slice(0, 10);
  if (s.todayDate === today && s.todayTaskIds.length) {
    return s.todayTaskIds.map(id => LESSONS.find(l => l.id === id)).filter(Boolean);
  }
  const stage = currentStage(s);
  const pool = lessonsForStage(stage.id);
  const undone = pool.filter(l => !s.completedLessons[l.id]);
  const candidates = (undone.length >= 3 ? undone : pool).slice();

  // Породные приоритеты
  const group = getGroupById(s.dog.breedGroup);
  const mods = group?.modifiers || {};
  const priority = (l) => {
    let score = 0;
    if (mods.recallLeashUntilMonths || mods.recallLeashAlways) {
      if (l.title.toLowerCase().includes("подзыв") || l.title.toLowerCase().includes("длинник")) score += 3;
    }
    if (mods.fetchCore && l.title.toLowerCase().includes("апорт")) score += 2;
    if (mods.scentBoost && l.title.toLowerCase().includes("нюх")) score += 2;
    if (mods.teachOff && l.title.toLowerCase().includes("выкл")) score += 2;
    if (mods.shortSessions && l.duration <= 7) score += 1;
    return score;
  };
  candidates.sort((a, b) => priority(b) - priority(a));

  // Берём 1–3, пока сумма ≤ 15 минут (если щенок) или ≤ 25 мин (взрослая)
  const stageId = stage.id;
  const isPuppy = stageId <= 3;
  const cap = isPuppy ? 15 : 25;
  const chosen = [];
  let total = 0;
  for (const l of candidates) {
    if (chosen.length >= 3) break;
    if (total + (l.duration || 5) > cap && chosen.length >= 1) break;
    chosen.push(l);
    total += (l.duration || 5);
  }

  State.update(st => {
    st.todayDate = today;
    st.todayTaskIds = chosen.map(c => c.id);
    st.todayDone = {};
  });
  return chosen;
}

// ======================== ЕЖЕДНЕВНОЕ ОБУЧЕНИЕ / ЧТО ПОДТЯНУТЬ ========================
// Команды, которые уже выучены, но закреплены НЕ во всех 4 условиях — их и надо «подтягивать».
function commandsNeedingWork(s) {
  if (typeof COMMANDS === "undefined") return [];
  const learned = s.learnedCommands || {};
  const levels = s.commandLevels || {};
  const gen = (typeof GENERALIZATION !== "undefined") ? GENERALIZATION : [];
  const res = [];
  for (const c of COMMANDS) {
    if (!learned[c.id]) continue;                 // не выучена — это работа уроков, а не закрепление
    const lv = levels[c.id] || [];
    let nextIdx = -1;
    for (let i = 0; i < 4; i++) { if (!lv[i]) { nextIdx = i; break; } }
    if (nextIdx === -1) continue;                 // закреплена везде — молодец
    const done = lv.filter(Boolean).length;
    res.push({
      id: c.id, title: c.title, pose: c.pose,
      nextIdx, done,
      nextLabel: gen[nextIdx] ? gen[nextIdx].label : "",
      nextIco: gen[nextIdx] ? gen[nextIdx].ico : "📍",
    });
  }
  // Сначала те, что почти закреплены (3/4), чтобы доводить до конца, потом остальные
  res.sort((a, b) => b.done - a.done);
  return res;
}

// Личный план обучения по реальным навыкам собаки (простые формулировки).
// Сначала базовые команды, внутри: чему учить с нуля → что знает плохо → что повторить в новом месте.
function trainingPlan(s) {
  if (typeof COMMANDS === "undefined") return [];
  const skill = s.commandSkill || {}, learned = s.learnedCommands || {}, levels = s.commandLevels || {};
  // Порядок по важности: подзыв и база — вперёд, трюки — в конец.
  const ORDER = ["come", "sit", "down", "leaveit", "stay", "heel", "place", "stand", "paw", "fetch", "spin", "speak"];
  const PLACES = ["дома", "во дворе", "на улице", "при отвлечениях (собаки, еда)"];
  const tasks = [];
  COMMANDS.forEach(c => {
    const lv = levels[c.id] || [];
    const genDone = lv.filter(Boolean).length;
    let kind, label, nextIdx = -1;
    if (learned[c.id]) {
      if (genDone >= 4) return;                 // освоено везде — готово
      for (let i = 0; i < 4; i++) { if (!lv[i]) { nextIdx = i; break; } }
      kind = "practice";
      label = nextIdx >= 0 ? "Повторить " + PLACES[nextIdx] : "Повторить";
    } else if (skill[c.id] === "low") {
      kind = "learn"; label = "Знает плохо — учим заново";
    } else {
      kind = "learn"; label = "Начать учить с нуля";
    }
    const r = ORDER.indexOf(c.id);
    tasks.push({ id: c.id, title: c.title, pose: c.pose, kind, label, nextIdx, genDone, _w: r < 0 ? 99 : r });
  });
  tasks.sort((a, b) => a._w - b._w);
  return tasks;
}

// Слабые направления (категории с наименьшим прогрессом) — «что подтянуть».
function weakCategories(s) {
  const cats = categoryProgress(s);
  return Object.entries(cats)
    .map(([id, c]) => ({ id, ...c }))
    .filter(c => c.total > 0)
    .sort((a, b) => a.pct - b.pct);
}

// Прогресс по 6 категориям
function categoryProgress(s) {
  const result = {};
  for (const cat of CATEGORIES) {
    const inCat = LESSONS.filter(l => l.category === cat.id);
    const done = inCat.filter(l => s.completedLessons[l.id]).length;
    result[cat.id] = {
      label: cat.label, ico: cat.ico,
      done, total: inCat.length,
      pct: inCat.length ? Math.round(done / inCat.length * 100) : 0,
    };
  }
  return result;
}

// ======================== СЕРИИ (STREAK) И АКТИВНОСТЬ ========================
// Отмечаем день активным при любом полезном действии (урок, команда, дневник, сессия).
function markActivityToday() {
  State.update(st => {
    if (!st.activityDates) st.activityDates = {};
    st.activityDates[todayKey()] = true;
  });
}
function dayKey(date) { return date.toISOString().slice(0, 10); }
// Текущая серия: считаем подряд идущие активные дни, заканчивая сегодня или вчера
function trainingStreak(s) {
  const dates = s.activityDates || {};
  const has = (d) => !!dates[dayKey(d)];
  let d = new Date();
  if (!has(d)) { d.setDate(d.getDate() - 1); if (!has(d)) return 0; }
  let streak = 0;
  while (has(d)) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function longestStreak(s) {
  const keys = Object.keys(s.activityDates || {}).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) {
    const dt = new Date(k);
    if (prev && Math.round((dt - prev) / 86400000) === 1) cur++; else cur = 1;
    best = Math.max(best, cur); prev = dt;
  }
  return best;
}
function activeDaysCount(s) { return Object.keys(s.activityDates || {}).length; }

// Helpers
function todayKey() { return new Date().toISOString().slice(0,10); }
function shortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
