// ==================== БАЗОВЫЕ НАСТРОЙКИ И ДАННЫЕ ====================

// Список областей жизненного баланса (по кругу, против часовой стрелки)
const AREAS = [
  "Духовность / ценности",
  "Деньги и финансы",
  "Карьера и работа",
  "Здоровье и фитнес",
  "Отдых и хобби",
  "Окружающая среда",
  "Друзья / сообщество",
  "Семья",
  "Партнёрство и любовь",
  "Рост и развитие"
];

// Пастельные цвета для секторов — по одному на каждую область
const COLORS = [
  "#B6E2D3","#FAD6A5","#C7CEEA","#FFD1DC","#B4F8C8",
  "#FBE7C6","#A0E7E5","#FFDAC1","#D5AAFF","#FFB7B2"
];

// Настройки подписей вокруг колеса
const LABEL_FONT = 16;   // размер шрифта подписей, px
const LABEL_LINE = 18;   // вертикальный отступ между строками подписи, px

// Геометрия колеса
const N  = AREAS.length; // количество секторов
const w  = 680;
const h  = 680;
const cx = w / 2;        // центр по X
const cy = h / 2;        // центр по Y
const R0 = 45;           // внутренний радиус (центр "дырки")
const R  = 270;          // внешний радиус

// Данные пользователя:
// have[i]  – текущее состояние ("Есть")
// want[i]  – желаемый уровень ("Хочу")
let have = Array(N).fill(5);
let want = Array(N).fill(8);

// ==================== ПОЛУЧАЕМ DOM-ЭЛЕМЕНТЫ ====================

const svg       = document.getElementById('wheel');
const inputsBox = document.getElementById('inputs');
const legendBox = document.getElementById('legend');
const inputs    = {}; // сюда кладём ссылки на input'ы по имени области

// ==================== СОЗДАЁМ СТРОКИ С ПОЛЯМИ И ЛЕГЕНДУ ====================

AREAS.forEach((name, i) => {
  // Одна строка: название + поле "Есть" + поле "Хочу"
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `
    <div class="label">${name}</div>
    <input type="number" min="0" max="10" step="0.5" value="${have[i]}">
    <input type="number" min="0" max="10" step="0.5" value="${want[i]}">
  `;
  inputsBox.appendChild(row);

  const [lab, ih, iw] = row.children;
  inputs[name] = { have: ih, want: iw };

  // При изменении поля "Есть" пересчитываем данные и перерисовываем колесо
  ih.addEventListener('input', () => {
    have[i] = clamp(parseFloat(ih.value));
    update();
  });

  // То же самое для "Хочу"
  iw.addEventListener('input', () => {
    want[i] = clamp(parseFloat(iw.value));
    update();
  });

  // Элемент легенды: цветной кружочек + название области
  const lg = document.createElement('span');
  lg.innerHTML = `<i class="dot" style="background:${COLORS[i]}"></i>${name}`;
  legendBox.appendChild(lg);
});

// ==================== ВСПОМОГАТЕЛЬНАЯ МАТЕМАТИКА ====================

// Угол для i-го сектора (начинаем сверху и идём по кругу)
const ang = i => -Math.PI / 2 + i * 2 * Math.PI / N;

// Значение 0–10 переводим в радиус между R0 и R
const valToR = v => R0 + (R - R0) * (v / 10);

// Ограничиваем значение между 0 и 10
const clamp = v => isNaN(v) ? 0 : Math.max(0, Math.min(10, v));

// Округление к ближайшему 0.5
const round05 = v => Math.round(v * 2) / 2;

// Перевод полярных координат (r, a) в декартовы (x, y)
const XY = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

// ==================== СОЗДАНИЕ SVG-ГРУПП ====================

// Отдельные слои (группы) внутри SVG
const gSectors = el('g', {});  // цветные сектора
const gGrid    = el('g', {});  // концентрические круги
const gAxes    = el('g', {});  // радиальные линии + подписи
const gPolys   = el('g', {});  // многоугольники "Есть"/"Хочу"
const gHandles = el('g', {});  // маркеры для перетаскивания
svg.append(gSectors, gGrid, gAxes, gPolys, gHandles);

// ==================== ФОН: ЦВЕТНЫЕ СЕКТОРА ====================

