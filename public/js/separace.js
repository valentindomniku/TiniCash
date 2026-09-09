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

