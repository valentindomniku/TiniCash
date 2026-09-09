'use strict';
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
  takeawayNumbers.forEach(n => {
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

