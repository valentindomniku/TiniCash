const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tinicash',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

// Obal routy — chyba kdekoliv v handleru se vrátí jako 500 (aby se try/catch neopakoval v každé routě)
const h = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Kód pro odemčení kasy při startu (ochrana, kdyby se někdo připojil na stejnou WiFi)
const STARTUP_CODE = process.env.STARTUP_CODE || '374186';

// Kód pro uzávěrky a administraci (dříve PIN majitele v tabulce owner)
const CLOSING_CODE = process.env.CLOSING_CODE || '963214';

// ─── PRÁCE S OBJEDNÁVKOU ───
// db = pool (samostatný dotaz) nebo conn (uvnitř transakce)

// Přepočítá total_price účtu z jeho položek
async function recalcOrderTotal(orderId, db = pool) {
  await db.query(
    'UPDATE orders SET total_price = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM order_items WHERE order_id = ?) WHERE id = ?',
    [orderId, orderId]
  );
}

// Vloží položky na účet; přeskočí ty s nulovým nebo záporným množstvím
async function insertItems(db, orderId, items) {
  for (const it of (items || [])) {
    const qty = parseFloat(it.quantity);
    if (!qty || qty <= 0) continue;
    await db.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
      [orderId, it.product_id, qty, it.unit_price]
    );
  }
}

// Po přepsání položek: přepočítat total, nebo účet smazat, když na něm nic nezůstalo
async function finalizeOrder(db, orderId) {
  const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM order_items WHERE order_id = ?', [orderId]);
  if (cnt === 0) {
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
  } else {
    await recalcOrderTotal(orderId, db);
  }
}

// ─── TISK NA TERMÁLNÍ TISKÁRNU ───
const PRINT_ENABLED = true;
// ─────────────────────────────────────────────────────────────────────────
const PRINTER_TARGET = process.env.PRINTER_PORT || 'USB001';
// const PRINTER_TARGET = '\\\\.\\COM3';
// ─────────────────────────────────────────────────────────────────────────
const RAWPRINT_PS = path.join(__dirname, 'rawprint.ps1');
const ESC_INIT = '\x1B\x40';      // ESC @  — inicializace tiskárny
const PAPER_CUT = '\x1D\x56\x00'; // GS V 0 — plný střih papíru
const TICKET_SIZE = '\x1D\x21\x11'; // GS ! 0x11 — 2× výška i šířka (kuchyňský/storno lístek)
// Zvýraznění CELKEM markery v textu:
//   \x01/\x02 = 2× VÝŠKA + tučně (uzávěrky — řádek v plné šířce, částka vpravo)
//   \x03/\x04 = 2× VÝŠKA I ŠÍŘKA + tučně (účtenka — kompaktní, větší)
const EMPH_ON = '\x1D\x21\x01\x1B\x45\x01';
const EMPH_OFF = '\x1B\x45\x00\x1D\x21\x00';
const BIG_ON = '\x1D\x21\x11\x1B\x45\x01';
const PRINT_WIDTH = 47;           // počet znaků na řádek (šířka účtenky i uzávěrky)
const PRINT_DIR = path.join(__dirname, 'tisky'); // složka pro tiskové výstupy (.txt)
fs.mkdirSync(PRINT_DIR, { recursive: true });

// Množství pro tisk: půlka se píše jako 1/2, jinak číslo
const fmtQtyCz = q => Number(q) === 0.5 ? '1/2' : String(Number(q));

