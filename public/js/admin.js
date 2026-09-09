'use strict';
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
  document.getElementById('admin-settings').classList.toggle('hidden', tab !== 'settings');
  if (tab === 'settings') renderSettings();
}

// ─── NASTAVENÍ ───

function renderSettings() {
  document.getElementById('set-name').value = settings.shop_name ?? '';
  document.getElementById('set-address').value = settings.shop_address ?? '';
  document.getElementById('set-ico').value = settings.shop_ico ?? '';
  document.getElementById('set-phone').value = settings.shop_phone ?? '';
  document.getElementById('set-takeaway').value = settings.takeaway_numbers ?? '';
  document.getElementById('set-tables').value = settings.valid_tables ?? '';
  document.getElementById('set-error').textContent = '';
}

async function saveSettings() {
  const payload = {
    shop_name: document.getElementById('set-name').value.trim(),
    shop_address: document.getElementById('set-address').value.trim(),
    shop_ico: document.getElementById('set-ico').value.trim(),
    shop_phone: document.getElementById('set-phone').value.trim(),
    takeaway_numbers: document.getElementById('set-takeaway').value.trim(),
    valid_tables: document.getElementById('set-tables').value.trim(),
  };
  try { await api('PUT', '/admin/settings', payload); }
  catch (e) { document.getElementById('set-error').textContent = e.message; return; }
  await loadSettings();
  showToast('Nastavení uloženo');
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
  document.getElementById('set-save').addEventListener('click', saveSettings);
}

// ─── VYPNUTÍ KASY ─────────────────────────────────────────

const openShutdownModal = () => show('modal-shutdown');

const closeShutdownModal = () => hide('modal-shutdown');

async function doShutdown() {
  closeShutdownModal();
  try { await api('POST', '/shutdown'); } catch {}
  try { window.close(); } catch {}
}

