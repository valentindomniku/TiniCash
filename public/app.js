'use strict';

// Paleta na výběr v adminu; barvu si drží každá kategorie v DB (sloupec color).
// Produkt bez kategorie (a dlaždice načtené podle PLU) padnou na výpočet z čísla.
const CAT_COLORS = [
  '#c2185b', '#1565C0', '#7B1FA2', '#2E7D32',
  '#6A1B9A', '#00838F', '#AD1457', '#4527A0',
  '#558B2F', '#BF360C', '#00695C', '#283593'
];

// Produkty zobrazené v "Text" panelu (jedno tlačítko na řádek, široké přes dva)
const TEXT_PRODUCT_IDS = [700, 701, 702, 703, 704, 705];

// Čísla účtů pro "s sebou" — lišta dole vlevo (zelená = volné, žlutá = obsazené)
const TAKEAWAY_NUMBERS = [16, 17, 18, 19, 23, 24, 25];

// Produkty pro tlačítka "BAR Kč" / "KUCHYŇ Kč" — cena se zadává ručně.
// KUCHYŇ se tiskne (print_kitchen=1), BAR ne (print_kitchen=0).
const BAR_PRODUCT_ID = 400;
const KUCHYN_PRODUCT_ID = 401;

// Kategorie z posledního načtení — čte se z nich barva, příznak numbered a doplňková kategorie
let categoriesById = {};

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

// ─── CATEGORY GRID ────────────────────────────────────────

function renderGrid(elements, showFixed = false) {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';

  const mainBtn = document.createElement('button');
  mainBtn.className = 'grid-btn hlavni-panel';
  mainBtn.style.gridColumn = '5';
  mainBtn.style.gridRow = '1';
  mainBtn.textContent = 'Hlavní panel';
  mainBtn.addEventListener('click', showCategories);
  grid.appendChild(mainBtn);

  elements.forEach((el, i) => {
    if (i === 6 && showFixed) {
      const secret = document.createElement('button');
      secret.className = 'secret-btn';
      secret.addEventListener('click', openCreditsModal);
      grid.appendChild(secret);
    }
    grid.appendChild(el);
  });

  if (showFixed) {
    const bar = makeBtn('BAR Kč', '#37474F');
    bar.style.gridColumn = '1'; bar.style.gridRow = '4';
    bar.addEventListener('click', () => addCustomItem(BAR_PRODUCT_ID));
    grid.appendChild(bar);

    const kuchyn = makeBtn('KUCHYŇ Kč', '#37474F');
    kuchyn.style.gridColumn = '2'; kuchyn.style.gridRow = '4';
    kuchyn.addEventListener('click', () => addCustomItem(KUCHYN_PRODUCT_ID));
    grid.appendChild(kuchyn);
  }
}

function setProductsGridVisible(visible) {
  const display = visible ? '' : 'none';
  ['products-grid', 'products-grid2'].forEach(id => {
    document.getElementById(id).style.display = display;
  });
  // oddělovače mezi gridy skrýt taky, ať pod produkty není prázdno (scroll)
  document.querySelectorAll('#left-scroll .grid-sep').forEach(sep => {
    sep.style.display = display;
  });
}

async function showCategories() {
  const cats = await api('GET', '/categories');
  categoriesById = Object.fromEntries(cats.map(c => [c.id, c]));
  const btns = cats.map(c => {
    const btn = makeBtn(c.name, '#E91E63');
    btn.addEventListener('click', () => showProducts(c.id));
    return btn;
  });
  renderGrid(btns, true);
  setProductsGridVisible(true);
}

// Co dělá z produktů jednu skupinu: číslo pořadí i název. Stačí, aby se změnilo jedno
// z nich, a vloží se mezera — takže lze skupiny rozlišovat jen čísly, jen názvy, nebo obojím.
const groupKey = p => `${p.sort_order ?? ''}|${p.sort_group ?? ''}`;

// Produkty kategorie. Pořadí určuje sort_order zadaný v adminu — řadí ho server,
// tady se jen vkládají mezery mezi skupinami.
async function showProducts(categoryId) {
  const url = categoryId ? `/products?category=${encodeURIComponent(categoryId)}` : '/products';
  const products = await api('GET', url);
  // zaškrtnuté „číslovat tlačítka" u kategorie → místo názvu produktu se ukáže skupina a pořadí
  const cislovat = !!categoriesById[categoryId]?.numbered;

  const elements = [];
  let lastKey;
  let groupCount = 0;     // pořadí uvnitř skupiny — pro popisek "PIZZA 3"
  let catCount = 0;       // pořadí v celé kategorii — pro holé číslo
  products.forEach(p => {
    const key = groupKey(p);
    if (lastKey !== undefined && key !== lastKey) {
      elements.push(makeSep());
      groupCount = 0;
    }
    lastKey = key;
    groupCount++;
    catCount++;
    // číslovaná kategorie: se skupinou "PIZZA 3", bez skupiny holé číslo.
    // Holé číslo běží přes celou kategorii, aby se stejný popisek neobjevil dvakrát.
    const label = cislovat ? (p.sort_group ? `${p.sort_group} ${groupCount}` : String(catCount)) : undefined;
    elements.push(makeProductBtn(p, label));
  });

  elements.push(...await addonElements(categoriesById[categoryId]?.addon_category_id));

  renderGrid(elements);
  setProductsGridVisible(false);
}

// Tlačítka produktů z přidružené kategorie (oddělené mezerou), nebo prázdné pole
async function addonElements(addonCategoryId) {
  if (!addonCategoryId) return [];
  const addons = await api('GET', `/products?category=${encodeURIComponent(addonCategoryId)}`);
  if (!addons.length) return [];
  // Přilepená lišta se řadí podle PLU, ne podle sort_order — obsluha ji má takhle zažitou.
  // Když ji otevřeš jako samostatnou kategorii, pořadí ze sort_order platí normálně.
  addons.sort((a, b) => a.id - b.id);
  return [makeSep(), ...addons.map(a => makeProductBtn(a))];
}

// Levá část s "text" tlačítky (produkty z DB) — jedno na řádek, široké přes dva buttony
async function showTextPanel() {
  const podleId = await fetchProducts(TEXT_PRODUCT_IDS.map(String));
  renderGrid([]);
  setProductsGridVisible(false);
  const grid = document.getElementById('category-grid');
  for (const id of TEXT_PRODUCT_IDS) {
    const p = podleId[id];
    if (!p) continue;
    const btn = makeBtn(p.name, '#5D4037', { gridColumn: '1 / 3', aspectRatio: '4 / 1' });
    btn.addEventListener('click', () => quickAdd(p.id));
    grid.appendChild(btn);
  }
}

