'use strict';

// ── TiniCash — mobilní rozhraní číšníka ──
// Otevře se na telefonu: http://<IP-počítače>:3000/waiter.html
// Používá stejné API jako kasa; tisk běží na počítači.
// Chování účtu (přidání, storno, tisk při zavření) kopíruje hlavní kasu.

const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(/[&<>"]/g,
  z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[z]));

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Chyba serveru');
  return data;
}

let toastTimer = null;
function toast(msg, err = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = err ? 'err' : '';
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, err ? 3000 : 2000);
}

const formatPrice = v => Number(v).toLocaleString('cs-CZ',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';
const formatQty = q => Number(q) === 0.5 ? '1/2' : String(Number(q));

// ── nastavení: platné stoly (kvůli popisku „… - SEBOU" na lístku) ──
let validRanges = [];
async function loadSettings() {
  try {
    const s = await api('GET', '/settings');
    validRanges = String(s.valid_tables || '').split(',').map(part => {
      const [a, b] = part.split('-').map(x => parseInt(x.trim(), 10));
      return Number.isInteger(a) ? [a, Number.isInteger(b) ? b : a] : null;
    }).filter(Boolean);
  } catch {}
}
const isValidTable = n => { n = Number(n); return validRanges.some(([lo, hi]) => n >= lo && n <= hi); };
const tableLabel = n => isValidTable(n) ? String(n) : `${n} - SEBOU`;

// ── obrazovky ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}

// ── číselník (sdílený pro zámek i zadání stolu) ──
// onOk dostane zadaný řetězec; bez onCancel se křížek nekreslí.
function makePad(padEl, displayEl, { maxLen = 6, mask = false, onOk }) {
  let value = '';
  const render = () => {
    displayEl.textContent = mask ? value.replace(/./g, '●') : value;
  };
  const key = (label, cls, fn) => {
    const b = document.createElement('button');
    if (cls) b.className = cls;
    b.textContent = label;
    b.addEventListener('click', fn);
    padEl.appendChild(b);
  };
  padEl.innerHTML = '';
  for (const d of '123456789') key(d, '', () => { if (value.length < maxLen) { value += d; render(); } });
  key('⌫', 'pad-del', () => { value = value.slice(0, -1); render(); });
  key('0', '', () => { if (value.length < maxLen) { value += '0'; render(); } });
  key('OK', 'pad-ok', () => onOk(value));
  render();
  return { clear() { value = ''; render(); } };
}

// ── zámek (kód kasy, stejné ověření jako při startu) ──
let lockPad = null;
async function submitLock(code) {
  if (!code) return;
  let valid;
  try { ({ valid } = await api('POST', '/verify-startup', { code })); }
  catch { valid = false; }
  lockPad.clear();
  if (valid) {
    $('lock').hidden = true;
    showTables();
  } else {
    const err = $('lock-error');
    err.textContent = 'Špatný kód';
    setTimeout(() => { err.textContent = ''; }, 2000);
  }
}

// ── stav otevřeného účtu (kopíruje kasu) ──
let currentOrder = null;
let selectedTable = null;
let currentItems = [];
let originalItemIds = new Set();   // položky, co na účtu byly při načtení → jejich smazání se loguje jako storno
let newKitchenItems = [];          // položky přidané v této relaci, které se tisknou do kuchyně
let voidedItems = [];              // smazané původní položky → storno lístek

function resetState() {
  currentOrder = null;
  selectedTable = null;
  currentItems = [];
  originalItemIds = new Set();
  newKitchenItems = [];
  voidedItems = [];
}

// ── výběr stolu ──
async function showTables() {
  showScreen('view-tables');
  let orders = [];
  try { orders = await api('GET', '/orders'); } catch (e) { toast(e.message, true); }
  const box = $('open-accounts');
  box.innerHTML = '';
  $('tables-empty').hidden = orders.length > 0;
  orders.forEach(o => {
    const b = document.createElement('button');
    b.className = 'acc-btn' + (isValidTable(o.table_number) ? '' : ' warn');
    b.textContent = o.table_number;
    b.addEventListener('click', () => openTable(o.table_number));
    box.appendChild(b);
  });
}

let tablePad = null;
function setupTablePad() {
  tablePad = makePad($('table-pad'), $('table-num-display'), {
    maxLen: 4,
    onOk: value => { const n = parseInt(value, 10); if (n) { tablePad.clear(); openTable(n); } },
  });
}

// ── otevření/načtení účtu ──
async function openTable(tableNum) {
  await flushTickets();   // vyřídí papírky případného předchozího účtu
  resetState();
  let order = null;
  try { order = await api('GET', `/orders/table/${tableNum}`); } catch (e) { toast(e.message, true); return; }
  if (order) {
    await loadOrder(order);
  } else {
    selectedTable = tableNum;   // účet se založí až první přidanou položkou
    showAccount();
  }
}

async function loadOrder(order) {
  currentOrder = order;
  selectedTable = null;
  const items = await api('GET', `/orders/${order.id}/items`);
  originalItemIds = new Set(items.map(i => i.id));
  newKitchenItems = [];
  voidedItems = [];
  renderItems(items);
  showAccount();
}

function showAccount() {
  showScreen('view-account');
  const tableNum = currentOrder?.table_number ?? selectedTable;
  const tableEl = $('acct-table');
  tableEl.textContent = tableNum;                              // jen číslo, bez „SEBOU"
  tableEl.classList.toggle('warn', !isValidTable(tableNum));   // s sebou = žlutá, jinak zelená
  $('acct-total').textContent = currentOrder ? formatPrice(currentOrder.total_price) : formatPrice(0);
  if (!currentOrder) renderItems([]);
  loadCategories();
}

function renderItems(items) {
  currentItems = items;
  const list = $('acct-items');
  list.innerHTML = '';
  if (!items.length) {
    const e = document.createElement('div');
    e.id = 'acct-items-empty';
    e.textContent = 'Zatím prázdný účet';
    list.appendChild(e);
    return;
  }
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'it-row';
    row.innerHTML =
      `<span class="it-qty">${formatQty(item.quantity)}×</span>` +
      `<span class="it-name">${esc(item.name)}</span>` +
      `<span class="it-price">${formatPrice(item.quantity * item.unit_price)}</span>`;
    const del = document.createElement('button');
    del.className = 'it-del';
    del.textContent = '−';
    del.addEventListener('click', () => deleteItem(item.id));
    row.appendChild(del);
    list.appendChild(row);
  });
  list.scrollTop = list.scrollHeight;
}

