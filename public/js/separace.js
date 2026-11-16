'use strict';
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
    print_kitchen: it.print_kitchen,   // kvůli barevnému proužku (modrá kuchyň / zelená bar)
  }));
}

// Bar/kuchyň (ručně zadaná cena, produkty BAR_PRODUCT_ID/KUCHYN_PRODUCT_ID) se NIKDY neslučují —
// i stejná cena může být pokaždé něco jiného. Stejně tak půlky (neceločíselné množství).
const NO_MERGE_IDS = new Set([BAR_PRODUCT_ID, KUCHYN_PRODUCT_ID]);
const sepMergeable = it => Number.isInteger(it.quantity) && !NO_MERGE_IDS.has(it.product_id);

// Seřadí tak, aby produkty, co se netisknou do kuchyně (bar), byly nahoře.
// Stabilní řazení → uvnitř skupin zůstane původní pořadí.
function sortBarFirst(lines) {
  lines.sort((a, b) => (a.print_kitchen ? 1 : 0) - (b.print_kitchen ? 1 : 0));
}

// Pro platbu části účtu i separaci: celé kusy stejného produktu (a stejné ceny) sluč do jednoho
// řádku (3× alcapone); půlky i bar/kuchyň nech každou zvlášť.
function groupWholeLines(lines) {
  const out = [];
  const wholeByKey = new Map();   // "product_id|unit_price" -> sloučený řádek
  lines.forEach(it => {
    if (!sepMergeable(it)) { out.push({ ...it, uid: sepUid() }); return; }   // půlka / bar / kuchyň → zvlášť
    const key = `${it.product_id}|${it.unit_price}`;
    const ex = wholeByKey.get(key);
    if (ex) ex.quantity += it.quantity;
    else { const line = { ...it, uid: sepUid() }; wholeByKey.set(key, line); out.push(line); }
  });
  return out;
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

  // celé kusy pohromadě (3× alcapone), půlky i bar/kuchyň zvlášť — v platbě části účtu i separaci
  sepSource = groupWholeLines(toSepLines(await api('GET', `/orders/${sepSourceOrderId}/items`)));
  if (mode === 'partpay') sortBarFirst(sepSource);   // v platbě části účtu: co se netiskne do kuchyně, nahoru

  // u separace předvyplnit položky cílového účtu, pokud už existuje
  sepTarget = [];
  if (target != null) {
    const dstOrder = await api('GET', `/orders/table/${target}`);
    if (dstOrder) sepTarget = groupWholeLines(toSepLines(await api('GET', `/orders/${dstOrder.id}/items`)));
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
  row.className = 'sep-row'
    + (it.print_kitchen ? ' to-kitchen' : ' no-kitchen')
    + (selectable && it.uid === sepSelectedUid ? ' selected' : '');
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

// Nový řádek na druhé straně. Sluč celé kusy stejného produktu (a ceny) do jednoho řádku
// (platba části účtu i separace); půlky (neceločíselné) a bar/kuchyň mají vždy samostatný řádek.
function sepPushLine(list, it, amount) {
  if (Number.isInteger(amount) && !NO_MERGE_IDS.has(it.product_id)) {
    const ex = list.find(o => o.product_id === it.product_id && o.unit_price === it.unit_price && Number.isInteger(o.quantity));
    if (ex) { ex.quantity += amount; return; }
  }
  list.push({ uid: sepUid(), product_id: it.product_id, name: it.name, unit_price: it.unit_price, quantity: amount, print_kitchen: it.print_kitchen });
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

