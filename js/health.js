// Pawpath — здоровье: нормы веса по породам, кривые роста, фото-прогресс.
// Данные собраны по стандартам FCI/AKC. Это ориентир, а не замена ветеринару.

// Здоровый ВЗРОСЛЫЙ вес (кг) и размерная категория по породам.
const BREED_WEIGHTS = {
  "Лабрадор ретривер":{min:25,max:36,cat:"large"},"Голден ретривер":{min:25,max:34,cat:"large"},
  "Немецкая овчарка":{min:22,max:40,cat:"large"},"Бордер-колли":{min:12,max:20,cat:"medium"},
  "Австралийская овчарка":{min:16,max:32,cat:"large"},"Шелти":{min:6,max:12,cat:"small"},
  "Бельгийская овчарка":{min:20,max:34,cat:"large"},"Вельш-корги":{min:9,max:14,cat:"small"},
  "Бобтейл":{min:27,max:45,cat:"large"},"Ротвейлер":{min:35,max:60,cat:"giant"},
  "Доберман":{min:32,max:45,cat:"large"},"Ризеншнауцер":{min:25,max:48,cat:"large"},
  "Боксёр":{min:25,max:32,cat:"large"},"Бернский зенненхунд":{min:36,max:54,cat:"giant"},
  "Кане-корсо":{min:40,max:50,cat:"giant"},"Бульмастиф":{min:41,max:59,cat:"giant"},
  "Сенбернар":{min:54,max:90,cat:"giant"},"Ньюфаундленд":{min:45,max:70,cat:"giant"},
  "Джек-рассел терьер":{min:5,max:8,cat:"small"},"Фокс-терьер":{min:6,max:9,cat:"small"},
  "Йоркширский терьер":{min:2,max:3.2,cat:"toy"},"Бультерьер":{min:22,max:38,cat:"large"},
  "Стаффордширский терьер":{min:18,max:36,cat:"large"},"Эрдельтерьер":{min:18,max:29,cat:"large"},
  "Керн-терьер":{min:6,max:7.5,cat:"small"},"Скотч-терьер":{min:8.5,max:10,cat:"small"},
  "Такса (стандарт)":{min:7,max:12,cat:"small"},"Такса (миниатюрная)":{min:4,max:5,cat:"toy"},
  "Такса (кроличья)":{min:3,max:3.5,cat:"toy"},"Хаски":{min:16,max:27,cat:"medium"},
  "Маламут":{min:34,max:43,cat:"large"},"Самоед":{min:17,max:30,cat:"medium"},
  "Акита":{min:32,max:59,cat:"large"},"Сиба-ину":{min:7,max:13,cat:"small"},
  "Померанский шпиц":{min:1.5,max:3.5,cat:"toy"},"Чау-чау":{min:20,max:32,cat:"large"},
  "Бигль":{min:9,max:16,cat:"small"},"Бассет-хаунд":{min:20,max:29,cat:"large"},
  "Родезийский риджбек":{min:32,max:41,cat:"large"},"Далматин":{min:16,max:32,cat:"large"},
  "Бладхаунд":{min:36,max:50,cat:"giant"},"Дратхаар":{min:27,max:32,cat:"large"},
  "Сеттер английский":{min:20,max:36,cat:"large"},"Сеттер ирландский":{min:24,max:32,cat:"large"},
  "Пойнтер":{min:20,max:34,cat:"large"},"Спаниель кокер":{min:12,max:16,cat:"medium"},
  "Спрингер-спаниель":{min:18,max:25,cat:"medium"},"Курцхаар":{min:20,max:32,cat:"large"},
  "Веймаранер":{min:25,max:40,cat:"large"},"Мопс":{min:6.3,max:8.1,cat:"small"},
  "Чихуахуа":{min:1.5,max:3.0,cat:"toy"},"Той-пудель":{min:2.0,max:4.0,cat:"toy"},
  "Мальтезе":{min:3.0,max:4.0,cat:"toy"},"Бишон-фризе":{min:3.0,max:6.0,cat:"small"},
  "Кавалер кинг чарльз":{min:5.4,max:8.0,cat:"small"},"Пекинес":{min:3.2,max:6.0,cat:"small"},
  "Японский хин":{min:1.8,max:4.0,cat:"toy"},"Ши-тцу":{min:4.0,max:7.5,cat:"small"},
  "Папильон":{min:2.5,max:5.0,cat:"toy"},"Грейхаунд":{min:27.0,max:40.0,cat:"large"},
  "Уиппет":{min:9.0,max:19.0,cat:"medium"},"Русская борзая":{min:27.0,max:48.0,cat:"large"},
  "Салюки":{min:18.0,max:27.0,cat:"large"},"Афганская борзая":{min:20.0,max:27.0,cat:"large"},
  "Ирландский волкодав":{min:40.0,max:69.0,cat:"giant"},"Дирхаунд":{min:34.0,max:50.0,cat:"giant"},
  "Английский бульдог":{min:18.0,max:25.0,cat:"medium"},"Французский бульдог":{min:8.0,max:14.0,cat:"medium"},
  "Пудель (стандарт)":{min:20.0,max:32.0,cat:"large"},"Шарпей":{min:18.0,max:30.0,cat:"large"},
  "Шипперке":{min:3.0,max:9.0,cat:"small"},"Лхаса апсо":{min:5.5,max:8.0,cat:"small"},
  "Метис":{min:null,max:null,cat:"unknown"},
};