for(let i = 0; i < N; i++){
  const a1 = ang(i);
  const a2 = ang(i + 1);
  const [x1, y1] = XY(R, a1);
  const [x2, y2] = XY(R, a2);

  // Путь "клин": от центра к окружности, по дуге, обратно в центр
  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;

  gSectors.append(
    el('path', {
      d,
      fill: COLORS[i],
      opacity: 0.32,
      stroke: 'none'
    })
  );
}

// ==================== СЕТКА: КРУГИ + ЛУЧИ + ПОДПИСИ ====================

// Концентрические круги 1–10
for(let k = 1; k <= 10; k++){
  const r = R0 + (R - R0) * k / 10;
  gGrid.append(
    el('circle', {
      cx, cy, r,
      fill: 'none',
      stroke: 'rgba(0,0,0,.08)'
    })
  );
}

// Радиальные лучи и подписи областей
for(let i = 0; i < N; i++){
  const a = ang(i);
  const [x1, y1] = XY(R0, a);
  const [x2, y2] = XY(R,  a);

  // Линия от центра к краю
  gAxes.append(
    el('line', {
      x1, y1, x2, y2,
      stroke: 'rgba(0,0,0,.18)'
    })
  );

  // Подпись области (1–2 строки)
  const [lx, ly] = XY(R + 10, a); // чуть ближе к кругу, чтобы не упираться в край холста
  const t = el('text', {
    x: lx,
    y: ly,
    'font-size': LABEL_FONT,
    'font-weight': 'bold',
    'text-anchor': Math.cos(a) > 0 ? 'start' : 'end',
    'dominant-baseline': 'middle',
    fill: '#233'
  });

  const lines = wrap2(AREAS[i], 16); // "умный" перенос на 2 строки
  t.append(el('tspan', { x: lx, dy: 0 },        lines[0]));
  if (lines[1]) {
    t.append(el('tspan', { x: lx, dy: LABEL_LINE }, lines[1]));
  }
  gAxes.append(t);
}

// ==================== МНОГОУГОЛЬНИКИ ДЛЯ "ЕСТЬ" И "ХОЧУ" ====================

const polyHave = el('polygon', {
  fill: 'var(--cur-fill)',
  stroke: 'var(--cur-line)',
  'stroke-width': 2
});
const polyWant = el('polygon', {
  fill: 'var(--want-fill)',
  stroke: 'var(--want-line)',
  'stroke-width': 2
});
gPolys.append(polyHave, polyWant);

// ==================== МАРКЕРЫ ДЛЯ ПЕРЕТАСКИВАНИЯ ====================

const handlesHave = [];
const handlesWant = [];

for(let i = 0; i < N; i++){
  const c1 = el('circle', {
    r: 7,
    fill: 'var(--cur-line)',
    stroke: '#fff',
    'stroke-width': 1,
    class: 'handle',
    'data-ds': 'have', // dataset: серия "have"
    'data-i': i        // индекс области
  });

  const c2 = el('circle', {
    r: 7,
    fill: 'var(--want-line)',
    stroke: '#fff',
    'stroke-width': 1,
    class: 'handle',
    'data-ds': 'want', // серия "want"
    'data-i': i
  });

  handlesHave.push(c1);
  handlesWant.push(c2);
  gHandles.append(c1, c2);
}

// ==================== ОСНОВНАЯ ФУНКЦИЯ ПЕРЕРИСОВКИ КОЛЕСА ====================

function update(){
  // Обновляем значения в полях ввода
  AREAS.forEach((n, i) => {
    inputs[n].have.value = have[i];
    inputs[n].want.value = want[i];
  });

  // Пересчитываем точки многоугольников
  const ptsHave = [];
  const ptsWant = [];

  for(let i = 0; i < N; i++){
    const a = ang(i);

    let [x, y] = XY(valToR(have[i]), a);
    ptsHave.push(`${x},${y}`);

    [x, y] = XY(valToR(want[i]), a);
    ptsWant.push(`${x},${y}`);
  }

  polyHave.setAttribute('points', ptsHave.join(' '));
  polyWant.setAttribute('points', ptsWant.join(' '));

  // Сдвигаем маркеры на новые координаты
  for(let i = 0; i < N; i++){
    const a = ang(i);
    let [x1, y1] = XY(valToR(have[i]), a);
    let [x2, y2] = XY(valToR(want[i]), a);

    handlesHave[i].setAttribute('cx', x1);
    handlesHave[i].setAttribute('cy', y1);
    handlesWant[i].setAttribute('cx', x2);
    handlesWant[i].setAttribute('cy', y2);
  }
}