// ─── PRODUCTS GRIDS ───────────────────────────────────────

// Načte produkty podle seznamu PLU jedním dotazem; vrátí mapu id → produkt
async function fetchProducts(ids) {
  const seznam = ids.filter(id => id !== '0');
  if (!seznam.length) return {};
  const produkty = await api('GET', `/products?ids=${seznam.join(',')}`);
  return Object.fromEntries(produkty.map(p => [String(p.id), p]));
}

async function loadGrid(gridId, ids) {
  const grid = document.getElementById(gridId);
  const podleId = await fetchProducts(ids);
  grid.innerHTML = '';
  for (const id of ids) {
    // '0' je prázdné místo v mřížce; chybějící PLU se přeskočí
    if (id === '0') grid.appendChild(document.createElement('div'));
    else if (podleId[id]) grid.appendChild(makeProductBtn(podleId[id]));
  }
}

// ─── DISPLAY & NUMPAD ─────────────────────────────────────

let displayValue = '';
let pendingQty = null;

function formatQty(qty) {
  return Number(qty) === 0.5 ? '1/2' : String(Number(qty));
}

function updateDisplay() {
  document.getElementById('display-value').textContent = pendingQty !== null
    ? `${formatQty(pendingQty)} × ${displayValue || ''}`
    : (displayValue || '0');
}

// Hodiny vlevo v display baru (HH:MM)
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('display-clock').textContent = `${hh}:${mm}`;
}

function setupNumpad() {
  document.querySelectorAll('#action-grid [data-digit]').forEach(btn => {
    btn.addEventListener('click', () => {
      displayValue += btn.dataset.digit;
      updateDisplay();
    });
  });
  document.getElementById('btn-x').addEventListener('click', () => {
    pendingQty = parseInt(displayValue) || 1;
    displayValue = '';
    updateDisplay();
  });
  document.getElementById('btn-cl').addEventListener('click', () => {
    displayValue = '';
    pendingQty = null;
    updateDisplay();
  });
  document.getElementById('btn-del').addEventListener('click', () => {
    displayValue = displayValue.slice(0, -1);
    updateDisplay();
  });
}

// ─── OBJEDNÁVKA ───────────────────────────────────────────

let currentOrder = null;
let selectedTable = null;
let selectedItemId = null;
let originalItemIds = new Set();
let newKitchenItems = [];
let voidedItems = [];
let currentItems = [];

// Přidá produkt do účtu s aktuálním násobitelem a vyčistí display
function quickAdd(productId) {
  const qty = pendingQty ?? 1;
  pendingQty = null;
  displayValue = '';
  updateDisplay();
  addToOrder(productId, qty).catch(() => {});
}

// BAR / KUCHYŇ — položka mimo sortiment s ručně zadanou cenou (z display baru)
function addCustomItem(productId) {
  const price = parseFloat(displayValue);
  if (!price || price <= 0) { showToast('Nejdřív zadej cenu', 'error'); return; }
  if (!currentOrder && !selectedTable) { showToast('Nejdřív otevři účet', 'error'); return; }
  const qty = pendingQty ?? 1;
  pendingQty = null;
  displayValue = '';
  updateDisplay();
  addToOrder(productId, qty, price).catch(e => showToast(e.message, 'error'));
}

function makeProductBtn(p, label) {
  const btn = makeBtn(label ?? p.name, catColor(p.first_category_id ?? p.id));
  btn.addEventListener('click', () => quickAdd(p.id));
  return btn;
}

async function addToOrder(productId, qty = 1, unitPrice = null) {
  if (!currentOrder && !selectedTable) { showToast('Nejdřív otevři účet', 'error'); return; }
  if (!currentOrder) {
    currentOrder = await api('POST', '/orders', { table_number: selectedTable });
    selectedTable = null;
  }
  const body = { product_id: productId, quantity: qty };
  if (unitPrice != null) body.unit_price = unitPrice;
  const item = await api('POST', `/orders/${currentOrder.id}/items`, body);
  if (item.print_kitchen) newKitchenItems.push(item);
  currentOrder = await api('GET', `/orders/${currentOrder.id}`);
  setOrderUI();
  await refreshItems();
  scrollItemsToBottom();
  refreshTakeawayBar();
}

// Odscrolluje seznam položek úplně dolů (na poslední přidanou položku)
function scrollItemsToBottom() {
  const list = document.getElementById('items-list');
  list.scrollTop = list.scrollHeight;
}

// Kolik toho ubere jedno smazání: z položky s množstvím > 1 jeden kus, jinak celý zbytek (např. půlku).
// Musí odpovídat tomu, co dělá server v DELETE /orders/:id/items/:itemId.
function voidedAmount(quantity) {
  const qty = Number(quantity);
  return qty > 1 ? 1 : qty;
}

async function deleteItem(itemId) {
  const shouldLog = originalItemIds.has(itemId);
  if (shouldLog) {
    const item = currentItems.find(i => i.id === itemId);
    if (item) voidedItems.push({ ...item, quantity: voidedAmount(item.quantity) });
  }
  await api('DELETE', `/orders/${currentOrder.id}/items/${itemId}?log=${shouldLog}`);
  const items = await api('GET', `/orders/${currentOrder.id}/items`);

  const kitchenIdx = newKitchenItems.findIndex(i => i.id === itemId);
  if (kitchenIdx !== -1) {
    const remaining = items.find(i => i.id === itemId);
    if (!remaining) {
      newKitchenItems.splice(kitchenIdx, 1);
    } else {
      newKitchenItems[kitchenIdx].quantity = remaining.quantity;
    }
  }

  if (items.length === 0) {
    await api('DELETE', `/orders/${currentOrder.id}`);
    selectedTable = currentOrder.table_number;
    currentOrder = null;
    selectedItemId = null;
    document.getElementById('items-list').innerHTML = '';
  } else {
    if (!items.some(i => i.id === itemId)) selectedItemId = null;
    currentOrder = await api('GET', `/orders/${currentOrder.id}`);
    renderItems(items);
  }
  setOrderUI();
  refreshTakeawayBar();
}

async function refreshItems() {
  const items = await api('GET', `/orders/${currentOrder.id}/items`);
  renderItems(items);
}