// Доля взрослого веса по возрасту (мес) для каждой размерной категории.
const GROWTH_CURVE = {
  toy:    [[2,.25],[3,.40],[4,.50],[6,.75],[9,.90],[12,1.0]],
  small:  [[2,.22],[3,.35],[4,.47],[6,.70],[9,.88],[12,1.0]],
  medium: [[2,.18],[3,.30],[4,.40],[6,.62],[9,.80],[12,.92],[15,1.0]],
  large:  [[2,.15],[3,.26],[4,.35],[6,.55],[9,.72],[12,.85],[18,.97],[24,1.0]],
  giant:  [[2,.12],[3,.22],[4,.30],[6,.48],[9,.62],[12,.75],[18,.92],[24,1.0]],
};

function breedWeight(name) {
  const w = BREED_WEIGHTS[name];
  return (w && w.min != null) ? w : null;
}
function growthFraction(cat, ageMonths) {
  const curve = GROWTH_CURVE[cat] || GROWTH_CURVE.medium;
  if (ageMonths <= curve[0][0]) return curve[0][1];
  if (ageMonths >= curve[curve.length - 1][0]) return 1.0;
  for (let i = 1; i < curve.length; i++) {
    if (ageMonths <= curve[i][0]) {
      const [m0, p0] = curve[i - 1], [m1, p1] = curve[i];
      return p0 + (p1 - p0) * (ageMonths - m0) / (m1 - m0);
    }
  }
  return 1.0;
}
// Ожидаемый вес под возраст: {min,max,isAdult,adultMin,adultMax}
function expectedWeight(breedName, ageMonths) {
  const w = breedWeight(breedName);
  if (!w) return null;
  if (ageMonths == null || ageMonths < 0) ageMonths = 24;
  const f = growthFraction(w.cat, ageMonths);
  return {
    min: w.min * f, max: w.max * f,
    isAdult: f >= 0.995, adultMin: w.min, adultMax: w.max, cat: w.cat,
  };
}
// Статус веса: 'low' | 'ok' | 'high' | null
function weightStatus(kg, exp) {
  if (!exp || !kg) return null;
  if (kg < exp.min * 0.9) return "low";
  if (kg > exp.max * 1.1) return "high";
  return "ok";
}

// ===== Утилита: выбрать/снять фото и сжать для локального хранения =====
const PhotoUtil = (() => {
  function pick(opts, cb) {
    opts = opts || {};
    const max = opts.max || 760, q = opts.quality || 0.62;
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.addEventListener("change", () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          const scale = Math.min(1, max / Math.max(w, h));
          w = Math.round(w * scale); h = Math.round(h * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          let out;
          try { out = canvas.toDataURL("image/jpeg", q); } catch (_) { out = e.target.result; }
          cb(out);
        };
        img.onerror = () => cb(null);
        img.src = e.target.result;
      };
      reader.onerror = () => cb(null);
      reader.readAsDataURL(file);
    });
    inp.click();
  }
  // Выбрать фото и сразу обрезать (для аватара)
  function pickAndCrop(opts, cb) {
    opts = opts || {};
    pick({ max: opts.srcMax || 1400, quality: 0.9 }, (src) => {
      if (!src) { cb(null); return; }
      PhotoCrop.open(src, { size: opts.size || 600, round: opts.round !== false }, cb);
    });
  }
  return { pick, pickAndCrop };
})();