// Первый рендер
update();

// ==================== ПЕРЕТАСКИВАНИЕ МАРКЕРОВ (DRAG & DROP) ====================

let dragging = null; // объект вида { ds: 'have' | 'want', i: номер области }

svg.addEventListener('mousedown', startDrag);
svg.addEventListener('touchstart', startDrag, { passive: false });

window.addEventListener('mousemove', moveDrag);
window.addEventListener('touchmove', moveDrag, { passive: false });

window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);

// Начало перетаскивания
function startDrag(e){
  const target = e.target;
  if(target.classList && target.classList.contains('handle')){
    dragging = {
      ds: target.getAttribute('data-ds'), // серия: have / want
      i:  +target.getAttribute('data-i')  // индекс области
    };
    svg.classList.add('dragging');
    e.preventDefault();
  }
}

// Движение мыши / пальца
function moveDrag(e){
  if(!dragging) return;

  const pt = clientToSvg(e);
  const i  = dragging.i;
  const a  = ang(i);

  const ux = Math.cos(a);
  const uy = Math.sin(a);

  // Вектор от центра до точки указателя
  const vx = pt.x - cx;
  const vy = pt.y - cy;

  // Скалярная проекция на луч (ось сектора)
  let radial = vx * ux + vy * uy;

  // Ограничиваем радиус диапазоном [R0, R]
  radial = Math.max(R0, Math.min(R, radial));

  // Переводим радиус в значение 0–10
  const value = (radial - R0) / (R - R0) * 10;
  const v = round05(value); // округляем до 0.5

  if(dragging.ds === 'have'){
    have[i] = v;
  } else {
    want[i] = v;
  }

  update();
  e.preventDefault();
}

// Окончание перетаскивания
function endDrag(){
  dragging = null;
  svg.classList.remove('dragging');
}

// ==================== КНОПКИ УПРАВЛЕНИЯ ====================

document.getElementById('btnUpdate').onclick = () => update();

document.getElementById('btnReset').onclick = () => {
  // Сброс: "Есть" = 5, "Хочу" = 8 для всех областей
  have = Array(N).fill(5);
  want = Array(N).fill(8);
  update();
};

document.getElementById('btnSave').onclick = () => savePng();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ SVG ====================

// Создание SVG-элемента с набором атрибутов
function el(tag, attrs = {}, text){
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const k in attrs){
    n.setAttribute(k, attrs[k]);
  }
  if(text != null) n.textContent = text;
  return n;
}

// Разбиение подписи области максимум на 2 строки
function wrap2(s, maxLen = 16) {
  // Если есть "/", делим по нему: "Духовность / ценности"
  if (s.includes('/')) {
    const [left, right] = s.split('/').map(x => x.trim());
    return [left, right];
  }
  // Короткие подписи оставляем одной строкой
  if (s.length <= maxLen) return [s];

  // Остальные делим примерно пополам по словам
  const parts = s.split(' ');
  if (parts.length === 1) return [s];
  const mid = Math.ceil(parts.length / 2);
  return [
    parts.slice(0, mid).join(' '),
    parts.slice(mid).join(' ')
  ];
}

// Перевод координат мыши/тача в систему координат SVG
function clientToSvg(e){
  const pt = svg.createSVGPoint();
  const t  = e.touches ? e.touches[0] : e;
  pt.x = t.clientX;
  pt.y = t.clientY;
  const ctm = svg.getScreenCTM().inverse();
  return pt.matrixTransform(ctm);
}

// ==================== ЭКСПОРТ SVG В PNG ====================

function savePng(){
  const serializer = new XMLSerializer();

  // Клонируем SVG, чтобы не трогать оригинал на странице
  const clone = svg.cloneNode(true);

  // Добавляем белый фон под колесом (иначе фон будет прозрачный)
  const bg = document.createElementNS('http://www.w3.org/2000/svg','rect');
  bg.setAttribute('x', 0);
  bg.setAttribute('y', 0);
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  const svgStr  = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'});
  const url     = URL.createObjectURL(svgBlob);

  const img = new Image();

  img.onload = function(){
    // Создаём временный canvas для отрисовки SVG
    const canvas = document.createElement('canvas');
    canvas.width  = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    URL.revokeObjectURL(url);

    // Скачиваем картинку как PNG
    const a = document.createElement('a');
    a.download = 'wheel_of_life.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  img.src = url;
}