function renderItems(items) {
  currentItems = items;
  const list = document.getElementById('items-list');
  list.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'item-row' + (item.id === selectedItemId ? ' selected' : '');
    row.innerHTML = `
      <span class="item-plu">${esc(item.product_id)}</span>
      <span class="item-name">${esc(item.name)}</span>
      <span class="item-qty">${formatQty(item.quantity)}×</span>
      <span class="item-price">${formatPrice(item.unit_price)}</span>
      <span class="item-total">${formatPrice(item.quantity * item.unit_price)}</span>
    `;
    row.addEventListener('click', () => {
      selectedItemId = selectedItemId === item.id ? null : item.id;
      renderItems(items);
    });
    list.appendChild(row);
  });
}

// ─── ÚČET ──────────────────────────────────────────────────

function formatPrice(val) {
  return Number(val).toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';
}

// '2026-06-04 14:30:00' -> '4.6.2026 14:30'
function fmtDateTime(s) {
  return `${+s.slice(8, 10)}.${+s.slice(5, 7)}.${s.slice(0, 4)} ${+s.slice(11, 13)}:${s.slice(14, 16)}`;
}

// Platné rozsahy čísel stolů (zelená); ostatní čísla žlutá
function isValidTable(n) {
  n = Number(n);
  return (n >= 1 && n <= 15) || (n >= 20 && n <= 22) || (n >= 101 && n <= 117);
}

// Popisek čísla účtu pro lístek: žluté účty (mimo platné stoly) = "s sebou"
function tableLabel(n) {
  return isValidTable(n) ? String(n) : `${n} - SEBOU`;
}

function setOrderUI() {
  const tableNum = currentOrder?.table_number ?? selectedTable;
  const open = tableNum != null;
  const billNumber = document.getElementById('bill-number');
  billNumber.textContent = tableNum ?? '—';
  const field = billNumber.closest('.bill-field');
  field.classList.toggle('open', open && isValidTable(tableNum));
  field.classList.toggle('open-warn', open && !isValidTable(tableNum));
  document.getElementById('bill-total').textContent = open ? formatPrice(currentOrder?.total_price ?? 0) : '—';
  document.getElementById('pay-btn').disabled = !currentOrder;
}

// Sloučí jednotlivé stornované kusy do položek s počtem
function aggregateVoids(items) {
  const aggregated = [];
  items.forEach(item => {
    const ex = aggregated.find(a => a.product_id === item.product_id);
    if (ex) ex.quantity += item.quantity;   // dvě půlky = 1, ne 2
    else aggregated.push({ ...item });
  });
  return aggregated;
}

// Vyčistí stav otevřeného účtu
function resetOrderState() {
  currentOrder = null;
  selectedTable = null;
  selectedItemId = null;
  originalItemIds = new Set();
  newKitchenItems = [];
  voidedItems = [];
  document.getElementById('items-list').innerHTML = '';
}

// Vytiskne nevyřízené papírky (kuchyně + storno) aktuálního účtu
async function flushTickets() {
  const tableNumForPrint = currentOrder?.table_number ?? selectedTable;
  if (currentOrder && newKitchenItems.length > 0) {
    await printKitchenTicket(tableLabel(currentOrder.table_number), newKitchenItems);
  }
  if (voidedItems.length > 0 && tableNumForPrint) {
    await api('POST', '/print/void', { tableNumber: tableLabel(tableNumForPrint), items: aggregateVoids(voidedItems) });
  }
}

// Zavře aktuální účet (vytiskne papírky) pokud je nějaký otevřený
async function closeCurrentOrder() {
  if (currentOrder || selectedTable) {
    await flushTickets();
    resetOrderState();
  }
}

// Otevře / načte účet daného čísla stolu
async function openTable(tableNum) {
  await closeCurrentOrder();
  const order = await api('GET', `/orders/table/${tableNum}`);
  if (order) {
    await loadOrder(order);
  } else {
    selectedTable = tableNum;
    originalItemIds = new Set();
    newKitchenItems = [];
  }
  setOrderUI();
  refreshTakeawayBar();
}

async function handleUcet() {
  // pokud je napsané číslo, rovnou otevři ten účet; jinak jen zavři aktuální
  const tableNum = parseInt(displayValue);
  displayValue = '';
  if (tableNum) {
    await openTable(tableNum);
  } else {
    await closeCurrentOrder();
    setOrderUI();
    refreshTakeawayBar();
    showCategories();   // po zavření účtu zpět na hlavní panel
  }
  updateDisplay();
}

// ─── TISK ────────────────────────────────────────────────

async function printKitchenTicket(tableNumber, items) {
  await api('POST', '/print/kitchen', { tableNumber, items });
}

// ─── NUMPAD ──────────────────────────────────────────────
// Vygeneruje klávesnici 1–9, ⌫, 0, (✕), OK do zadaného elementu a hlídá si zadanou hodnotu.
// Bez onCancel se nekreslí křížek a OK zůstane vedle nuly (zámek při startu).
// mask = zadané číslice se zobrazí jako ●●● (heslo), jinak se ukazují.
// Vrací { value, clear() }.
function makeNumpad(padId, displayId, { maxLen = 6, mask = false, onOk, onCancel } = {}) {
  const pad = document.getElementById(padId);
  const display = document.getElementById(displayId);
  let value = '';

  const render = () => {
    display.textContent = mask ? value.replace(/./g, '●').padEnd(maxLen, '_') : (value || '_');
  };

  const key = (label, cls, onClick) => {
    const btn = document.createElement('button');
    btn.className = cls ? `np-btn ${cls}` : 'np-btn';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    pad.appendChild(btn);
  };

  const typeDigit = d => {
    if (value.length >= maxLen) return;
    value += d;
    render();
  };

  pad.innerHTML = '';
  for (const d of '123456789') key(d, '', () => typeDigit(d));
  key('⌫', 'np-del', () => { value = value.slice(0, -1); render(); });
  key('0', '', () => typeDigit('0'));
  if (onCancel) key('✕', 'np-cancel', onCancel);
  key('OK', onCancel ? 'np-ok np-wide' : 'np-ok', () => onOk(value));

  render();
  return {
    get value() { return value; },
    clear() { value = ''; render(); },
  };
}

// ─── TOAST ───────────────────────────────────────────────

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = type === 'error' ? 'toast toast-error' : 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), type === 'error' ? 3500 : 2500);
}