// ===== Обрезка фото: перетаскивание + зум, вывод квадратного кадра =====
const PhotoCrop = (() => {
  function open(src, opts, cb) {
    opts = opts || {};
    const out = opts.size || 600;
    // Отдельный слой поверх всего (не затирает окно «Изменить профиль» в #modal-root)
    const host = document.createElement("div");
    host.innerHTML = `<div class="modal-backdrop" style="z-index:300"><div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Закрыть">×</button>
      <h2>Обрезка фото</h2>
      <p class="crop-hint">Двигайте фото пальцем, масштаб — ползунком</p>
      <div class="crop-stage ${opts.round === false ? "square" : ""}" id="crop-stage"><img id="crop-img" alt="" /></div>
      <input type="range" min="1" max="3" step="0.01" value="1" class="whistle-slider crop-zoom" id="crop-zoom" />
      <div class="modal-actions">
        <button class="btn outline" id="crop-cancel">Отмена</button>
        <button class="btn primary" id="crop-save">Готово</button>
      </div>
    </div></div>`;
    document.body.appendChild(host);
    const stage = host.querySelector("#crop-stage");
    const imgEl = host.querySelector("#crop-img");
    const zoom = host.querySelector("#crop-zoom");
    let V = 0, imgW = 0, imgH = 0, coverScale = 1, scale = 1, offX = 0, offY = 0;
    const img = new Image();

    function clamp() {
      const w = imgW * scale, h = imgH * scale;
      offX = Math.min(0, Math.max(V - w, offX));
      offY = Math.min(0, Math.max(V - h, offY));
    }
    function apply() {
      clamp();
      imgEl.style.width = (imgW * scale) + "px";
      imgEl.style.height = (imgH * scale) + "px";
      imgEl.style.left = offX + "px";
      imgEl.style.top = offY + "px";
    }
    img.onload = () => {
      imgW = img.naturalWidth; imgH = img.naturalHeight;
      V = stage.clientWidth || 280;
      coverScale = Math.max(V / imgW, V / imgH);
      scale = coverScale;
      offX = (V - imgW * scale) / 2;
      offY = (V - imgH * scale) / 2;
      imgEl.src = src;
      apply();
    };
    img.src = src;

    zoom.addEventListener("input", () => {
      const newScale = coverScale * parseFloat(zoom.value);
      const cx = V / 2, cy = V / 2;
      const ix = (cx - offX) / scale, iy = (cy - offY) / scale;
      scale = newScale;
      offX = cx - ix * scale; offY = cy - iy * scale;
      apply();
    });

    let dragging = false, lastX = 0, lastY = 0;
    stage.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
    stage.addEventListener("pointermove", e => { if (!dragging) return; offX += e.clientX - lastX; offY += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; apply(); });
    stage.addEventListener("pointerup", () => dragging = false);
    stage.addEventListener("pointercancel", () => dragging = false);

    function close() { host.remove(); }
    const back = host.querySelector(".modal-backdrop");
    back.addEventListener("click", e => { if (e.target === back) close(); });
    host.querySelector(".modal-close").addEventListener("click", close);
    host.querySelector("#crop-cancel").addEventListener("click", close);
    host.querySelector("#crop-save").addEventListener("click", () => {
      const sx = -offX / scale, sy = -offY / scale, sV = V / scale;
      const canvas = document.createElement("canvas");
      canvas.width = out; canvas.height = out;
      canvas.getContext("2d").drawImage(img, sx, sy, sV, sV, 0, 0, out, out);
      let url; try { url = canvas.toDataURL("image/jpeg", 0.82); } catch (_) { url = src; }
      close();
      cb(url);
    });
  }
  return { open };
})();

