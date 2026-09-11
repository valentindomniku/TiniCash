'use strict';

// ── TESTOVACÍ PŘEPÍNAČ ──
// true  = přeskočí zadávání kódů (zámek při startu i kód uzávěrek/adminu) — pro testování
// false = normální provoz, kódy se zadávají
// PŘED NASAZENÍM NA KASU DÁT false!
const SKIP_CODES = true;

// Paleta na výběr v adminu; barvu si drží každá kategorie v DB (sloupec color).
// Produkt bez kategorie (a dlaždice načtené podle PLU) padnou na výpočet z čísla.
const CAT_COLORS = [
  '#c2185b', '#1565C0', '#7B1FA2', '#2E7D32',
  '#6A1B9A', '#00838F', '#AD1457', '#4527A0',
  '#558B2F', '#BF360C', '#00695C', '#283593'
];

// Produkty zobrazené v "Text" panelu (jedno tlačítko na řádek, široké přes dva)
const TEXT_PRODUCT_IDS = [700, 701, 702, 703, 704, 705];

// Produkty pro tlačítka "BAR Kč" / "KUCHYŇ Kč" — cena se zadává ručně.
// KUCHYŇ se tiskne (print_kitchen=1), BAR ne (print_kitchen=0).
const BAR_PRODUCT_ID = 400;
const KUCHYN_PRODUCT_ID = 401;

// Kategorie z posledního načtení — čte se z nich barva, příznak numbered a doplňková kategorie
let categoriesById = {};

// Nastavení z tabulky settings (hlavička se řeší na serveru; klient potřebuje čísla „s sebou" a platné stoly)
let settings = {};
let takeawayNumbers = [];   // [16, 17, …]
let validRanges = [];       // [[1,15], [20,22], …]

function parseSettings(s) {
  settings = s || {};
  takeawayNumbers = String(settings.takeaway_numbers || '')
    .split(',').map(x => parseInt(x, 10)).filter(Number.isInteger);
  validRanges = String(settings.valid_tables || '').split(',').map(part => {
    const [a, b] = part.split('-').map(x => parseInt(x.trim(), 10));
    return Number.isInteger(a) ? [a, Number.isInteger(b) ? b : a] : null;
  }).filter(Boolean);
}

// výchozí hodnoty, než dorazí odpověď ze serveru (a když selže)
parseSettings({ takeaway_numbers: '16,17,18,19,23,24,25', valid_tables: '1-15,20-22,101-117' });

async function loadSettings() {
  try { parseSettings(await api('GET', '/settings')); } catch {}
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Chyba serveru');
  return data;
}

// Text z databáze do innerHTML — název produktu si může majitel v adminu napsat jakkoliv
const esc = s => String(s ?? '').replace(/[&<>"]/g, z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[z]));

// Panely a modální okna se přepínají třídou .hidden
const show = id => document.getElementById(id).classList.remove('hidden');
const hide = id => document.getElementById(id).classList.add('hidden');

function catColor(id) {
  if (!id) return CAT_COLORS[0];
  return categoriesById[id]?.color || CAT_COLORS[parseInt(id) % CAT_COLORS.length];
}

function makeBtn(text, color, extra = {}) {
  const btn = document.createElement('button');
  btn.className = 'grid-btn';
  btn.style.background = color;
  btn.textContent = text;
  Object.assign(btn.style, extra);
  return btn;
}

// Vytvoří element s třídou a textem (zkracuje ruční stavění DOM v adminu)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeSep() {
  const sep = document.createElement('div');
  sep.style.gridColumn = '1 / -1';
  sep.style.height = '12px';
  return sep;
}