// ─── PLATBA ──────────────────────────────────────────────

function showPaymentPanel() {
  hide('action-grid');
  show('payment-panel');
  const tableNum = currentOrder?.table_number ?? selectedTable;
  const cls = isValidTable(tableNum) ? 'open' : 'open-warn';
  document.getElementById('bill-total').closest('.bill-field').classList.add(cls);
}

function hidePaymentPanel() {
  hide('payment-panel');
  show('action-grid');
  document.getElementById('bill-total').closest('.bill-field').classList.remove('open', 'open-warn');
}

// ─── UZÁVĚRKA PANEL ───────────────────────────────────────

async function showClosingPanel() {
  hide('action-grid');
  show('closing-panel');
  const info = document.getElementById('closing-info');
  try {
    const { closed_at } = await api('GET', '/closing/last');
    if (closed_at) {
      info.textContent = `Poslední uzávěrka: ${fmtDateTime(closed_at)}`;
    } else {
      info.textContent = 'Poslední uzávěrka: žádná';
    }
  } catch {
    info.textContent = 'Poslední uzávěrka: —';
  }
}

function hideClosingPanel() {
  hide('closing-panel');
  show('action-grid');
}

// Uzávěrka dne — to samé co dělala Uzávěrka dříve
async function doClosingDay() {
  let open;
  try { open = await api('GET', '/orders'); } catch (e) { showToast(e.message, 'error'); return; }
  if (open.length > 0) {
    showToast(`Uzávěrku nelze provést — nejdříve uzavřete všechny otevřené účty (${open.length})`, 'error');
    return;
  }
  try {
    await api('POST', '/closing');
    showToast('Uzávěrka provedena');
    hideClosingPanel();
  } catch (e) {
    showToast('Chyba uzávěrky: ' + e.message, 'error');
  }
}

// Uzávěrka měsíce — od 1. dne měsíce po teď; opakovatelná, zůstává v panelu
async function doClosingMonth() {
  try {
    await api('POST', '/closing/month');
    showToast('Měsíční uzávěrka vytištěna');
    hideClosingPanel();
  } catch (e) {
    showToast('Chyba měsíční uzávěrky: ' + e.message, 'error');
  }
}

// Položková uzávěrka — od poslední položkové uzávěrky po teď; vypíše prodané produkty + celkem
async function doClosingItems() {
  try {
    await api('POST', '/closing/items');
    showToast('Položková uzávěrka vytištěna');
    hideClosingPanel();
  } catch (e) {
    showToast('Chyba položkové uzávěrky: ' + e.message, 'error');
  }
}

async function handlePayment(type) {
  if (!currentOrder) return;

  await flushTickets();
  await api('POST', '/print/receipt', { orderId: currentOrder.id, paymentType: type });

  resetOrderState();
  hidePaymentPanel();
  setOrderUI();
  refreshTakeawayBar();
  showCategories();   // po zavření účtu zpět na hlavní panel
}

// ─── OTEVŘENÉ ÚČTY ───────────────────────────────────────

async function openAccountsModal() {
  const list = document.getElementById('modal-accounts-list');
  list.innerHTML = '';

  const orders = await api('GET', '/orders');
  if (orders.length === 0) {
    list.innerHTML = '<div class="modal-empty">Žádné otevřené účty</div>';
  } else {
    orders.forEach(order => {
      const row = document.createElement('div');
      row.className = 'modal-account-row';
      const valid = isValidTable(order.table_number);
      const tableClass = 'modal-account-table' + (valid ? '' : ' warn');
      const tableLabel = valid ? order.table_number : `${order.table_number} - přijde`;
      row.innerHTML = `
        <span class="${tableClass}">${esc(tableLabel)}</span>
        <span class="modal-account-total">${formatPrice(order.total_price)}</span>
      `;
      row.addEventListener('click', () => {
        closeAccountsModal();
        loadOrder(order);
      });
      list.appendChild(row);
    });
  }

  show('modal-accounts');
}

const closeAccountsModal = () => hide('modal-accounts');

// ─── LIŠTA "S SEBOU" (dole vlevo) ─────────────────────────

async function refreshTakeawayBar() {
  const bar = document.getElementById('takeaway-bar');
  let orders;
  try { orders = await api('GET', '/orders'); } catch { return; }
  const taken = new Set(orders.map(o => Number(o.table_number)));
  const active = Number(currentOrder?.table_number ?? selectedTable);
  if (!Number.isNaN(active)) taken.add(active);

  bar.innerHTML = '';
  TAKEAWAY_NUMBERS.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'takeaway-btn ' + (taken.has(n) ? 'taken' : 'free');
    btn.textContent = n;
    btn.addEventListener('click', () => openTakeaway(n));
    bar.appendChild(btn);
  });
}

async function openTakeaway(n) {
  displayValue = '';
  await openTable(n);
  updateDisplay();
}

// ─── STORNA (Majmun) ──────────────────────────────────────

async function openVoidsModal() {
  const list = document.getElementById('modal-voids-list');
  list.innerHTML = '';
  let voids;
  try { voids = await api('GET', '/voids/since-closing'); }
  catch (e) { showToast(e.message, 'error'); return; }

  if (voids.length === 0) {
    list.innerHTML = '<div class="modal-empty">Žádná storna</div>';
  } else {
    voids.forEach(v => {
      const when = fmtDateTime(v.voided_at);
      const table = v.table_number ?? '—';
      const sub = v.total_price != null
        ? `účet ${formatPrice(v.total_price)} · stůl ${esc(table)} · ${when}`
        : `<span class="mv-deleted">! celý účet smazán</span> · ${when}`;
      const row = document.createElement('div');
      row.className = 'modal-void-row';
      row.innerHTML = `
        <div class="mv-top">
          <span class="mv-name">${formatQty(v.quantity)}× ${esc(v.name)}</span>
          <span class="mv-amount">${formatPrice(v.unit_price * v.quantity)}</span>
        </div>
        <div class="mv-sub">${sub}</div>
      `;
      list.appendChild(row);
    });
  }

  show('modal-voids');
}

const closeVoidsModal = () => hide('modal-voids');

const openCreditsModal = () => show('modal-credits');

const closeCreditsModal = () => hide('modal-credits');

// ─── SEPARACE ÚČTU ────────────────────────────────────────

