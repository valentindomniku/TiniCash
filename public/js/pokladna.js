'use strict';
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
  return validRanges.some(([lo, hi]) => n >= lo && n <= hi);
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