// Termálka neumí UTF-8 → diakritiku převedeme na ASCII (ř→r, ž→z, Ň→N, …)
function asciiFold(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ─────────────────────────────────────────────────────────────────────────
// ALTERNATIVA: tiskárna na COM portu (sériově nebo USB jako virtuální COM).
// Když tiskárna NENÍ Windows tiskárna, ale sedí na COM portu (např. COM3),
// nepotřebuješ spooler ani rawprint.ps1 — píše se rovnou na port.
// Postup: nahoře nastav  const PRINTER_TARGET = '\\\\.\\COM3';
// a tělo sendToPrinter níže vyměň za toto:
// ─────────────────────────────────────────────────────────────────────────
// function sendToPrinter(text, big = false) {
//   if (!PRINT_ENABLED) return;
//   try {
//     const size = big ? TICKET_SIZE : '';
//     const body = asciiFold(text).replace(/\x01/g, EMPH_ON).replace(/\x02/g, EMPH_OFF).replace(/\x03/g, BIG_ON).replace(/\x04/g, EMPH_OFF);
//     const payload = ESC_INIT + size + body + '\n\n\n\n' + PAPER_CUT;
//     fs.writeFileSync(PRINTER_TARGET, Buffer.from(payload, 'latin1'));
//   } catch (e) {
//     console.error(`Tisk selhal (${PRINTER_TARGET}): ${e.message}`);
//   }
// }
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// Pošle text na tiskárnu jako RAW přes Windows spooler (+ střih). big = 2× velikost písma.
// Chyba tisku NESMÍ shodit operaci — jen se zaloguje do konzole serveru.
// ─────────────────────────────────────────────────────────────────────────
function sendToPrinter(text, big = false) {
  if (!PRINT_ENABLED) return;
  try {
    const size = big ? TICKET_SIZE : '';
    const body = asciiFold(text).replace(/\x01/g, EMPH_ON).replace(/\x02/g, EMPH_OFF).replace(/\x03/g, BIG_ON).replace(/\x04/g, EMPH_OFF);
    const payload = ESC_INIT + size + body + '\n\n\n\n' + PAPER_CUT;
    const b64 = Buffer.from(payload, 'latin1').toString('base64');
    execFile('powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RAWPRINT_PS, '-Target', PRINTER_TARGET, '-Data', b64],
      { windowsHide: true },
      (err, stdout, stderr) => { if (err) console.error(`Tisk selhal: ${(stderr || err.message).trim()}`); }
    );
  } catch (e) {
    console.error(`Tisk selhal: ${e.message}`);
  }
}
// ─────────────────────────────────────────────────────────────────────────

// Zapíše text do .txt (záloha/log) a zároveň vytiskne (big = 2× velikost písma)
function writeAndPrint(filename, text, big = false) {
  // do .txt bez řídicích markerů zvýraznění (\x01–\x04)
  fs.writeFileSync(path.join(PRINT_DIR, filename), text.replace(/[\x01\x02\x03\x04]/g, ''), 'utf8');
  sendToPrinter(text, big);
}

// Categories
app.get('/api/categories', h(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
  res.json(rows);
}));

// Products (optionally filtered by category)
app.get('/api/products', h(async (req, res) => {
  const { category, ids } = req.query;
  let query, params = [];
  if (ids) {
    // hromadné načtení podle seznamu PLU (dlaždice kasy, panel Text) — jedním dotazem
    const seznam = String(ids).split(',').map(Number).filter(Number.isInteger);
    if (!seznam.length) return res.json([]);
    query = 'SELECT * FROM products WHERE id IN (?)';
    params = [seznam];
  } else if (category) {
    query = `SELECT p.*, ? AS first_category_id
             FROM products p
             JOIN product_categories pc ON p.id = pc.product_id
             WHERE pc.category_id = ? AND p.active = TRUE
             ORDER BY p.sort_order IS NULL, p.sort_order, p.id`;
    params = [category, category];
  } else {
    query = `SELECT p.*, MIN(pc.category_id) AS first_category_id
             FROM products p
             LEFT JOIN product_categories pc ON p.id = pc.product_id
             WHERE p.active = TRUE
             GROUP BY p.id
             ORDER BY p.sort_order IS NULL, p.sort_order, p.id`;
  }
  const [rows] = await pool.query(query, params);
  res.json(rows);
}));

// Get product by PLU id
app.get('/api/products/:id', h(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Produkt nenalezen' });
  res.json(rows[0]);
}));

// Get all open orders
app.get('/api/orders', h(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE status = "open" ORDER BY table_number'
  );
  res.json(rows);
}));

// Get open order for table
app.get('/api/orders/table/:tableNumber', h(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE table_number = ? AND status = "open" ORDER BY created_at DESC LIMIT 1',
    [req.params.tableNumber]
  );
  res.json(rows[0] || null);
}));

// Create new order
app.post('/api/orders', h(async (req, res) => {
  const { table_number } = req.body;
  const [result] = await pool.query('INSERT INTO orders (table_number) VALUES (?)', [table_number]);
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
  res.json(rows[0]);
}));

// Get order by id
app.get('/api/orders/:id', h(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Objednávka nenalezena' });
  res.json(rows[0]);
}));

// Get order items
app.get('/api/orders/:id/items', h(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT oi.*, p.name, p.print_kitchen
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [req.params.id]
  );
  res.json(rows);
}));

