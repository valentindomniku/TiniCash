'use strict';

// ── TiniCash — barový displej ──
// Otevře se na obrazovce u baru: http://<IP-počítače>:3000/bar.html
// Ukazuje pití (produkty, co se netisknou do kuchyně) čekající na výrobu, seskupené po stolech.
// Klik na kartu stolu = pití hotová → smaže je z baru (účet ani útratu to nemění).
// Samo se obnovuje, takže nové pití naskočí a odkliknuté zmizí i z jiného zařízení.

const api = async (method, path, body) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Chyba serveru');
  return data;
};

const esc = s => String(s ?? '').replace(/[&<>"]/g,
  z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[z]));
const fmtQty = q => Number(q) === 0.5 ? '1/2' : String(Number(q));

let lastSig = '';   // překresli jen při změně, ať to nebliká a neruší klikání

async function refresh() {
  let rows;
  try { rows = await api('GET', '/bar/queue'); } catch { return; }

  // skupiny podle stolu (pořadí dle času – nejstarší nahoře), uvnitř stolu sluč stejné pití
  const byTable = new Map();
  rows.forEach(r => {
    if (!byTable.has(r.table_number)) byTable.set(r.table_number, new Map());
    const items = byTable.get(r.table_number);
    const key = `${r.product_id}|${r.name}`;
    const ex = items.get(key);
    if (ex) ex.quantity += Number(r.quantity);
    else items.set(key, { name: r.name, quantity: Number(r.quantity) });
  });

  const sig = JSON.stringify([...byTable].map(([t, m]) => [t, [...m.values()]]));
  if (sig === lastSig) return;
  lastSig = sig;
  render(byTable);
}

function render(byTable) {
  const box = document.getElementById('cards');
  box.innerHTML = '';
  byTable.forEach((items, table) => {
    const card = document.createElement('div');
    card.className = 'bar-card';
    const list = [...items.values()].map(it =>
      `<div class="bar-item"><span class="bar-qty">${fmtQty(it.quantity)}×</span>` +
      `<span class="bar-name">${esc(it.name)}</span></div>`
    ).join('');
    card.innerHTML = `<div class="bar-card-head">${esc(table)}</div>` +
                     `<div class="bar-card-list">${list}</div>`;
    card.addEventListener('click', () => clearTable(table, card));
    box.appendChild(card);
  });
}

async function clearTable(table, card) {
  card.style.opacity = '0.35';   // okamžitá odezva, než doběhne server
  try { await api('POST', '/bar/clear', { table }); }
  catch { card.style.opacity = ''; return; }
  lastSig = '';   // vynuť překreslení
  refresh();
}

refresh();
setInterval(refresh, 2000);