let sepSource = [];        // [{uid, product_id, name, unit_price, quantity}]
let sepTarget = [];
let sepSelectedUid = null;
let sepSourceOrderId = null;
let sepSourceTable = null;
let sepTargetTable = null;
let sepNumPad = null;   // vytvoří ho setupSepNumModal()
let sepMode = 'separate';   // 'separate' | 'partpay'

let sepUidCounter = 0;
const sepUid = () => ++sepUidCounter;

// Převede DB položky na řádky separace — každý řádek zvlášť (NESLUČUJE, zachová např. půlky)
function toSepLines(items) {
  return items.map(it => ({
    uid: sepUid(),
    product_id: it.product_id,
    name: it.name,
    unit_price: Number(it.unit_price),
    quantity: Number(it.quantity),
  }));
}

// Připraví položky k odeslání na server (jen potřebná pole)
const sepPayload = list => list.map(it => ({ product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price }));

// — malé okno: číslo cílového účtu —

function openSeparateNumModal() {
  if (!currentOrder) { showToast('Nejdřív otevři účet s položkami', 'error'); return; }
  sepNumPad.clear();
  show('modal-sep-num');
}

const closeSepNumModal = () => hide('modal-sep-num');

async function confirmSepTarget(value) {
  const target = parseInt(value);
  if (!target) return;
  if (target === Number(currentOrder.table_number)) {
    showToast('Cílový účet musí být jiný', 'error');
    return;
  }
  closeSepNumModal();
  await startSeparation(target);
}

function setupSepNumModal() {
  sepNumPad = makeNumpad('sep-num-numpad', 'sep-num-display', {
    maxLen: 4,
    onOk: confirmSepTarget,
    onCancel: closeSepNumModal,
  });
}

// — velké okno: rozdělení položek —

// Okno rozdělení položek. 'separate' = přesun na jiný účet (target = jeho číslo),
// 'partpay' = platba části účtu (target je null, pravý sloupec je "k platbě").
async function openSepModal(mode, target) {
  sepMode = mode;
  sepSourceOrderId = currentOrder.id;
  sepSourceTable = currentOrder.table_number;
  sepTargetTable = target;
  sepSelectedUid = null;
  sepHistory = [];

  sepSource = toSepLines(await api('GET', `/orders/${sepSourceOrderId}/items`));

  // u separace předvyplnit položky cílového účtu, pokud už existuje
  sepTarget = [];
  if (target != null) {
    const dstOrder = await api('GET', `/orders/table/${target}`);
    if (dstOrder) sepTarget = toSepLines(await api('GET', `/orders/${dstOrder.id}/items`));
  }

  const partpay = mode === 'partpay';
  document.getElementById('sep-title').textContent = partpay ? 'Platba části účtu' : 'Separace účtu';
  document.getElementById('sep-src-num').textContent = sepSourceTable;
  document.getElementById('sep-dst-head').textContent = partpay ? 'K platbě' : `Účet ${target}`;
  document.getElementById('sep-done').textContent = partpay ? 'Platba' : 'Hotovo';
  showSepMainActions();
  renderSepLists();
  show('modal-separate');
}

const startSeparation = target => openSepModal('separate', target);

// — platba části účtu: stejné okno, vpravo bez čísla účtu, místo Hotovo je Platba —

function openPartialPayment() {
  if (!currentOrder) { showToast('Nejdřív otevři účet s položkami', 'error'); return; }
  return openSepModal('partpay', null);
}

function showSepMainActions() {
  show('sep-actions-main');
  hide('sep-pay-choice');
}

function showSepPayChoice() {
  hide('sep-actions-main');
  show('sep-pay-choice');
}

// Tlačítko Hotovo/Platba — podle režimu
function sepConfirm() {
  if (sepMode === 'partpay') {
    if (sepTarget.length === 0) { showToast('Nic k zaplacení', 'error'); return; }
    showSepPayChoice();
  } else {
    sepDone();
  }
}

// Odešle rozdělení na server a znovu načte zdrojový účet — ten mohl zůstat
// se zbytkem položek, nebo se celý vyprázdnit (pak už na serveru není).
async function sepSubmit(endpoint, body, chyba) {
  try {
    await api('POST', `/orders/${sepSourceOrderId}/${endpoint}`, body);
  } catch (e) {
    showToast(`${chyba}: ${e.message}`, 'error');
    return;
  }
  closeSeparateModal();

  const srcTable = sepSourceTable;
  resetOrderState();
  const order = await api('GET', `/orders/table/${srcTable}`);
  if (order) await loadOrder(order);
  else setOrderUI();
  refreshTakeawayBar();
}

const partPay = type => sepSubmit('partial-pay', {
  paymentType: type,
  sourceItems: sepPayload(sepSource),
  paidItems: sepPayload(sepTarget),
}, 'Chyba platby');

function makeSepRow(it, selectable) {
  const row = document.createElement('div');
  row.className = 'sep-row' + (selectable && it.uid === sepSelectedUid ? ' selected' : '');
  row.innerHTML = `
    <span>${formatQty(it.quantity)}× ${esc(it.name)}</span>
    <span>${formatPrice(it.unit_price * it.quantity)}</span>
  `;
  if (selectable) {
    row.addEventListener('click', () => {
      sepSelectedUid = sepSelectedUid === it.uid ? null : it.uid;
      renderSepLists();
    });
  }
  return row;
}

function renderSepLists() {
  const srcList = document.getElementById('sep-src-list');
  const dstList = document.getElementById('sep-dst-list');
  srcList.innerHTML = '';
  dstList.innerHTML = '';
  sepSource.forEach(it => srcList.appendChild(makeSepRow(it, true)));
  sepTarget.forEach(it => dstList.appendChild(makeSepRow(it, false)));
}

// Nový řádek na druhé straně (NESLUČUJE — každý přesun je samostatný řádek)
function sepPushLine(list, it, amount) {
  list.push({ uid: sepUid(), product_id: it.product_id, name: it.name, unit_price: it.unit_price, quantity: amount });
}

// Historie pro krok zpět (tlačítko "<")
let sepHistory = [];
function sepSnapshot() {
  sepHistory.push({
    source: sepSource.map(o => ({ ...o })),
    target: sepTarget.map(o => ({ ...o })),
    selectedUid: sepSelectedUid,
  });
}
function sepUndo() {
  const prev = sepHistory.pop();
  if (!prev) return;
  sepSource = prev.source;
  sepTarget = prev.target;
  sepSelectedUid = prev.selectedUid;
  renderSepLists();
}

