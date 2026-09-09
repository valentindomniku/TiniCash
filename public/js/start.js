'use strict';
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

loadSettings().finally(() => {
  setOrderUI();
  refreshMainTiles();
});
