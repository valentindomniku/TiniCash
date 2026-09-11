'use strict';
// ─── PIN MODAL ───────────────────────────────────────────

let pinPad = null;      // vytvoří ho setupPinModal()
let pinCallback = null;

function openPinModal(onSuccess) {
  if (SKIP_CODES) { if (onSuccess) onSuccess(); return; }   // testování — bez zadávání kódu
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
  if (SKIP_CODES) { hide('lock-screen'); return; }   // testování — kasa naběhne rovnou
  lockPad = makeNumpad('lock-numpad', 'lock-display', { mask: true, onOk: submitLock });
}