function sepMoveOne() {
  if (sepSelectedUid == null) return;
  const idx = sepSource.findIndex(o => o.uid === sepSelectedUid);
  if (idx === -1) return;
  sepSnapshot();
  const it = sepSource[idx];
  const amount = it.quantity >= 1 ? 1 : it.quantity;   // u půlky přesune 0,5
  it.quantity -= amount;
  sepPushLine(sepTarget, it, amount);
  if (it.quantity <= 0.0001) {
    sepSource.splice(idx, 1);
    sepSelectedUid = null;
  }
  renderSepLists();
}

function sepMoveAll() {
  if (!sepSource.length) return;
  sepSnapshot();
  sepSource.forEach(it => sepPushLine(sepTarget, it, it.quantity));
  sepSource = [];
  sepSelectedUid = null;
  renderSepLists();
}

const closeSeparateModal = () => hide('modal-separate');

const sepDone = () => sepSubmit('separate', {
  targetTable: sepTargetTable,
  sourceItems: sepPayload(sepSource),
  targetItems: sepPayload(sepTarget),
}, 'Chyba separace');

// ─── PIN MODAL ───────────────────────────────────────────

let pinPad = null;      // vytvoří ho setupPinModal()
let pinCallback = null;

function openPinModal(onSuccess) {
  pinCallback = onSuccess;
  pinPad.clear();
  document.getElementById('pin-error').textContent = '';
  show('modal-pin');
}

function closePinModal() {
  hide('modal-pin');
  pinPad.clear();
  pinCallback = null;
}

async function submitPin(kod) {
  if (!kod) return;
  let valid;
  try { ({ valid } = await api('POST', '/verify-pin', { pin: kod })); }
  catch (e) { showToast(e.message, 'error'); return; }
  if (valid) {
    const cb = pinCallback;
    closePinModal();
    if (cb) cb();
  } else {
    pinPad.clear();
    const err = document.getElementById('pin-error');
    err.textContent = 'Špatné heslo';
    setTimeout(() => { err.textContent = ''; }, 2000);
  }
}

function setupPinModal() {
  pinPad = makeNumpad('pin-numpad', 'pin-display', {
    mask: true,
    onOk: submitPin,
    onCancel: closePinModal,
  });
}

async function loadOrder(order) {
  await flushTickets();   // vyřídí papírky předchozího účtu před přepnutím
  currentOrder = order;
  selectedTable = null;
  selectedItemId = null;
  newKitchenItems = [];
  voidedItems = [];
  const items = await api('GET', `/orders/${order.id}/items`);
  originalItemIds = new Set(items.map(i => i.id));
  renderItems(items);
  scrollItemsToBottom();   // u dlouhého účtu ukázat poslední položky
  setOrderUI();
}

// ─── ZVUK KLIKNUTÍ ────────────────────────────────────────

let clickAudioCtx = null;
// Krátké pípnutí při každém kliknutí (generované, žádný zvukový soubor není potřeba)
function playClickSound() {
  try {
    if (!clickAudioCtx) clickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (clickAudioCtx.state === 'suspended') clickAudioCtx.resume();
    const t = clickAudioCtx.currentTime;
    const osc = clickAudioCtx.createOscillator();
    const gain = clickAudioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1.25, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain).connect(clickAudioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  } catch {}
}

// ─── ZÁMEK PŘI STARTU ─────────────────────────────────────

let lockPad = null;     // vytvoří ho setupLockScreen()

async function submitLock(code) {
  if (!code) return;
  let valid;
  try { ({ valid } = await api('POST', '/verify-startup', { code })); }
  catch { valid = false; }
  lockPad.clear();
  if (valid) {
    hide('lock-screen');
  } else {
    const err = document.getElementById('lock-error');
    err.textContent = 'Špatný kód';
    setTimeout(() => { err.textContent = ''; }, 2000);
  }
}

function setupLockScreen() {
  lockPad = makeNumpad('lock-numpad', 'lock-display', { mask: true, onOk: submitLock });
}

// ─── ADMIN ────────────────────────────────────────────────

let adminProducts = [];
let adminCategories = [];
let editingProduct = null;   // null = nový produkt

function adminFmt(v) {
  const n = Number(v);
  return (Number.isInteger(n) ? String(n) : n.toFixed(2)).replace('.', ',');
}

async function openAdmin() {
  document.getElementById('admin-prod-search').value = '';
  document.getElementById('admin-cat-search').value = '';
  try {
    adminCategories = await api('GET', '/categories');
    adminProducts = await api('GET', '/admin/products');
  } catch (e) { showToast(e.message, 'error'); return; }
  renderAdminProducts();
  renderAdminCategories();
  adminSwitchTab('products');
  show('modal-admin');
}

function closeAdmin() {
  hide('modal-admin');
  refreshMainTiles();   // promítni změny do dlaždic kasy
}

function adminSwitchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('admin-products').classList.toggle('hidden', tab !== 'products');
  document.getElementById('admin-categories').classList.toggle('hidden', tab !== 'categories');
}

function renderAdminProducts() {
  const q = (document.getElementById('admin-prod-search').value || '').trim().toLowerCase();
  const list = document.getElementById('admin-prod-list');
  list.innerHTML = '';
  const items = adminProducts.filter(p =>
    !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q)
  );
  if (!items.length) {
    list.appendChild(el('div', 'modal-empty', 'Nic nenalezeno'));
    return;
  }
  items.forEach(p => {
    const row = el('div', 'admin-prod-row' + (p.active ? '' : ' inactive'));
    row.append(el('span', 'apr-plu', p.id), el('span', 'apr-name', p.name));
    if (!p.active) row.append(el('span', 'apr-badge', 'skrytý'));
    row.append(el('span', 'apr-price', adminFmt(p.price) + ' Kč'));
    row.addEventListener('click', () => openProdEdit(p));
    list.appendChild(row);
  });
}