function updateTotal() {
  $('acct-total').textContent = currentOrder ? formatPrice(currentOrder.total_price) : formatPrice(0);
}

// ── přidání položky (kopíruje addToOrder z kasy) ──
async function addToOrder(productId) {
  try {
    if (!currentOrder) {
      currentOrder = await api('POST', '/orders', { table_number: selectedTable });
      selectedTable = null;
    }
    const item = await api('POST', `/orders/${currentOrder.id}/items`, { product_id: productId, quantity: 1 });
    if (item.print_kitchen) newKitchenItems.push(item);
    currentOrder = await api('GET', `/orders/${currentOrder.id}`);
    const items = await api('GET', `/orders/${currentOrder.id}/items`);
    renderItems(items);
    updateTotal();
  } catch (e) { toast(e.message, true); }
}

// ── storno položky (kopíruje deleteItem z kasy) ──
const voidedAmount = quantity => { const q = Number(quantity); return q > 1 ? 1 : q; };

async function deleteItem(itemId) {
  try {
    const shouldLog = originalItemIds.has(itemId);
    if (shouldLog) {
      const item = currentItems.find(i => i.id === itemId);
      if (item) voidedItems.push({ ...item, quantity: voidedAmount(item.quantity) });
    }
    await api('DELETE', `/orders/${currentOrder.id}/items/${itemId}?log=${shouldLog}`);
    const items = await api('GET', `/orders/${currentOrder.id}/items`);

    const ki = newKitchenItems.findIndex(i => i.id === itemId);
    if (ki !== -1) {
      const remaining = items.find(i => i.id === itemId);
      if (!remaining) newKitchenItems.splice(ki, 1);
      else newKitchenItems[ki].quantity = remaining.quantity;
    }

    if (items.length === 0) {
      // účet zůstane založený jen pokud na něm nic není → smaž ho, ať nezůstane prázdný
      await api('DELETE', `/orders/${currentOrder.id}`);
      selectedTable = currentOrder.table_number;
      currentOrder = null;
      renderItems([]);
    } else {
      currentOrder = await api('GET', `/orders/${currentOrder.id}`);
      renderItems(items);
    }
    updateTotal();
  } catch (e) { toast(e.message, true); }
}

// ── tisk při zavření účtu (kopíruje flushTickets z kasy) ──
function aggregateVoids(items) {
  const out = [];
  items.forEach(item => {
    const ex = out.find(a => a.product_id === item.product_id);
    if (ex) ex.quantity += item.quantity;
    else out.push({ ...item });
  });
  return out;
}

async function flushTickets() {
  const tableNumForPrint = currentOrder?.table_number ?? selectedTable;
  try {
    if (currentOrder && newKitchenItems.length > 0) {
      await api('POST', '/print/kitchen', { tableNumber: tableLabel(currentOrder.table_number), items: newKitchenItems });
    }
    if (voidedItems.length > 0 && tableNumForPrint) {
      await api('POST', '/print/void', { tableNumber: tableLabel(tableNumForPrint), items: aggregateVoids(voidedItems) });
    }
  } catch (e) { toast('Tisk selhal: ' + e.message, true); }
}

async function closeAccount() {
  await flushTickets();
  resetState();
  showTables();
}

// ── produkty ──
async function loadCategories() {
  const tabs = $('cat-tabs');
  if (tabs.dataset.loaded) return;   // kategorie se nemění, načti jen jednou
  let cats = [];
  try { cats = await api('GET', '/categories'); } catch (e) { toast(e.message, true); return; }
  tabs.innerHTML = '';
  cats.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'cat-tab';
    b.textContent = c.name;
    b.addEventListener('click', () => selectCategory(c.id, b));
    tabs.appendChild(b);
    if (i === 0) selectCategory(c.id, b);
  });
  tabs.dataset.loaded = '1';
}

function selectCategory(catId, btn) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  showProducts(catId);
}

async function showProducts(catId) {
  const list = $('prod-list');
  let products = [];
  try { products = await api('GET', `/products?category=${encodeURIComponent(catId)}`); }
  catch (e) { toast(e.message, true); return; }
  list.innerHTML = '';
  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'prod-row';
    row.innerHTML =
      `<span class="prod-name">${esc(p.name)}</span>` +
      `<span class="prod-price">${formatPrice(p.price)}</span>` +
      `<span class="prod-plus">＋</span>`;
    row.addEventListener('click', () => addToOrder(p.id));
    list.appendChild(row);
  });
}

// ── start ──
lockPad = makePad($('lock-pad'), $('lock-display'), { mask: true, onOk: submitLock });
setupTablePad();
loadSettings();
if (SKIP_CODES) { $('lock').hidden = true; showTables(); }   // testování — bez zadávání kódu
$('btn-done').addEventListener('click', closeAccount);
