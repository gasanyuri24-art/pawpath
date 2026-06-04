// Pawpath — библиотека команд с нарисованными иллюстрациями (SVG).
// Каждая команда: позы собаки + жест + голос + пошаговая инструкция + типичные ошибки.
// Подход — только позитивное подкрепление (LIMA), без принуждения.

// ======================= ИЛЛЮСТРАЦИИ (SVG) =======================
const CommandArt = (() => {
  const F  = "#EC9C5E";  // основной мех (тёплый золотистый)
  const FL = "#F4B57F";  // светлый мех (блик сверху)
  const E  = "#D07C3A";  // тёмный мех (уши, лапы, тень)
  const B  = "#F7D3A8";  // живот / морда (тёплый крем, явно мех — не сливается с фоном)
  const D  = "#3B2A1F";  // нос / глаз / контур
  const T  = "#F0899F";  // язык
  const CK = "#F2A488";  // румянец на щеке
  const A  = "#2A9D8F";  // акцент (стрелки)
  const R  = "#C0392B";  // запрет

  const shadow = (cx, w) =>
    `<ellipse cx="${cx}" cy="162" rx="${w}" ry="7.5" fill="#6B4A2A" opacity=".12"/>`;

  // Лапа: мягкий скруглённый «столбик» + округлый носок.
  const leg = (x, top, bottom) =>
    `<rect x="${x}" y="${top}" width="14" height="${bottom - top + 2}" rx="7" fill="${F}"/>` +
    `<ellipse cx="${x + 7}" cy="${bottom}" rx="9" ry="5.5" fill="${E}"/>`;

  // Виляющий хвост: d — путь, (px,py) — точка крепления к телу (центр вращения).
  const tailWag = (d, px, py) =>
    `<g><path d="${d}" fill="${E}"/>` +
    `<animateTransform attributeName="transform" type="rotate" additive="sum" calcMode="spline" ` +
    `keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" ` +
    `values="-8 ${px} ${py};9 ${px} ${py};-8 ${px} ${py}" dur="0.75s" repeatCount="indefinite"/></g>`;

  // Висячее ухо — мягкая каплевидная форма.
  function ear(cx, cy, r) {
    const ex = cx - r * 0.46, ey = cy - r * 0.18;
    return `<ellipse cx="${ex}" cy="${ey}" rx="${r * 0.36}" ry="${r * 0.6}" fill="${E}" transform="rotate(-30 ${ex} ${ey})"/>`;
  }

  // Голова в профиль-вправо. opt: {open, tongue, ball, look:'up'|'down'}
  function head(cx, cy, r, opt = {}) {
    const eyeY = cy - r * 0.06 + (opt.look === "up" ? -r * 0.12 : 0);
    const tilt = opt.look === "up" ? -12 : (opt.look === "down" ? 8 : 0);
    const er = Math.max(2.9, r * 0.145);
    let mouth, extra = "";
    if (opt.open) {
      mouth =
        `<path d="M${cx + r * 0.6} ${cy + r * 0.46} a ${r * 0.36} ${r * 0.32} 0 0 0 ${r * 0.66} ${r * 0.05} z" fill="${D}"/>` +
        `<ellipse cx="${cx + r * 0.92}" cy="${cy + r * 0.74}" rx="${r * 0.18}" ry="${r * 0.13}" fill="${T}"/>`;
    } else {
      mouth = `<path d="M${cx + r * 0.62} ${cy + r * 0.52} q ${r * 0.2} ${r * 0.2} ${r * 0.42} 0.02" stroke="${D}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
    if (opt.tongue && !opt.open) {
      extra += `<path d="M${cx + r * 0.92} ${cy + r * 0.52} q ${r * 0.03} ${r * 0.4} ${r * 0.17} ${r * 0.4} q ${r * 0.12} 0 ${r * 0.05} -${r * 0.38} z" fill="${T}"/>`;
    }
    if (opt.ball) {
      const bx = cx + r * 1.3, by = cy + r * 0.34, br = r * 0.44;
      extra += `<circle cx="${bx}" cy="${by}" r="${br}" fill="#5BA0CF"/>` +
        `<path d="M${bx - br} ${by} q ${br} -${br * 0.7} ${br * 2} 0" stroke="#3E7CA8" stroke-width="2" fill="none"/>` +
        `<circle cx="${bx - br * 0.35}" cy="${by - br * 0.35}" r="${br * 0.22}" fill="#fff" opacity=".55"/>`;
    }
    return `<g transform="rotate(${tilt} ${cx} ${cy})">
      ${ear(cx, cy, r)}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}"/>
      <ellipse cx="${cx - r * 0.32}" cy="${cy - r * 0.4}" rx="${r * 0.44}" ry="${r * 0.34}" fill="${FL}" opacity=".6"/>
      <ellipse cx="${cx + r * 0.74}" cy="${cy + r * 0.32}" rx="${r * 0.64}" ry="${r * 0.5}" fill="${B}"/>
      <ellipse cx="${cx + r * 0.18}" cy="${cy + r * 0.44}" rx="${r * 0.22}" ry="${r * 0.15}" fill="${CK}" opacity=".5"/>
      <ellipse cx="${cx + r * 1.2}" cy="${cy + r * 0.1}" rx="${r * 0.2}" ry="${r * 0.17}" fill="${D}"/>
      ${mouth}
      <circle cx="${cx + r * 0.34}" cy="${eyeY}" r="${er}" fill="${D}"><animate attributeName="r" values="${er};${er};0.5;${er}" keyTimes="0;0.94;0.97;1" dur="4.5s" repeatCount="indefinite"/></circle>
      <circle cx="${cx + r * 0.41}" cy="${eyeY - r * 0.08}" r="${er * 0.38}" fill="#fff"/>
      ${extra}
    </g>`;
  }

  // Открытая ладонь человека (жест «стоп»/приём лапы). dir: 1 — ладонь к собаке
  function palm(cx, cy) {
    return `<g fill="#F3CFA6" stroke="#C98E5E" stroke-width="2" stroke-linejoin="round">
      <rect x="${cx - 18}" y="${cy - 10}" width="13" height="10" rx="5"/>
      <rect x="${cx - 13}" y="${cy - 33}" width="7.5" height="20" rx="3.75"/>
      <rect x="${cx - 3.5}" y="${cy - 37}" width="7.5" height="24" rx="3.75"/>
      <rect x="${cx + 6}" y="${cy - 34}" width="7.5" height="21" rx="3.75"/>
      <rect x="${cx - 15}" y="${cy - 20}" width="31" height="42" rx="14"/>
    </g>`;
  }

  // --- позы (внутреннее содержимое svg) ---
  const POSE = {};

  POSE.stand = () =>
    shadow(120, 84) +
    tailWag("M66 98 q-30 -6 -28 -42 q16 20 30 26 z", 66, 98) +
    leg(80, 118, 150) + leg(150, 118, 150) +
    `<ellipse cx="120" cy="100" rx="60" ry="30" fill="${F}"/>` +
    `<ellipse cx="138" cy="116" rx="42" ry="16" fill="${B}"/>` +
    leg(98, 120, 150) + leg(166, 120, 150) +
    head(188, 80, 28);

  const sitBody = (o = {}) =>
    tailWag("M58 122 q-30 -2 -30 -34 q16 16 30 12 z", 58, 122) +
    `<ellipse cx="80" cy="120" rx="36" ry="40" fill="${F}"/>` +
    `<ellipse cx="96" cy="150" rx="13" ry="6" fill="${E}"/>` +
    `<ellipse cx="112" cy="98" rx="50" ry="30" fill="${F}" transform="rotate(-20 112 98)"/>` +
    `<ellipse cx="150" cy="122" rx="22" ry="24" fill="${B}"/>` +
    leg(141, 110, 150) + leg(157, 112, 150) +
    head(183, 74, 27, o);

  POSE.sit = () => shadow(112, 78) + sitBody();

  POSE.down = () =>
    shadow(118, 90) +
    tailWag("M52 120 q-22 6 -28 -8 q14 4 26 -4 z", 52, 120) +
    `<ellipse cx="74" cy="130" rx="28" ry="24" fill="${F}"/>` +
    `<ellipse cx="118" cy="124" rx="64" ry="21" fill="${F}"/>` +
    `<ellipse cx="126" cy="134" rx="40" ry="8" fill="${B}"/>` +
    `<rect x="150" y="129" width="50" height="11" rx="5.5" fill="${E}"/><ellipse cx="200" cy="134.5" rx="7" ry="4.5" fill="${F}"/>` +
    `<rect x="150" y="140" width="54" height="12" rx="6" fill="${F}"/><ellipse cx="204" cy="146" rx="8" ry="5" fill="${E}"/>` +
    head(176, 116, 24);

  POSE.come = () =>
    shadow(120, 80) +
    `<g stroke="${E}" stroke-width="3" stroke-linecap="round" opacity=".45">
       <line x1="18" y1="86" x2="40" y2="86"/><line x1="14" y1="104" x2="38" y2="104"/><line x1="22" y1="122" x2="44" y2="122"/></g>` +
    tailWag("M64 92 q-26 -22 -10 -46 q6 18 22 24 z", 64, 92) +
    leg(86, 116, 150) + leg(158, 116, 150) +
    `<ellipse cx="120" cy="100" rx="58" ry="29" fill="${F}"/>` +
    `<ellipse cx="138" cy="116" rx="40" ry="16" fill="${B}"/>` +
    leg(104, 120, 150) + leg(174, 120, 150) +
    head(188, 78, 28, { open: true });

  POSE.heel = () =>
    shadow(96, 70) +
    `<rect x="190" y="26" width="34" height="130" rx="12" fill="#5E6B7A"/>` +
    `<rect x="190" y="26" width="34" height="40" rx="12" fill="#6B7889"/>` +
    `<ellipse cx="198" cy="157" rx="27" ry="9" fill="#39414C"/>` +
    `<g transform="translate(-22,16) scale(0.82)">${sitBody({ look: "up" })}</g>`;

  POSE.place = () =>
    shadow(120, 92) +
    `<rect x="26" y="118" width="188" height="44" rx="18" fill="#7FB3A4"/>` +
    `<rect x="26" y="118" width="188" height="15" rx="7" fill="#6FA595"/>` +
    tailWag("M52 116 q-22 6 -28 -8 q14 4 26 -4 z", 52, 116) +
    `<ellipse cx="74" cy="124" rx="27" ry="22" fill="${F}"/>` +
    `<ellipse cx="116" cy="118" rx="62" ry="20" fill="${F}"/>` +
    `<ellipse cx="124" cy="127" rx="38" ry="7" fill="${B}"/>` +
    `<rect x="150" y="122" width="46" height="11" rx="5.5" fill="${E}"/><ellipse cx="196" cy="127.5" rx="7" ry="4.5" fill="${F}"/>` +
    `<rect x="150" y="133" width="50" height="12" rx="6" fill="${F}"/><ellipse cx="200" cy="139" rx="8" ry="5" fill="${E}"/>` +
    head(176, 106, 23);

  POSE.stay = () =>
    shadow(108, 78) + sitBody({ look: "up" }) + palm(186, 42) +
    `<text x="118" y="158" font-size="13" fill="${A}" font-weight="800" text-anchor="middle">Жди</text>`;

  POSE.paw = () =>
    shadow(112, 78) +
    tailWag("M58 122 q-30 -2 -30 -34 q16 16 30 12 z", 58, 122) +
    `<ellipse cx="80" cy="120" rx="36" ry="40" fill="${F}"/>` +
    `<ellipse cx="96" cy="150" rx="13" ry="6" fill="${E}"/>` +
    `<ellipse cx="112" cy="98" rx="50" ry="30" fill="${F}" transform="rotate(-20 112 98)"/>` +
    `<ellipse cx="150" cy="122" rx="22" ry="24" fill="${B}"/>` +
    leg(140, 122, 150) +
    `<g transform="rotate(-8 150 120)"><rect x="148" y="113" width="48" height="13" rx="6.5" fill="${F}"/><ellipse cx="196" cy="119.5" rx="6.5" ry="7.5" fill="${E}"/></g>` +
    palm(208, 118) +
    head(180, 72, 27, { look: "down" });

  POSE.fetch = () =>
    shadow(120, 84) +
    tailWag("M66 98 q-30 -6 -28 -42 q16 20 30 26 z", 66, 98) +
    leg(80, 118, 150) + leg(150, 118, 150) +
    `<ellipse cx="120" cy="100" rx="60" ry="30" fill="${F}"/>` +
    `<ellipse cx="138" cy="116" rx="42" ry="16" fill="${B}"/>` +
    leg(98, 120, 150) + leg(166, 120, 150) +
    head(186, 80, 28, { ball: true });

  POSE.leaveit = () =>
    shadow(108, 78) + sitBody({ look: "up" }) +
    `<g fill="#C98A4B"><circle cx="204" cy="150" r="6"/><circle cx="204" cy="158" r="6"/><circle cx="226" cy="150" r="6"/><circle cx="226" cy="158" r="6"/><rect x="204" y="150" width="22" height="8"/></g>` +
    `<circle cx="215" cy="154" r="17" fill="none" stroke="${R}" stroke-width="4"/>` +
    `<line x1="203" y1="142" x2="227" y2="166" stroke="${R}" stroke-width="4"/>`;

  POSE.spin = () =>
    shadow(120, 84) +
    `<path d="M196 56 a 80 64 0 1 0 14 40" fill="none" stroke="${A}" stroke-width="4" stroke-linecap="round"/>` +
    `<polygon points="210,92 218,104 200,102" fill="${A}"/>` +
    tailWag("M66 98 q-30 -6 -28 -42 q16 20 30 26 z", 66, 98) +
    leg(80, 118, 150) + leg(150, 118, 150) +
    `<ellipse cx="120" cy="100" rx="58" ry="29" fill="${F}"/>` +
    `<ellipse cx="138" cy="116" rx="40" ry="16" fill="${B}"/>` +
    leg(98, 120, 150) + leg(166, 120, 150) +
    head(186, 80, 27, { tongue: true });

  POSE.speak = () =>
    shadow(108, 78) + sitBody({ open: true }) +
    `<text x="150" y="40" font-size="22" font-weight="800" fill="${"#E76F51"}" transform="rotate(-8 150 40)">Гав!</text>` +
    `<g stroke="#E76F51" stroke-width="2.5" stroke-linecap="round" opacity=".7"><line x1="206" y1="66" x2="220" y2="60"/><line x1="208" y1="78" x2="224" y2="78"/></g>`;

  function svg(poseKey) {
    const inner = (POSE[poseKey] || POSE.stand)();
    return `<svg viewBox="0 0 240 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
  }

  // Фото настоящей собаки, если оно загружено в assets/commands/<id>.jpg.
  // Если файла нет — img удаляется по onerror и остаётся нарисованный запасной вариант (SVG).
  function media(cmd) {
    const id = (cmd && cmd.id) || cmd;
    const pose = (cmd && cmd.pose) || cmd;
    return `<img class="cmd-photo" alt="" loading="lazy" src="assets/commands/${id}.jpg" ` +
           `onerror="this.remove()">${svg(pose)}`;
  }

  return { svg, media };
})();

// ======================= ДАННЫЕ КОМАНД =======================
const COMMANDS = [
  {
    id: "sit", pose: "sit", title: "Сидеть", voice: "«Сидеть»", level: "Базовый",
    gesture: "Ладонь поднимается снизу вверх к плечу.",
    summary: "Первая управляющая команда. База для выдержки, приветствия без прыжков и контроля у дороги.",
    steps: [
      "Возьмите лакомство, поднесите к носу собаки.",
      "Медленно ведите кусочек над головой назад — собака поднимает морду и опускает зад.",
      "В момент посадки — кликер/«Да!» и лакомство.",
      "Повторите 5 раз с подсказкой, затем 5 раз тем же жестом, но без еды в руке.",
      "Добавьте слово «Сидеть» ровно в момент посадки, когда движение уже стабильно.",
    ],
    mistakes: [
      "Давить рукой на круп — собака начинает защищаться от прикосновений.",
      "Повторять «сидеть-сидеть-сидеть» — слово обесценивается.",
    ],
    tip: "Тренируйте в 3–4 разных местах: команда «привязывается» к обстановке.",
    lessonId: "L2-1",
  },
  {
    id: "down", pose: "down", title: "Лежать", voice: "«Лежать»", level: "Базовый",
    gesture: "Рука с ладонью вниз опускается к полу.",
    summary: "Команда расслабления и выдержки. Удобна в кафе, у ветеринара, при гостях.",
    steps: [
      "Из положения «сидеть» поднесите лакомство к носу.",
      "Ведите кусочек вертикально вниз к полу между передними лапами.",
      "Затем чуть протяните по полу вперёд — собака ляжет, вытягиваясь за рукой.",
      "Маркер и лакомство только в момент, когда локти и живот на полу.",
      "Удержание наращивайте по секундам: 1 → 3 → 5.",
    ],
    mistakes: [
      "Награждать на полпути (полусогнутая поза) — закрепляется «недолёг».",
      "Скользкий пол: собака не хочет ложиться. Начинайте на ковре.",
    ],
    tip: "Жест рукой вниз пригодится в старости, когда слух ослабнет.",
    lessonId: "L2-2",
  },
  {
    id: "stand", pose: "stand", title: "Стоять", voice: "«Стоять»", level: "Средний",
    gesture: "Раскрытая ладонь движется от собаки вперёд горизонтально.",
    summary: "Нужна для осмотра, груминга, выставки и чтобы остановить собаку на месте.",
    steps: [
      "Из «сидеть» поднесите лакомство к носу и отведите его горизонтально вперёд.",
      "Собака встаёт, шагнув вперёд за рукой — не вверх.",
      "Маркер в момент, когда все 4 лапы стоят и спина ровная.",
      "Сначала награждайте сразу, потом за 2–3 секунды неподвижности.",
      "Введите слово «Стоять», когда поза стабильна.",
    ],
    mistakes: [
      "Тянуть руку вверх — собака подпрыгивает вместо шага вперёд.",
      "Долгая выдержка слишком рано — добавляйте секунды постепенно.",
    ],
    tip: "Полезно перед командой «осмотр»: приучайте к рукам в этой позе.",
  },
  {
    id: "come", pose: "come", title: "Ко мне", voice: "«Ко мне»", level: "Базовый",
    gesture: "Руки широко раскрываются навстречу, можно присесть.",
    summary: "Самая важная команда жизни — безопасность собаки. Подзыв = всегда праздник.",
    steps: [
      "Дома убегайте от собаки и зовите радостным голосом.",
      "За каждый подход — джекпот: 3–5 лакомств подряд и похвала.",
      "Никогда не зовите для негатива (мытьё лап, конец прогулки, крейт).",
      "На улице начинайте с длинника 5 м в спокойном месте.",
      "Команду произносите один раз; если не подошёл — подойдите сами, без ругани.",
    ],
    mistakes: [
      "Звать, чтобы закончить веселье — собака учится не подходить.",
      "Ругать подошедшую с опозданием — наказывается сам факт прихода.",
    ],
    tip: "Если был неприятный подзыв — компенсируйте тройной радостью в следующий раз.",
    lessonId: "L2-3",
  },
  {
    id: "heel", pose: "heel", title: "Рядом", voice: "«Рядом»", level: "Средний",
    gesture: "Похлопывание по бедру с нужной стороны.",
    summary: "Спокойная ходьба у ноги без натяжения поводка. Цель — удовольствие, не муштра.",
    steps: [
      "Лакомство держите у шва брюк со стороны собаки.",
      "Делайте шаг — маркер и корм, пока голова у бедра.",
      "Постепенно увеличивайте число шагов между наградами.",
      "Натянулся поводок — останавливаетесь; слабина — идёте дальше.",
      "Завершайте свободной прогулкой как наградой за работу.",
    ],
    mistakes: [
      "Рывки поводком и строгие ошейники — боль и недоверие.",
      "Слишком длинные сессии — заканчивайте, пока интересно (1–3 минуты).",
    ],
    tip: "Шлейка лучше ошейника, особенно для щенков и брахицефалов.",
    lessonId: "L2-4",
  },
  {
    id: "stay", pose: "stay", title: "Ждать (выдержка)", voice: "«Ждать» / «Жди»", level: "Средний",
    gesture: "Раскрытая ладонь «стоп» перед мордой собаки.",
    summary: "Импульс-контроль: собака остаётся на месте, пока вы не разрешите. Мускул терпения.",
    steps: [
      "Попросите «сидеть», покажите ладонь-стоп и шагните назад на 1 шаг.",
      "Сразу вернитесь, маркер и лакомство за неподвижность.",
      "Наращивайте по одному параметру за раз: время, дистанция или отвлечения.",
      "Введите слово освобождения («Гуляй!»), по которому можно встать.",
      "Если встал раньше — спокойно верните на место и упростите задачу.",
    ],
    mistakes: [
      "Увеличивать сразу и время, и дистанцию — собака ошибается.",
      "Нет команды-освобождения — собака сама решает, когда вставать.",
    ],
    tip: "Ошибся 2 раза подряд — вернитесь на шаг назад в сложности.",
    lessonId: "L3-1",
  },
  {
    id: "leaveit", pose: "leaveit", title: "Фу / Нельзя", voice: "«Фу» / «Нельзя»", level: "Средний",
    gesture: "Закрытая ладонь над запретным предметом.",
    summary: "Запрет на подбирание с земли — спасает от отравлений. Жизненно важный навык.",
    steps: [
      "Положите кусочек на пол и прикройте ладонью.",
      "Собака теряет интерес и смотрит на вас — маркер и лакомство из ДРУГОЙ руки.",
      "Постепенно убирайте ладонь, оставляя корм на виду.",
      "Перенесите на улицу с длинником, повторите у «находок».",
      "Добавьте слово «Фу»/«Нельзя» и всегда меняйте на что-то ценное.",
    ],
    mistakes: [
      "Отнимать силой изо рта — собака учится глотать быстрее.",
      "Наказывать за уже съеденное — усиливает спешку в будущем.",
    ],
    tip: "Запретный кусок никогда не отдаём — награда всегда из другой руки.",
    lessonId: "L3-2",
  },
  {
    id: "place", pose: "place", title: "Место", voice: "«Место»", level: "Средний",
    gesture: "Указание рукой на лежанку.",
    summary: "Собака идёт на коврик/лежанку и остаётся там. Спасение при гостях, готовке, дверном звонке.",
    steps: [
      "Положите коврик, бросьте на него лакомство — собака заходит.",
      "Любой контакт с ковриком (4 лапы) — маркер и корм на коврике.",
      "Добавьте «Место», когда собака уверенно заходит.",
      "Наградите за то, что легла и осталась; наращивайте время.",
      "Отрабатывайте с расстояния и при отвлечениях (звонок в дверь).",
    ],
    mistakes: [
      "Использовать место как наказание — теряется его «безопасность».",
      "Звать с места без команды-освобождения.",
    ],
    tip: "Коврик удобно брать с собой — переносное «место» в кафе и в гостях.",
  },
  {
    id: "paw", pose: "paw", title: "Дай лапу", voice: "«Дай лапу»", level: "Базовый",
    gesture: "Открытая ладонь протянута к собаке на уровне груди.",
    summary: "Лёгкий трюк для связи и хорошего настроения. Готовит к спокойной стрижке когтей.",
    steps: [
      "Попросите «сидеть». Покажите кулак с лакомством у груди собаки.",
      "Собака пробует достать лапой — в момент касания маркер и корм.",
      "Замените кулак на открытую ладонь.",
      "Добавьте слова «Дай лапу» при подъёме лапы.",
      "Чередуйте лапы, попросите «другую».",
    ],
    mistakes: [
      "Самим хватать лапу — собака должна предлагать её сама.",
      "Требовать высоко поднятую лапу сразу — растите высоту постепенно.",
    ],
    tip: "Отличный мостик к хендлингу лап и спокойному грумингу.",
  },
  {
    id: "fetch", pose: "fetch", title: "Апорт", voice: "«Апорт» / «Принеси»", level: "Продвинутый",
    gesture: "Бросок предмета + приглашающий жест к себе.",
    summary: "Игра-апорт = два навыка: побежал-взял и принёс-отдал. Учим раздельно, потом склеиваем.",
    steps: [
      "Бросьте предмет недалеко — маркер уже за то, что взял в пасть.",
      "Меняйте предмет на лакомство, не вырывая (учим «дай»).",
      "Отдельно тренируйте «дай»: предмет в руку — корм в рот.",
      "Склейте цепочку: бросок → взял → принёс → отдал.",
      "Постепенно увеличивайте дистанцию броска.",
    ],
    mistakes: [
      "Вырывать предмет — собака начинает убегать и не отдавать.",
      "Маленький мяч у крупной собаки — риск проглатывания.",
    ],
    tip: "15 минут активной игры-апорта заметно разгружают энергичную собаку.",
    lessonId: "L3-4",
  },
  {
    id: "spin", pose: "spin", title: "Кружись", voice: "«Кружись»", level: "Продвинутый",
    gesture: "Палец рисует круг в воздухе.",
    summary: "Трюк-разминка для координации и настроения. Хорош как «разрядка» между серьёзными командами.",
    steps: [
      "Поднесите лакомство к носу стоящей собаки.",
      "Ведите кусочек по кругу вокруг её корпуса — собака разворачивается следом.",
      "Полный круг — маркер и корм.",
      "Уменьшайте подсказку рукой до жеста-кружочка пальцем.",
      "Добавьте слово «Кружись», научите в обе стороны.",
    ],
    mistakes: [
      "Слишком быстрый круг — собака теряет лакомство и бросает попытку.",
      "Скользкий пол — риск для суставов; делайте на ковре.",
    ],
    tip: "Трюки повышают вовлечённость — собака охотнее работает и над «серьёзным».",
  },
  {
    id: "speak", pose: "speak", title: "Голос", voice: "«Голос»", level: "Продвинутый",
    gesture: "Покачивание сжатым кулаком/пальцами у рта.",
    summary: "Управляемый лай. Полезно, чтобы потом обучить и команде «Тихо».",
    steps: [
      "Поймайте момент, когда собака естественно лает (звонок, игра).",
      "В момент лая — маркер и лакомство.",
      "Спровоцируйте лай знакомым триггером и снова поощрите.",
      "Добавьте слово «Голос» перед ожидаемым лаем.",
      "Сразу учите «Тихо»: награда за 2–3 секунды молчания.",
    ],
    mistakes: [
      "Поощрять беспорядочный лай — получите «болтливую» собаку.",
      "Кричать на лай — для собаки это «лай вместе со мной».",
    ],
    tip: "Не учите «голос» собакам, склонным к лаю от скуки или тревоги.",
  },
];

// Условия закрепления навыка (генерализация) — одинаковы для всех команд.
const GENERALIZATION = [
  { key: "home", ico: "🏠", label: "Дома, без отвлечений" },
  { key: "yard", ico: "🌳", label: "Двор / тихая улица" },
  { key: "street", ico: "🏙", label: "Улица с людьми и шумом" },
  { key: "distract", ico: "🐕", label: "Сильные отвлечения (собаки, еда)" },
];

// «Если не получается» — самая частая причина, по которой бросают тренировки.
const COMMAND_TROUBLESHOOT = {
  sit: [
    { p: "Подпрыгивает за лакомством", f: "Держите кусочек ниже, у самого носа, и ведите медленнее." },
    { p: "Пятится назад вместо посадки", f: "Тренируйте в углу комнаты — отступать некуда." },
    { p: "Садится только за еду в руке", f: "Перейдите на тот же жест пустой рукой, награждайте из другой руки." },
  ],
  down: [
    { p: "Встаёт, а не ложится", f: "Ведите лакомство строго вниз и чуть вперёд по полу, не вверх." },
    { p: "Ложится наполовину", f: "Награждайте только полное «лёг»; помогите, посадив под низкий стул/ногу." },
    { p: "Не ложится на улице", f: "Скользко/холодно/страшно — вернитесь на знакомую поверхность." },
  ],
  stand: [
    { p: "Подпрыгивает", f: "Ведите руку строго горизонтально вперёд, а не вверх." },
    { p: "Делает шаг и садится", f: "Маркер раньше — в момент, когда встал, до того как сел." },
  ],
  come: [
    { p: "Подходит дома, но не на улице", f: "Вернитесь на длинник и в тихое место — снизьте сложность." },
    { p: "Подбегает и убегает", f: "Возьмите за ошейник перед лакомством, хвалите 3–5 сек подряд." },
    { p: "Игнорирует на отвлечениях", f: "Раздражитель слишком силён — увеличьте дистанцию, поднимите ценность награды." },
  ],
  heel: [
    { p: "Всё равно тянет", f: "Останавливайтесь при натяжении; идите только на слабом поводке." },
    { p: "Отвлекается и тормозит", f: "Чаще маркируйте, делайте развороты, держите сессию короткой." },
  ],
  stay: [
    { p: "Встаёт раньше времени", f: "Вы прибавили слишком много — сократите время/дистанцию вдвое." },
    { p: "Идёт за вами", f: "Сначала шаг назад и сразу возврат, наращивайте по одному шагу." },
  ],
  leaveit: [
    { p: "Бросается на корм быстрее вас", f: "Начните с кусочка под ладонью; не открывайте, пока не отвернётся." },
    { p: "Работает дома, не на улице", f: "Используйте длинник и менее «вкусные» находки сначала." },
  ],
  place: [
    { p: "Сходит с коврика", f: "Награждайте чаще и прямо на коврике; уменьшите время." },
    { p: "Не заходит сам", f: "Бросайте лакомство на коврик, поощряйте любой контакт лапой." },
  ],
  paw: [
    { p: "Не поднимает лапу", f: "Слегка пощекочите лакомством за лапой; ловите малейшее движение." },
    { p: "Скребёт двумя лапами", f: "Награждайте только спокойное касание одной лапой." },
  ],
  fetch: [
    { p: "Бежит, но не приносит", f: "Учите «дай» отдельно; подзывайте и меняйте предмет на лакомство." },
    { p: "Не отдаёт, убегает", f: "Не догоняйте (это игра); меняйте на корм выше ценностью." },
  ],
  spin: [
    { p: "Теряет лакомство на круге", f: "Ведите медленнее и держите кусочек у самого носа." },
    { p: "Крутится только в одну сторону", f: "Это нормально; вторую сторону учите как новый трюк, с нуля." },
  ],
  speak: [
    { p: "Молчит", f: "Ловите естественный лай (звонок, игра) и сразу поощряйте." },
    { p: "Лает без остановки", f: "Сразу учите «Тихо»: награда за 2–3 секунды молчания." },
  ],
};

// ======================= ЭКРАН И МОДАЛКА =======================
const CommandsScreen = (() => {
  const LEVEL_COLOR = {
    "Базовый": "var(--accent)",
    "Средний": "var(--primary-2)",
    "Продвинутый": "var(--primary)",
  };

  function learnedMap() {
    const s = State.get();
    return s.learnedCommands || {};
  }

  function render(root) {
    const learned = learnedMap();
    const doneCount = COMMANDS.filter(c => learned[c.id]).length;

    const wrap = document.createElement("section");
    wrap.className = "screen commands";
    wrap.innerHTML = `
      <header class="page-head">
        <h1>Команды</h1>
        <p>Иллюстрированная библиотека. Нажмите на карточку — пошаговая инструкция с картинкой.</p>
      </header>
      <div class="cmd-progress">
        <div class="cmd-progress-bar"><div class="fill" style="width:${Math.round(doneCount / COMMANDS.length * 100)}%"></div></div>
        <span>${doneCount} из ${COMMANDS.length} выучено</span>
      </div>
      <div class="cmd-grid">
        ${COMMANDS.map(c => {
          const lv = (State.get().commandLevels || {})[c.id] || [];
          const dots = GENERALIZATION.map((g, i) => `<span class="dot ${lv[i] ? "on" : ""}"></span>`).join("");
          return `
          <button class="cmd-card ${learned[c.id] ? "learned" : ""}" data-id="${c.id}">
            <div class="cmd-art">${CommandArt.media(c)}</div>
            <div class="cmd-info">
              <div class="cmd-title">${c.title}${learned[c.id] ? ' <span class="cmd-check">✓</span>' : ""}</div>
              <div class="cmd-level" style="color:${LEVEL_COLOR[c.level] || "var(--ink-3)"}">${c.level}</div>
              <div class="cmd-dots" title="Закрепление в 4 условиях">${dots}</div>
            </div>
          </button>`;
        }).join("")}
      </div>
    `;
    wrap.querySelectorAll(".cmd-card").forEach(card => {
      card.addEventListener("click", () => {
        const cmd = COMMANDS.find(c => c.id === card.dataset.id);
        open(cmd);
      });
    });
    root.replaceChildren(wrap);
  }

  // --- модалка команды ---
  const modalRoot = () => document.getElementById("modal-root");
  function close() { modalRoot().innerHTML = ""; }

  function open(cmd) {
    const s = State.get();
    const learned = !!learnedMap()[cmd.id];
    const esc = Screens.escapeHtml;
    const levels = (s.commandLevels && s.commandLevels[cmd.id]) || [false, false, false, false];
    const ts = cmd.troubleshooting || COMMAND_TROUBLESHOOT[cmd.id] || [];
    modalRoot().innerHTML = `
      <div class="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" aria-label="Закрыть">×</button>
          <div class="cmd-hero anim" data-anim="${cmd.pose}">${CommandArt.media(cmd)}</div>
          <h2>${esc(cmd.title)}</h2>
          <div class="cmd-tags">
            <span class="cmd-tag voice">🗣 ${esc(cmd.voice)}</span>
            <span class="cmd-tag">${esc(cmd.level)}</span>
          </div>
          <p>${esc(cmd.summary)}</p>
          <h3>✋ Жест</h3>
          <p>${esc(cmd.gesture)}</p>
          <h3>📋 Как обучить, шаг за шагом</h3>
          <ol class="cmd-steps">
            ${cmd.steps.map(s => `<li>${esc(s)}</li>`).join("")}
          </ol>
          <h3>⚠️ Частые ошибки</h3>
          <ul class="cmd-mistakes">
            ${cmd.mistakes.map(m => `<li>${esc(m)}</li>`).join("")}
          </ul>
          ${ts.length ? `
          <h3>🛟 Если не получается</h3>
          <ul class="cmd-trouble">
            ${ts.map(t => `<li><b>${esc(t.p)}</b><span>${esc(t.f)}</span></li>`).join("")}
          </ul>` : ""}
          <h3>📍 Закрепление в условиях</h3>
          <p style="font-size:13px;color:var(--ink-3);margin-top:0">Команда «выучена» по-настоящему, когда работает везде. Отмечайте по мере усложнения.</p>
          <div class="cmd-levels" id="cmd-levels">
            ${GENERALIZATION.map((g, i) => `
              <button class="cmd-level ${levels[i] ? "on" : ""}" data-i="${i}">
                <span class="cl-ico">${g.ico}</span>
                <span class="cl-label">${g.label}</span>
                <span class="cl-mark">${levels[i] ? "✓" : ""}</span>
              </button>`).join("")}
          </div>
          <h3>💡 Совет</h3>
          <p>${esc(cmd.tip)}</p>
          <div class="modal-actions">
            ${cmd.lessonId ? `<button class="btn outline" id="cmd-lesson">Открыть урок</button>` : ""}
            <button class="btn ${learned ? "outline" : "primary"}" id="cmd-learn">
              ${learned ? "Снять отметку «выучено»" : "Отметить «выучено» ✓"}
            </button>
          </div>
        </div>
      </div>
    `;
    const back = modalRoot().querySelector(".modal-backdrop");
    back.addEventListener("click", e => { if (e.target === back) close(); });
    modalRoot().querySelector(".modal-close").addEventListener("click", close);

    modalRoot().querySelectorAll("#cmd-levels .cmd-level").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.i, 10);
        State.update(st => {
          if (!st.commandLevels) st.commandLevels = {};
          if (!st.commandLevels[cmd.id]) st.commandLevels[cmd.id] = [false, false, false, false];
          st.commandLevels[cmd.id][i] = !st.commandLevels[cmd.id][i];
        });
        const on = btn.classList.toggle("on");
        btn.querySelector(".cl-mark").textContent = on ? "✓" : "";
        if (on) markActivityToday();
      });
    });

    modalRoot().querySelector("#cmd-learn").addEventListener("click", () => {
      const wasLearned = !!learnedMap()[cmd.id];
      State.update(st => {
        if (!st.learnedCommands) st.learnedCommands = {};
        if (wasLearned) delete st.learnedCommands[cmd.id];
        else st.learnedCommands[cmd.id] = { date: new Date().toISOString() };
      });
      if (!wasLearned) markActivityToday();
      close();
      App.toast(wasLearned ? "Отметка снята" : "Команда выучена! 🐾");
      App.render();
    });

    const lessonBtn = modalRoot().querySelector("#cmd-lesson");
    if (lessonBtn) {
      lessonBtn.addEventListener("click", () => {
        const lesson = LESSONS.find(l => l.id === cmd.lessonId);
        if (lesson) { close(); Modals.openLesson(lesson); }
      });
    }
  }

  return { render, open };
})();

// ======================= ПРОБЛЕМЫ ПОВЕДЕНИЯ =======================
const BehaviorScreen = (() => {
  const modalRoot = () => document.getElementById("modal-root");
  function close() { modalRoot().innerHTML = ""; }

  function render(root) {
    const wrap = document.createElement("section");
    wrap.className = "screen behavior";
    wrap.innerHTML = `
      <header class="page-head">
        <h1>Проблемы поведения</h1>
        <p>Гуманные решения частых сложностей. Подход LIMA/AVSAB: меняем среду и учим альтернативе, без наказаний.</p>
      </header>
      <div class="banner info" style="margin:0 4px 14px">
        <span class="b-ico">💛</span>
        <div><div class="b-text">Если что-то идёт не так — это нормально и поправимо. Регресс, особенно у подростка, тоже норма. Идём маленькими шагами.</div></div>
      </div>
      <div class="behavior-list">
        ${BEHAVIOR_PROBLEMS.map(p => `
          <button class="behavior-card" data-id="${p.id}">
            <span class="bh-ico">${p.ico}</span>
            <div class="bh-body">
              <div class="bh-title">${p.title}</div>
              <div class="bh-sum">${Screens.escapeHtml(p.summary)}</div>
            </div>
            <span class="bh-tag">${p.tag}</span>
          </button>
        `).join("")}
      </div>
      <p class="legal">Это не замена очной работе с ветеринаром или сертифицированным специалистом по поведению (CCPDT-KA / IAABC / РКФ). При агрессии с укусами обращайтесь к специалисту.</p>
    `;
    wrap.querySelectorAll(".behavior-card").forEach(card => {
      card.addEventListener("click", () => open(BEHAVIOR_PROBLEMS.find(p => p.id === card.dataset.id)));
    });
    root.replaceChildren(wrap);
  }

  function open(p) {
    const esc = Screens.escapeHtml;
    modalRoot().innerHTML = `
      <div class="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" aria-label="Закрыть">×</button>
          <div class="bh-hero">${p.ico}</div>
          <h2>${esc(p.title)}</h2>
          <span class="cmd-tag">${esc(p.tag)}</span>
          <p>${esc(p.summary)}</p>
          <h3>Почему так происходит</h3>
          <p>${esc(p.why)}</p>
          <h3>✅ Что делать</h3>
          <ol class="cmd-steps">
            ${p.steps.map(x => `<li>${esc(x)}</li>`).join("")}
          </ol>
          <h3>🚫 Чего НЕ делать</h3>
          <ul class="cmd-mistakes">
            ${p.dont.map(x => `<li>${esc(x)}</li>`).join("")}
          </ul>
          <div class="banner fear" style="margin:14px 0">
            <span class="b-ico">🩺</span>
            <div><div class="b-title">Когда к специалисту</div><div class="b-text">${esc(p.pro)}</div></div>
          </div>
          <div class="modal-actions">
            ${p.relatedLessonId ? `<button class="btn outline" id="bh-lesson">Связанный урок</button>` : ""}
            <button class="btn primary" id="bh-close">Понятно</button>
          </div>
        </div>
      </div>
    `;
    const back = modalRoot().querySelector(".modal-backdrop");
    back.addEventListener("click", e => { if (e.target === back) close(); });
    modalRoot().querySelector(".modal-close").addEventListener("click", close);
    modalRoot().querySelector("#bh-close").addEventListener("click", close);
    const lb = modalRoot().querySelector("#bh-lesson");
    if (lb) lb.addEventListener("click", () => {
      const lesson = LESSONS.find(l => l.id === p.relatedLessonId);
      if (lesson) { close(); Modals.openLesson(lesson); }
    });
  }

  return { render, open };
})();