function renderAdminCategories() {
  const q = (document.getElementById('admin-cat-search').value || '').trim().toLowerCase();
  const list = document.getElementById('admin-cat-list');
  list.innerHTML = '';
  const cats = adminCategories.filter(c =>
    !q || c.name.toLowerCase().includes(q) || String(c.id).includes(q)
  );
  if (!cats.length) {
    list.appendChild(el('div', 'modal-empty', q ? 'Nic nenalezeno' : 'Žádné kategorie'));
    return;
  }
  cats.forEach(c => {
    const row = el('div', 'admin-cat-row');
    const barva = el('span', 'acr-color');
    barva.style.background = c.color || CAT_COLORS[c.id % CAT_COLORS.length];
    row.append(barva, el('span', 'admin-cat-id', c.id), el('span', 'acr-name', c.name));
    if (c.numbered) row.append(el('span', 'apr-badge', 'číslované'));
    if (c.addon_category_id) {
      const doplnek = adminCategories.find(x => x.id === c.addon_category_id);
      row.append(el('span', 'apr-badge', `+ ${doplnek ? doplnek.name : c.addon_category_id}`));
    }
    row.addEventListener('click', () => openCatEdit(c));
    list.appendChild(row);
  });
}

async function reloadAdminProducts() {
  adminProducts = await api('GET', '/admin/products');
  renderAdminProducts();
}

async function reloadAdminCategories() {
  adminCategories = await api('GET', '/categories');
  renderAdminCategories();
}

let editingCategory = null;   // null = nová kategorie
let editingColor = null;      // vybraná barva v okně kategorie

// Nabídka doplňkové kategorie — všechny kromě té upravované
function renderAddonSelect(category) {
  const sel = document.getElementById('ce-addon');
  sel.innerHTML = '';
  sel.appendChild(new Option('— žádná —', ''));
  adminCategories
    .filter(c => !category || c.id !== category.id)
    .forEach(c => sel.appendChild(new Option(c.name, c.id)));
  sel.value = category?.addon_category_id ?? '';
}

// Paleta barev — klik vybere, vybraná má rámeček
function renderColorPicker(vybrana) {
  const box = document.getElementById('ce-colors');
  box.innerHTML = '';
  editingColor = vybrana || null;
  CAT_COLORS.forEach(barva => {
    const sw = el('button', 'ce-color' + (barva === editingColor ? ' on' : ''));
    sw.style.background = barva;
    sw.addEventListener('click', () => {
      editingColor = barva;
      renderColorPicker(barva);
    });
    box.appendChild(sw);
  });
}

function openCatEdit(category) {
  editingCategory = category || null;
  document.getElementById('cat-edit-title').textContent = category ? `Úprava — ${category.name}` : 'Nová kategorie';
  document.getElementById('ce-name').value = category ? category.name : '';
  document.getElementById('ce-numbered').checked = category ? !!category.numbered : false;
  renderAddonSelect(category);
  renderColorPicker(category?.color ?? CAT_COLORS[0]);
  document.getElementById('ce-error').textContent = '';
  document.getElementById('ce-delete').style.display = category ? '' : 'none';
  show('modal-cat-edit');
  document.getElementById('ce-name').focus();
}

function closeCatEdit() {
  hide('modal-cat-edit');
  editingCategory = null;
}

async function saveCat() {
  const errEl = document.getElementById('ce-error');
  const name = document.getElementById('ce-name').value.trim();
  if (!name) { errEl.textContent = 'Vyplň název.'; return; }
  const payload = {
    name,
    numbered: document.getElementById('ce-numbered').checked,
    color: editingColor,
    addon_category_id: document.getElementById('ce-addon').value || null,
  };
  try {
    if (editingCategory) await api('PUT', `/admin/categories/${editingCategory.id}`, payload);
    else await api('POST', '/admin/categories', payload);
  } catch (e) { errEl.textContent = e.message; return; }
  closeCatEdit();
  await reloadAdminCategories();
  showToast('Uloženo');
}

async function deleteCat() {
  if (!editingCategory) return;
  if (!confirm(`Smazat kategorii "${editingCategory.name}"? Produkty zůstanou, jen ztratí tuto kategorii.`)) return;
  try { await api('DELETE', `/admin/categories/${editingCategory.id}`); }
  catch (e) { document.getElementById('ce-error').textContent = e.message; return; }
  closeCatEdit();
  await reloadAdminCategories();
  showToast('Kategorie smazána');
}

function renderProdCats(selectedIds) {
  const box = document.getElementById('pe-cats');
  box.innerHTML = '';
  const sel = new Set((selectedIds || []).map(Number));
  adminCategories.forEach(c => {
    const zaskrtnuto = sel.has(Number(c.id));
    const chip = el('label', 'pe-cat-chip' + (zaskrtnuto ? ' on' : ''));
    const cb = el('input');
    cb.type = 'checkbox'; cb.value = c.id; cb.checked = zaskrtnuto;
    cb.addEventListener('change', () => chip.classList.toggle('on', cb.checked));
    chip.append(cb, ' ' + c.name);
    box.appendChild(chip);
  });
}

function openProdEdit(product) {
  editingProduct = product || null;
  document.getElementById('pe-error').textContent = '';
  document.getElementById('prod-edit-title').textContent = product ? `Úprava — ${product.name}` : 'Nový produkt';
  const idInput = document.getElementById('pe-id');
  idInput.value = product ? product.id : '';
  idInput.disabled = !!product;   // PLU u existujícího produktu nejde měnit
  document.getElementById('pe-name').value = product ? product.name : '';
  document.getElementById('pe-price').value = product ? adminFmt(product.price) : '';
  document.getElementById('pe-vat').value = product ? product.vat_rate : 12;
  document.getElementById('pe-group').value = product && product.sort_group ? product.sort_group : '';
  document.getElementById('pe-order').value = product && product.sort_order != null ? product.sort_order : '';
  document.getElementById('pe-kitchen').checked = product ? !!product.print_kitchen : true;
  document.getElementById('pe-active').checked = product ? !!product.active : true;
  renderProdCats(product ? product.category_ids : []);
  document.getElementById('pe-delete').style.display = product ? '' : 'none';
  show('modal-prod-edit');
}

function closeProdEdit() {
  hide('modal-prod-edit');
  editingProduct = null;
}

async function saveProd() {
  const errEl = document.getElementById('pe-error');
  const name = document.getElementById('pe-name').value.trim();
  if (!name) { errEl.textContent = 'Vyplň název.'; return; }
  const category_ids = [...document.querySelectorAll('#pe-cats input:checked')].map(cb => Number(cb.value));
  const payload = {
    name,
    price: Number(String(document.getElementById('pe-price').value).replace(',', '.')) || 0,
    vat_rate: Number(document.getElementById('pe-vat').value) || 12,
    print_kitchen: document.getElementById('pe-kitchen').checked,
    active: document.getElementById('pe-active').checked,
    sort_group: document.getElementById('pe-group').value.trim() || null,
    sort_order: document.getElementById('pe-order').value.trim(),   // prázdné = nakonec
    category_ids
  };
  try {
    if (editingProduct) {
      await api('PUT', `/admin/products/${editingProduct.id}`, payload);
    } else {
      const id = document.getElementById('pe-id').value.trim();
      if (!id) { errEl.textContent = 'Vyplň PLU (číslo).'; return; }
      await api('POST', '/admin/products', { id: Number(id), ...payload });
    }
  } catch (e) { errEl.textContent = e.message; return; }
  closeProdEdit();
  await reloadAdminProducts();
  showToast('Uloženo');
}