// ======================= ЭКРАН «РОСТ И ВЕС» =======================
const GrowthScreen = (() => {
  const modalRoot = () => document.getElementById("modal-root");
  function closeModal() { modalRoot().innerHTML = ""; }
  function esc(s) { return Screens.escapeHtml(s); }

  function render(root) {
    const s = State.get();
    const log = [...(s.weightLog || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = log[log.length - 1];
    const ageMonths = s.dog.dob ? ageInMonths(s.dog.dob) : null;
    const exp = expectedWeight(s.dog.breedName, ageMonths);
    const status = latest ? weightStatus(latest.kg, exp) : null;

    const statusMap = {
      low:  { c: "var(--warn)",   t: "Ниже нормы", d: "Вес ниже ожидаемого. Проверьте рацион и покажитесь ветеринару." },
      ok:   { c: "var(--accent)", t: "В норме",    d: "Отличный вес для возраста и породы. Так держать!" },
      high: { c: "var(--danger)", t: "Выше нормы", d: "Лишний вес вредит суставам и сердцу. Обсудите порцию с ветеринаром." },
    };

    const wrap = document.createElement("section");
    wrap.className = "screen growth";
    wrap.innerHTML = `
      <header class="page-head">
        <h1>Рост и вес</h1>
        <p>Контроль веса по нормам породы и фотодневник роста. Ориентир, не замена ветеринару.</p>
      </header>

      <div class="weight-card">
        <div class="wc-top">
          <div>
            <div class="wc-kg">${latest ? latest.kg + " кг" : "—"}</div>
            <div class="wc-sub">${latest ? "измерено " + shortDate(latest.date) : "ещё нет измерений"}</div>
          </div>
          ${status ? `<span class="wc-badge" style="background:${statusMap[status].c}">${statusMap[status].t}</span>` : ""}
        </div>
        ${exp ? `
          <div class="wc-norm">
            ${exp.isAdult
              ? `Здоровый вес взрослой собаки: <b>${fmtKg(exp.adultMin)}–${fmtKg(exp.adultMax)} кг</b>`
              : `Ожидаемый вес в ${ageMonths} мес.: <b>${fmtKg(exp.min)}–${fmtKg(exp.max)} кг</b><br><span class="wc-dim">взрослым станет ~${fmtKg(exp.adultMin)}–${fmtKg(exp.adultMax)} кг</span>`}
          </div>
          ${status ? `<div class="wc-note">${statusMap[status].d}</div>` : ""}
        ` : `<div class="wc-norm wc-dim">Для вашей породы нет точных норм — просто отслеживаем динамику веса.</div>`}
        <button class="btn primary wc-add" id="add-weight">+ Добавить вес</button>
      </div>

      ${log.length >= 2 ? `<div class="weight-chart">${chartSvg(log, exp)}</div>` : ""}

      <div class="block-head" style="margin:18px 4px 10px"><h2 style="font-size:17px">Фотодневник роста</h2>
        <span class="block-sub">${(s.growthPhotos || []).length} фото</span></div>
      <button class="help-card" id="add-photo" style="margin-bottom:12px">
        <span class="hc-ico">📷</span>
        <div class="hc-body"><div class="hc-title">Добавить фото</div>
        <div class="hc-sub">Снимите или выберите фото — увидите, как растёт питомец</div></div>
        <span class="hc-arrow">+</span>
      </button>
      <div class="growth-gallery">
        ${[...(s.growthPhotos || [])].reverse().map(p => `
          <button class="gp-item" data-id="${p.id}">
            <img src="${p.photo}" alt="" loading="lazy" />
            <span class="gp-date">${shortDate(p.date)}</span>
          </button>`).join("") || `<div class="empty" style="grid-column:1/-1">Пока нет фото. Добавьте первое — потом будет приятно сравнить.</div>`}
      </div>
    `;

    wrap.querySelector("#add-weight").addEventListener("click", addWeight);
    wrap.querySelector("#add-photo").addEventListener("click", addPhoto);
    wrap.querySelectorAll(".gp-item").forEach(el => {
      el.addEventListener("click", () => viewPhoto(el.dataset.id));
    });
    root.replaceChildren(wrap);
  }

  function fmtKg(n) { return Math.round(n * 10) / 10; }

  function chartSvg(log, exp) {
    const W = 320, H = 130, pad = 28;
    const t0 = new Date(log[0].date).getTime();
    const t1 = new Date(log[log.length - 1].date).getTime();
    const span = Math.max(1, t1 - t0);
    let maxKg = Math.max(...log.map(p => p.kg));
    let minKg = Math.min(...log.map(p => p.kg));
    if (exp) { maxKg = Math.max(maxKg, exp.adultMax); minKg = Math.min(minKg, 0); }
    maxKg *= 1.1; minKg = Math.max(0, minKg * 0.9);
    const range = Math.max(0.1, maxKg - minKg);
    const x = (t) => pad + (W - pad - 8) * ((t - t0) / span);
    const y = (kg) => pad - 8 + (H - pad - 8) * (1 - (kg - minKg) / range);
    const pts = log.map(p => `${x(new Date(p.date).getTime()).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
    let band = "";
    if (exp && exp.isAdult) {
      const yTop = y(exp.adultMax), yBot = y(exp.adultMin);
      band = `<rect x="${pad}" y="${yTop.toFixed(1)}" width="${W - pad - 8}" height="${(yBot - yTop).toFixed(1)}" fill="rgba(42,157,143,0.12)"/>
        <line x1="${pad}" y1="${yBot.toFixed(1)}" x2="${W - 8}" y2="${yBot.toFixed(1)}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 3"/>
        <line x1="${pad}" y1="${yTop.toFixed(1)}" x2="${W - 8}" y2="${yTop.toFixed(1)}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 3"/>`;
    }
    const dots = log.map(p => `<circle cx="${x(new Date(p.date).getTime()).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3.5" fill="var(--primary)"/>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
      ${band}
      <polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      <text x="2" y="${(pad - 10).toFixed(1)}" font-size="9" fill="var(--ink-3)">${fmtKg(maxKg)}</text>
      <text x="2" y="${(H - 6).toFixed(1)}" font-size="9" fill="var(--ink-3)">${fmtKg(minKg)} кг</text>
    </svg>`;
  }

  // ---- модалки ----
  function modal(html) {
    modalRoot().innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Закрыть">×</button>${html}</div></div>`;
    const back = modalRoot().querySelector(".modal-backdrop");
    back.addEventListener("click", e => { if (e.target === back) closeModal(); });
    modalRoot().querySelector(".modal-close").addEventListener("click", closeModal);
  }

  function addWeight() {
    modal(`
      <h2>Новое измерение веса</h2>
      <div class="field"><label>Дата</label><input type="date" id="w-date" value="${todayKey()}" max="${todayKey()}" /></div>
      <div class="field" style="margin-top:10px"><label>Вес, кг</label>
        <input type="number" id="w-kg" min="0.3" max="120" step="0.1" placeholder="например, 8.5" inputmode="decimal" /></div>
      <div class="modal-actions">
        <button class="btn outline" id="w-cancel">Отмена</button>
        <button class="btn primary" id="w-save">Сохранить</button>
      </div>
    `);
    modalRoot().querySelector("#w-cancel").addEventListener("click", closeModal);
    modalRoot().querySelector("#w-save").addEventListener("click", () => {
      const kg = parseFloat(modalRoot().querySelector("#w-kg").value);
      const date = modalRoot().querySelector("#w-date").value || todayKey();
      if (!kg || kg <= 0) { App.toast("Введите вес"); return; }
      State.update(st => {
        if (!st.weightLog) st.weightLog = [];
        st.weightLog.push({ id: "w-" + Date.now(), date: new Date(date).toISOString(), kg: Math.round(kg * 10) / 10 });
      });
      markActivityToday();
      closeModal();
      App.toast("Вес записан");
      App.go("growth");
    });
  }

  function addPhoto() {
    PhotoUtil.pick({ max: 820, quality: 0.62 }, (dataUrl) => {
      if (!dataUrl) { App.toast("Не удалось загрузить фото"); return; }
      const ok = State.update(st => {
        if (!st.growthPhotos) st.growthPhotos = [];
        st.growthPhotos.push({ id: "g-" + Date.now(), date: new Date().toISOString(), photo: dataUrl, note: "" });
      });
      markActivityToday();
      App.toast("Фото добавлено");
      App.go("growth");
    });
  }

  function viewPhoto(id) {
    const p = (State.get().growthPhotos || []).find(x => x.id === id);
    if (!p) return;
    modal(`
      <h2>${shortDate(p.date)}</h2>
      <img src="${p.photo}" alt="" style="width:100%;border-radius:var(--radius);margin:6px 0 12px" />
      <div class="modal-actions">
        <button class="btn danger" id="ph-del">Удалить фото</button>
        <button class="btn primary" id="ph-ok">Закрыть</button>
      </div>
    `);
    modalRoot().querySelector("#ph-ok").addEventListener("click", closeModal);
    modalRoot().querySelector("#ph-del").addEventListener("click", () => {
      State.update(st => { st.growthPhotos = (st.growthPhotos || []).filter(x => x.id !== id); });
      closeModal();
      App.toast("Удалено");
      App.go("growth");
    });
  }

  return { render };
})();