// Add item to order
app.post('/api/orders/:id/items', h(async (req, res) => {
  const { product_id, quantity, unit_price } = req.body;
  const orderId = req.params.id;

  const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [product_id]);
  if (!products.length) return res.status(404).json({ error: 'Produkt nenalezen' });

  const qty = parseFloat(quantity) || 1;
  // volitelná ruční cena (BAR/KUCHYŇ); jinak cena produktu z ceníku
  const price = (unit_price !== undefined && unit_price !== null && unit_price !== '')
    ? parseFloat(unit_price)
    : products[0].price;
  const [result] = await pool.query(
    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
    [orderId, product_id, qty, price]
  );
  const itemId = result.insertId;

  await recalcOrderTotal(orderId);

  const [items] = await pool.query(
    'SELECT oi.*, p.name, p.print_kitchen FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.id = ?',
    [itemId]
  );
  res.json(items[0]);
}));

// Decrement item quantity (delete row when reaches 0)
app.delete('/api/orders/:id/items/:itemId', h(async (req, res) => {
  const { id, itemId } = req.params;
  const [rows] = await pool.query('SELECT * FROM order_items WHERE id = ? AND order_id = ?', [itemId, id]);
  if (!rows.length) return res.status(404).json({ error: 'Položka nenalezena' });

  const item = rows[0];
  // z položky s množstvím > 1 ubere jedno smazání jeden kus, jinak celý zbytek (např. půlku)
  const qty = Number(item.quantity);
  const voided = qty > 1 ? 1 : qty;

  if (req.query.log === 'true') {
    await pool.query(
      'INSERT INTO void_log (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
      [id, item.product_id, voided, item.unit_price]
    );
  }

  if (qty > 1) {
    await pool.query('UPDATE order_items SET quantity = quantity - 1 WHERE id = ?', [itemId]);
  } else {
    await pool.query('DELETE FROM order_items WHERE id = ?', [itemId]);
  }

  await recalcOrderTotal(id);
  res.json({ success: true });
}));