async function deleteProd() {
  if (!editingProduct) return;
  if (!confirm(`Smazat produkt "${editingProduct.name}"?`)) return;
  let r;
  try { r = await api('DELETE', `/admin/products/${editingProduct.id}`); }
  catch (e) { document.getElementById('pe-error').textContent = e.message; return; }
  closeProdEdit();
  await reloadAdminProducts();
  showToast(r.softDeleted ? 'Produkt byl použit → jen skryt' : 'Produkt smazán');
}

function setupAdmin() {
  document.getElementById('btn-admin').addEventListener('click', openAdmin);
  document.getElementById('modal-admin-close').addEventListener('click', closeAdmin);
  document.querySelectorAll('.admin-tab').forEach(b =>
    b.addEventListener('click', () => adminSwitchTab(b.dataset.tab)));
  document.getElementById('admin-prod-search').addEventListener('input', renderAdminProducts);
  document.getElementById('admin-cat-search').addEventListener('input', renderAdminCategories);
  document.getElementById('admin-prod-new').addEventListener('click', () => openProdEdit(null));
  document.getElementById('admin-cat-new').addEventListener('click', () => openCatEdit(null));
  document.getElementById('ce-cancel').addEventListener('click', closeCatEdit);
  document.getElementById('ce-save').addEventListener('click', saveCat);
  document.getElementById('ce-delete').addEventListener('click', deleteCat);
  document.getElementById('ce-name').addEventListener('keydown', e => { if (e.key === 'Enter') saveCat(); });
  document.getElementById('pe-cancel').addEventListener('click', closeProdEdit);
  document.getElementById('pe-save').addEventListener('click', saveProd);
  document.getElementById('pe-delete').addEventListener('click', deleteProd);
}

// ─── VYPNUTÍ KASY ─────────────────────────────────────────

const openShutdownModal = () => show('modal-shutdown');

const closeShutdownModal = () => hide('modal-shutdown');

async function doShutdown() {
  closeShutdownModal();
  try { await api('POST', '/shutdown'); } catch {}
  try { window.close(); } catch {}
}

// ─── START ────────────────────────────────────────────────

// PLU dlaždic napevno (kasa) — přenačtou se po úpravách v adminu
const FIXED_GRID_1 = ['1067', '1066', '1090', '1091', '1121', '1083', '1086', '0', '0', '1135'];
const FIXED_GRID_2 = ['7', '11', '21', '8', '15', '22'];
function refreshMainTiles() {
  showCategories();
  loadGrid('products-grid', FIXED_GRID_1);
  loadGrid('products-grid2', FIXED_GRID_2);
  refreshTakeawayBar();
}

// Obsluhy, které se nevejdou na řádek mapy
function setHalfQty() { pendingQty = 0.5; displayValue = ''; updateDisplay(); }
function addByPlu() {
  const productId = parseInt(displayValue);
  if (productId) quickAdd(productId);   // bez otevřeného účtu se ukáže toast (řeší addToOrder)
}
async function printReceiptCopy() {
  try { await api('POST', '/print/receipt/copy'); } catch (e) { showToast(e.message, 'error'); }
}
async function deleteSelectedItem() {   // bez označené položky smaže poslední na účtu
  const itemId = selectedItemId ?? currentItems[currentItems.length - 1]?.id;
  if (currentOrder && itemId) await deleteItem(itemId);
}

// Co dělá které tlačítko: id v index.html → obsluha kliknutí
const BUTTONS = {
  // účet a zadávání položek
  'btn-ucet': handleUcet,
  'btn-text': showTextPanel,
  'btn-smetana': () => quickAdd(700),
  'btn-krabice': () => quickAdd(570),
  'btn-plu': addByPlu,
  'btn-half': setHalfQty,
  'btn-inf': deleteSelectedItem,
  'btn-otevrene-ucty': openAccountsModal,
  'btn-kopie': printReceiptCopy,
  'btn-vypnout': openShutdownModal,

  // platba
  'pay-btn': () => { if (currentOrder) showPaymentPanel(); },
  'btn-pay-cash': () => handlePayment('cash'),
  'btn-pay-takeaway': () => handlePayment('takeaway'),
  'btn-pay-back': hidePaymentPanel,

  // uzávěrky (panel je za PINem)
  'btn-uzaverka': () => openPinModal(showClosingPanel),
  'btn-uzaverka-dne': doClosingDay,
  'btn-uzaverka-mesice': doClosingMonth,
  'btn-uzaverka-polozkova': doClosingItems,
  'btn-uzaverka-majmun': openVoidsModal,
  'btn-uzaverka-back': hideClosingPanel,

  // separace účtu a platba části
  'btn-separace': openSeparateNumModal,
  'btn-partpay': openPartialPayment,
  'sep-undo': sepUndo,
  'sep-move-one': sepMoveOne,
  'sep-move-all': sepMoveAll,
  'sep-done': sepConfirm,
  'sep-cancel': closeSeparateModal,
  'sep-pay-back': showSepMainActions,
  'sep-pay-cash': () => partPay('cash'),
  'sep-pay-takeaway': () => partPay('takeaway'),

  // zavírání oken
  'modal-accounts-close': closeAccountsModal,
  'modal-credits-close': closeCreditsModal,
  'modal-voids-close': closeVoidsModal,
  'shutdown-cancel': closeShutdownModal,
  'shutdown-confirm': doShutdown,
};

setupLockScreen();
setupNumpad();
setupPinModal();
setupSepNumModal();
setupAdmin();

for (const [id, onClick] of Object.entries(BUTTONS)) {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', onClick);
  else console.warn(`Tlačítko #${id} v index.html chybí`);
}

updateClock();
setInterval(updateClock, 1000);   // hodiny v display baru
document.addEventListener('click', playClickSound, true);   // zvuk při každém kliknutí

setOrderUI();
refreshMainTiles();