// Delete order
app.delete('/api/orders/:id', h(async (req, res) => {
  await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

// Separace účtu — přepíše položky zdrojového i cílového účtu podle rozdělení z klienta
app.post('/api/orders/:id/separate', h(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const sourceId = req.params.id;
    const { targetTable, sourceItems, targetItems } = req.body;
    if (!targetTable) return res.status(400).json({ error: 'Chybí číslo cílového účtu' });

    await conn.beginTransaction();

    const [srcRows] = await conn.query('SELECT * FROM orders WHERE id = ? AND status = "open"', [sourceId]);
    if (!srcRows.length) { await conn.rollback(); return res.status(404).json({ error: 'Zdrojový účet nenalezen' }); }
    if (Number(srcRows[0].table_number) === Number(targetTable)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Cílový účet musí být jiný než zdrojový' });
    }

    // najdi nebo vytvoř otevřený cílový účet
    const [dstRows] = await conn.query(
      'SELECT * FROM orders WHERE table_number = ? AND status = "open" ORDER BY created_at DESC LIMIT 1',
      [targetTable]
    );
    let targetId;
    if (dstRows.length) {
      targetId = dstRows[0].id;
    } else {
      const [r] = await conn.query('INSERT INTO orders (table_number) VALUES (?)', [targetTable]);
      targetId = r.insertId;
    }

    // přepiš obě objednávky podle finálního stavu z klienta
    await conn.query('DELETE FROM order_items WHERE order_id = ?', [sourceId]);
    await conn.query('DELETE FROM order_items WHERE order_id = ?', [targetId]);

    await insertItems(conn, sourceId, sourceItems);
    await insertItems(conn, targetId, targetItems);

    // přepočítej total nebo smaž prázdný účet
    await finalizeOrder(conn, sourceId);
    await finalizeOrder(conn, targetId);

    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Platba části účtu — placená část (paidItems) se uloží jako nový uzavřený účet, zbytek (sourceItems) zůstane otevřený
app.post('/api/orders/:id/partial-pay', h(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const sourceId = req.params.id;
    const { paymentType, sourceItems, paidItems } = req.body;
    const payType = paymentType === 'takeaway' ? 'takeaway' : 'cash';
    if (!paidItems || !paidItems.length) return res.status(400).json({ error: 'Nic k zaplacení' });

    await conn.beginTransaction();

    const [srcRows] = await conn.query('SELECT * FROM orders WHERE id = ? AND status = "open"', [sourceId]);
    if (!srcRows.length) { await conn.rollback(); return res.status(404).json({ error: 'Účet nenalezen' }); }
    const sourceTable = srcRows[0].table_number;

    const paidTotal = paidItems.reduce((s, it) => s + parseFloat(it.quantity) * parseFloat(it.unit_price), 0);

    // nový uzavřený účet s placenou částí
    const [ins] = await conn.query(
      'INSERT INTO orders (table_number, status, closed_at, payment_type, total_price) VALUES (?, "closed", NOW(), ?, ?)',
      [sourceTable, payType, paidTotal]
    );
    const paidOrderId = ins.insertId;

    await insertItems(conn, paidOrderId, paidItems);

    // přepiš zdrojový účet na zbytek; když nezůstane nic, smaž ho
    await conn.query('DELETE FROM order_items WHERE order_id = ?', [sourceId]);
    await insertItems(conn, sourceId, sourceItems);
    await finalizeOrder(conn, sourceId);

    // účtenka na placenou část
    const [paidOrderRows] = await conn.query('SELECT * FROM orders WHERE id = ?', [paidOrderId]);
    const [paidItemRows] = await conn.query(
      'SELECT oi.*, p.name, p.vat_rate FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ? ORDER BY oi.id',
      [paidOrderId]
    );
    const text = buildReceiptText(paidOrderRows[0], paidItemRows);
    writeAndPrint('receipt.txt', text);

    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Print kitchen ticket
app.post('/api/print/kitchen', h((req, res) => {
  const { tableNumber, items } = req.body;
  const products = items.map(i => {
    // produkty s nulovou cenou (úpravy/poznámky) — bez množství
    if (Number(i.unit_price) === 0) return ` ${i.name}`;
    return `${fmtQtyCz(i.quantity)} ${i.name}`;
  });
  const SEP = '------------------------';
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  // horní řádek: číslo účtu vlevo, čas tisku vpravo (zarovnané na šířku oddělovače)
  const left = `${tableNumber}`;
  const header = left + ' '.repeat(Math.max(1, SEP.length - left.length - time.length)) + time;
  const lines = [
    header,
    SEP,
    // každý produkt: mezera, produkt, mezera, oddělovací čára (stejně nahoře i dole)
    ...products.flatMap(l => ['', l, '', SEP]),
    ''   // menší mezera dole
  ];
  writeAndPrint('kitchen_ticket.txt', lines.join('\r\n'), true);
  res.json({ success: true });
}));

// Print void ticket
app.post('/api/print/void', h((req, res) => {
  const { tableNumber, items } = req.body;
  const products = items.map(i => {
    return `-${fmtQtyCz(i.quantity)} ${i.name}`;
  });
  const lines = [
    `${tableNumber}`,
    '------------------------',
    // 2 prázdné řádky nad každým produktem (i nahoře po hlavičce) = větší mezery
    ...products.flatMap(l => ['', '', l]),
    ''   // menší mezera dole
  ];
  writeAndPrint('void_ticket.txt', lines.join('\r\n'), true);
  res.json({ success: true });
}));

// ─── SESTAVENÍ TISKOVÝCH TEXTŮ ───
// Účtenka i všechny uzávěrky mají stejnou šířku, hlavičku i formát čísel.

const sepLine = '-'.repeat(PRINT_WIDTH);
const padLine = (left, right) => left + ' '.repeat(Math.max(1, PRINT_WIDTH - left.length - right.length)) + right;
const centerLine = str => str.padStart(Math.floor((PRINT_WIDTH + str.length) / 2));
const fmtCz = v => Number(v).toFixed(2).replace('.', ',');
const fmtDateCz = d => d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTimeCz = d => d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Zvýrazněný řádek přes celou šířku: 2× výška + tučně (marker \x01/\x02),
// takže se popisek i částka zarovnají stejně jako ostatní řádky.
const bigTotalLine = (label, amount) => `\x01${padLine(label, amount)}\x02`;

// Číslo účtu vpravo u kraje, stejným zvýrazněním jako CELKEM
const bigRightLine = text => `\x01${text.padStart(PRINT_WIDTH)}\x02`;

// Hlavička provozovny — stejná na účtence i na uzávěrkách
const HEAD_LINES = [
  centerLine('PIZZERIA PINOCCHIO'),
  centerLine('Prazska 14, Prelouc'),
  centerLine('IČO: 25642006'),
];

// Sečte základ podle sazby DPH; položky musí mít quantity, unit_price a vat_rate
function vatGroupsFrom(items) {
  const groups = {};
  items.forEach(item => {
    const rate = Number(item.vat_rate);
    groups[rate] = (groups[rate] || 0) + Number(item.quantity) * Number(item.unit_price);
  });
  return groups;
}

// Rozpis DPH od nejvyšší sazby. Na termotiskárně z 'Kč' stejně zbude 'Kc' (asciiFold),
// takže se všude píše 'Kč' a stejně to vypadá i v .txt záloze tisku.
function vatLines(vatGroups) {
  const mena = 'Kč';
  const lines = [];
  for (const rate of Object.keys(vatGroups).map(Number).sort((a, b) => b - a)) {
    if (!vatGroups[rate]) continue;
    const sDph = vatGroups[rate];
    const bezDph = sDph / (1 + rate / 100);
    lines.push(padLine(`BEZ DPH ${rate}%:`, `${fmtCz(bezDph)} ${mena}`));
    lines.push(padLine(`DPH ${rate}%:`, `${fmtCz(sDph - bezDph)} ${mena}`));
    lines.push(padLine(`S DPH ${rate}%:`, `${fmtCz(sDph)} ${mena}`));
  }
  return lines;
}

// Sestaví text účtenky (sdílené pro platbu i dílčí platbu); items musí mít name + vat_rate
function buildReceiptText(order, items) {
  const total = Math.ceil(Number(order.total_price));
  const now = new Date();

  // hlavička: datum/čas (vlevo), pod tím UCET# zvýrazněný u pravého kraje
  const lines = [
    ...HEAD_LINES,
    sepLine,
    `${fmtDateCz(now)}  ${fmtTimeCz(now)}`,
    bigRightLine(`UCET#${order.table_number}`),
    sepLine,
  ];

  items.forEach(item => {
    const qty = Number(item.quantity);
    lines.push(item.name);
    lines.push(padLine(`  ${fmtQtyCz(qty)} x ${fmtCz(item.unit_price)}`, fmtCz(qty * Number(item.unit_price))));
  });

  lines.push(sepLine);
  lines.push(padLine('MEZISOUČET:', `${fmtCz(total)} Kč`));
  lines.push(...vatLines(vatGroupsFrom(items)));
  lines.push(sepLine);
  lines.push(bigTotalLine('CELKEM:', `${fmtCz(total)} Kč`));
  lines.push(sepLine);
  lines.push(centerLine('DEKUJEME ZA NAVSTEVU'));
  lines.push(centerLine('tel.: +420 466 959 048'));
  lines.push('');

  return lines.join('\r\n');
}

// Print receipt + close order
app.post('/api/print/receipt', h(async (req, res) => {
  const { orderId, paymentType } = req.body;
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!orders.length) return res.status(404).json({ error: 'Objednávka nenalezena' });
  const order = orders[0];

  const [items] = await pool.query(
    'SELECT oi.*, p.name, p.vat_rate FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ? ORDER BY oi.id',
    [orderId]
  );

  const payType = paymentType === 'takeaway' ? 'takeaway' : 'cash';
  const text = buildReceiptText(order, items);
  writeAndPrint('receipt.txt', text);

  await pool.query('UPDATE orders SET status = "closed", closed_at = NOW(), payment_type = ? WHERE id = ?', [payType, orderId]);

  res.json({ success: true });
}));

// Ověření kódu pro uzávěrky
app.post('/api/verify-pin', (req, res) => {
  res.json({ valid: req.body.pin === CLOSING_CODE });
});

// Ověření kódu pro odemčení kasy při startu
app.post('/api/verify-startup', (req, res) => {
  res.json({ valid: req.body.code === STARTUP_CODE });
});


// ─── UZÁVĚRKY ─────────────────────────────────────────────

// Sestaví text uzávěrky (stejný formát pro denní i měsíční); vatGroups je volitelný DPH rozpis
function buildClosingText(title, periodLine, orders, voidCount, voidTotal, vatGroups) {
  let cashTotal = 0, takeawayTotal = 0;
  orders.forEach(o => {
    const t = Math.ceil(Number(o.total_price));
    if (o.payment_type === 'takeaway') takeawayTotal += t;
    else cashTotal += t;
  });
  const grandTotal = cashTotal + takeawayTotal;

  const lines = [
    ...HEAD_LINES,
    sepLine,
    centerLine(title),
    periodLine,
    sepLine,
    padLine('Pocet uctenek:', String(orders.length)),
  ];

  if (voidCount != null) {
    lines.push(padLine('Stornovano:', String(voidCount)));
    lines.push(padLine('Stornovano (Kč):', `${fmtCz(voidTotal)} Kč`));
  }

  if (vatGroups && Object.keys(vatGroups).length) {
    lines.push(sepLine);
    lines.push(...vatLines(vatGroups));
  }

  lines.push(
    sepLine,
    padLine('Hotove:', `${fmtCz(cashTotal)} Kč`),
    padLine('Hotove s sebou:', `${fmtCz(takeawayTotal)} Kč`),
    sepLine,
    bigTotalLine('CELKEM:', `${fmtCz(grandTotal)} Kč`),
  );

  lines.push('');
  return lines.join('\r\n');
}

// Uzávěrka dne — od poslední uzávěrky po teď
app.post('/api/closing', h(async (req, res) => {
  const [openOrders] = await pool.query('SELECT COUNT(*) AS cnt FROM orders WHERE status = "open"');
  if (openOrders[0].cnt > 0) {
    return res.status(400).json({ error: `Nelze provést uzávěrku — otevřené účty: ${openOrders[0].cnt}` });
  }

  const [lastClosings] = await pool.query('SELECT closed_at FROM closings ORDER BY closed_at DESC LIMIT 1');
  const lastClosedAt = lastClosings.length ? lastClosings[0].closed_at : new Date(0);

  const [orders] = await pool.query(
    'SELECT total_price, payment_type FROM orders WHERE status = "closed" AND closed_at > ?',
    [lastClosedAt]
  );
  const [voids] = await pool.query(
    'SELECT COUNT(*) AS cnt, COALESCE(SUM(quantity * unit_price), 0) AS total FROM void_log WHERE voided_at > ?',
    [lastClosedAt]
  );

  const now = new Date();
  const periodLine = padLine(fmtDateCz(now), fmtTimeCz(now));
  const text = buildClosingText('UZAVERKA DNE', periodLine, orders, voids[0].cnt, Number(voids[0].total));
  writeAndPrint('closing.txt', text);

  await pool.query('INSERT INTO closings (closed_at) VALUES (NOW())');
  res.json({ success: true });
}));

// Uzávěrka měsíce — od 1. dne aktuálního měsíce po teď; opakovatelná, nic nezapisuje
app.post('/api/closing/month', h(async (req, res) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based
  const firstOfMonth = `${y}-${String(m + 1).padStart(2, '0')}-01 00:00:00`;

  const [orders] = await pool.query(
    'SELECT id, total_price, payment_type FROM orders WHERE status = "closed" AND closed_at >= ?',
    [firstOfMonth]
  );

  // DPH podle sazby ze všech položek objednávek v měsíci
  let vatGroups = {};
  if (orders.length > 0) {
    const [items] = await pool.query(
      `SELECT oi.quantity, oi.unit_price, p.vat_rate
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id IN (?)`,
      [orders.map(o => o.id)]
    );
    vatGroups = vatGroupsFrom(items);
  }

  const firstDate = new Date(y, m, 1);
  const periodLine = padLine(`${fmtDateCz(firstDate)} - ${fmtDateCz(now)}`, fmtTimeCz(now));
  const text = buildClosingText('UZAVERKA MESICE', periodLine, orders, null, null, vatGroups);
  writeAndPrint('closing_month.txt', text);

  res.json({ success: true });
}));

// Sestaví text položkové uzávěrky — seznam prodaných produktů s množstvím a celkovou cenou
function buildItemClosingText(periodLine, items, total) {
  const fmtQty = q => Number.isInteger(Number(q)) ? String(Number(q)) : String(Number(q)).replace('.', ',');

  const lines = [
    ...HEAD_LINES,
    sepLine,
    centerLine('POLOZKOVA UZAVERKA'),
    periodLine,
    sepLine,
  ];

  items.forEach(it => lines.push(padLine(it.name, fmtQty(it.qty))));

  lines.push(sepLine);
  lines.push(bigTotalLine('CELKEM:', `${fmtCz(total)} Kč`));
  lines.push('');
  return lines.join('\r\n');
}

// Položková uzávěrka — od poslední položkové uzávěrky po teď; vypíše prodané produkty + celkovou cenu
app.post('/api/closing/items', h(async (req, res) => {
  const [last] = await pool.query('SELECT closed_at FROM item_closings ORDER BY closed_at DESC LIMIT 1');
  const lastClosedAt = last.length ? last[0].closed_at : new Date(0);

  const [items] = await pool.query(
    `SELECT p.name AS name,
            SUM(oi.quantity) AS qty,
            SUM(oi.quantity * oi.unit_price) AS total
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     WHERE o.status = "closed" AND o.closed_at > ?
     GROUP BY oi.product_id, p.name
     ORDER BY p.name`,
    [lastClosedAt]
  );

  const total = items.reduce((s, it) => s + Number(it.total), 0);
  const now = new Date();
  const periodLine = padLine(fmtDateCz(now), fmtTimeCz(now));
  const text = buildItemClosingText(periodLine, items, total);
  writeAndPrint('closing_items.txt', text);

  await pool.query('INSERT INTO item_closings (closed_at) VALUES (NOW())');
  res.json({ success: true });
}));

// Poslední uzávěrka (čas)
app.get('/api/closing/last', h(async (req, res) => {
  const [rows] = await pool.query('SELECT closed_at FROM closings ORDER BY closed_at DESC LIMIT 1');
  res.json({ closed_at: rows.length ? rows[0].closed_at : null });
}));

// Storna poslední uzávěrky (mezi předposlední a poslední uzávěrkou).
// Když ještě žádná uzávěrka nebyla, vrátí všechna dosavadní storna.
app.get('/api/voids/since-closing', h(async (req, res) => {
  const [closings] = await pool.query('SELECT closed_at FROM closings ORDER BY closed_at DESC LIMIT 2');
  const upper = closings.length ? closings[0].closed_at : null;
  const lower = closings.length > 1 ? closings[1].closed_at : new Date(0);

  let sql =
    `SELECT v.quantity, v.unit_price, v.voided_at, p.name, o.table_number, o.total_price
     FROM void_log v
     JOIN products p ON v.product_id = p.id
     LEFT JOIN orders o ON v.order_id = o.id
     WHERE v.voided_at > ?`;
  const params = [lower];
  if (upper) { sql += ' AND v.voided_at <= ?'; params.push(upper); }
  sql += ' ORDER BY v.voided_at DESC';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

// Reprint last receipt
app.post('/api/print/receipt/copy', h((req, res) => {
  const tmpFile = path.join(PRINT_DIR, 'receipt.txt');
  if (!fs.existsSync(tmpFile)) return res.status(404).json({ error: 'Žádná účtenka k tisku' });
  sendToPrinter(fs.readFileSync(tmpFile, 'utf8'));
  res.json({ success: true });
}));

// ─── ADMIN: správa produktů a kategorií ───

// Prázdné pole „Pořadí" znamená bez pořadí → NULL → produkt se řadí nakonec
const cisloNeboNull = v =>
  (v === undefined || v === null || String(v).trim() === '' || Number.isNaN(Number(v))) ? null : Number(v);

// Všechny produkty (i neaktivní) + do kterých kategorií patří
app.get('/api/admin/products', h(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
  const [links] = await pool.query('SELECT product_id, category_id FROM product_categories');
  const byProduct = {};
  for (const l of links) {
    if (!byProduct[l.product_id]) byProduct[l.product_id] = [];
    byProduct[l.product_id].push(l.category_id);
  }
  res.json(rows.map(p => ({ ...p, category_ids: byProduct[p.id] || [] })));
}));

// Vytvořit produkt (PLU = id se zadává ručně)
app.post('/api/admin/products', h(async (req, res) => {
  const { id, name, price, vat_rate, print_kitchen, sort_group, sort_order, active, category_ids } = req.body;
  if (id === undefined || id === null || String(id).trim() === '' || !Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'PLU musí být celé číslo' });
  }
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Název je povinný' });
  const conn = await pool.getConnection();
  try {
    const [ex] = await conn.query('SELECT id FROM products WHERE id = ?', [id]);
    if (ex.length) return res.status(409).json({ error: `PLU ${id} už existuje` });   // uvolní finally níž
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO products (id, name, price, active, print_kitchen, sort_group, sort_order, vat_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [Number(id), String(name).trim(), Number(price) || 0, active ? 1 : 0, print_kitchen ? 1 : 0,
       sort_group || null, cisloNeboNull(sort_order), Number(vat_rate) || 12]
    );
    for (const cid of (Array.isArray(category_ids) ? category_ids : [])) {
      await conn.query('INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)', [Number(id), cid]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Upravit produkt
app.put('/api/admin/products/:id', h(async (req, res) => {
  const id = req.params.id;
  const { name, price, vat_rate, print_kitchen, sort_group, sort_order, active, category_ids } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Název je povinný' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'UPDATE products SET name = ?, price = ?, active = ?, print_kitchen = ?, sort_group = ?, sort_order = ?, vat_rate = ? WHERE id = ?',
      [String(name).trim(), Number(price) || 0, active ? 1 : 0, print_kitchen ? 1 : 0,
       sort_group || null, cisloNeboNull(sort_order), Number(vat_rate) || 12, id]
    );
    if (Array.isArray(category_ids)) {
      await conn.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
      for (const cid of category_ids) {
        await conn.query('INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)', [id, cid]);
      }
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Smazat produkt — chytře: použitý (objednávky/storna) → jen skrýt (active=0), jinak smazat natvrdo
app.delete('/api/admin/products/:id', h(async (req, res) => {
  const id = req.params.id;
  try {
    const [used] = await pool.query(
      'SELECT 1 FROM order_items WHERE product_id = ? UNION SELECT 1 FROM void_log WHERE product_id = ? LIMIT 1',
      [id, id]
    );
    if (used.length) {
      await pool.query('UPDATE products SET active = 0 WHERE id = ?', [id]);
      return res.json({ success: true, softDeleted: true });
    }
    await pool.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, softDeleted: false });
  } catch (e) {
    // kdyby přece jen držel nějaký cizí klíč — aspoň produkt skryj
    try {
      await pool.query('UPDATE products SET active = 0 WHERE id = ?', [id]);
      res.json({ success: true, softDeleted: true });
    } catch {
      throw e;
    }
  }
}));

// Barva tlačítek jen jako #rrggbb, ať se do stylu nedostane nic jiného
const barvaNeboNull = v => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())) ? v.trim() : null;

// Vytvořit kategorii
// numbered = tlačítka se popisují skupinou a pořadím místo názvu produktu
// addon_category_id = pod produkty se navíc vypíšou produkty z jiné kategorie
app.post('/api/admin/categories', h(async (req, res) => {
  const { name, numbered, color, addon_category_id } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Název je povinný' });
  const [r] = await pool.query(
    'INSERT INTO categories (name, numbered, color, addon_category_id) VALUES (?, ?, ?, ?)',
    [String(name).trim(), numbered ? 1 : 0, barvaNeboNull(color), cisloNeboNull(addon_category_id)]);
  res.json({ success: true, id: r.insertId });
}));

// Upravit kategorii
app.put('/api/admin/categories/:id', h(async (req, res) => {
  const { name, numbered, color, addon_category_id } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Název je povinný' });
  const addon = cisloNeboNull(addon_category_id);
  if (addon !== null && Number(addon) === Number(req.params.id)) {
    return res.status(400).json({ error: 'Doplňková kategorie nemůže být ta samá' });
  }
  await pool.query(
    'UPDATE categories SET name = ?, numbered = ?, color = ?, addon_category_id = ? WHERE id = ?',
    [String(name).trim(), numbered ? 1 : 0, barvaNeboNull(color), addon, req.params.id]);
  res.json({ success: true });
}));

// Smazat kategorii (spojovací řádky v product_categories se smažou kaskádou, produkty zůstanou)
app.delete('/api/admin/categories/:id', h(async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true });
}));

// Vypnutí kasy — zavře kiosk (Chrome s profilem TiniCashKiosk) a ukončí server
app.post('/api/shutdown', (req, res) => {
  res.json({ success: true });
  const quit = () => process.exit(0);
  setTimeout(() => {
    try {
      execFile('powershell.exe',
        ['-NoProfile', '-Command',
          "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*TiniCashKiosk*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"],
        { windowsHide: true }, quit);
    } catch { quit(); }
    setTimeout(quit, 3000);   // pojistka, kdyby PowerShell nedoběhl
  }, 400);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TiniCash bezi na http://localhost:${PORT}`));
