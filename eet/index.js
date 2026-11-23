'use strict';

// Integrační vrstva EET pro TiniCash.
//  - recordSale(conn, …): zapíše tržbu do eet_sales (stav 'ceka') UVNITŘ platební transakce,
//    takže pád/restart tržbu neztratí (odesílá se až po commitu).
//  - kickSend(id): neblokující pokus o odeslání při platbě (krátký timeout).
//  - worker: každých workerIntervalMs projde frontu (delší timeout), rostoucí backoff.
//  - status(): podklad pro viditelné upozornění v UI.

const config = require('./config');
const m = require('./message');
const { signSoap } = require('./sign');
const { loadP12 } = require('./cert');
const { odesli } = require('./client');
const queue = require('./queue');

let pool = null;
let cert = null;
let timer = null;
let senderNow = null;     // krátký timeout (při platbě)
let senderQueued = null;  // delší timeout (z fronty)
let enabled = false;      // přepínač ZAP/VYP (drží se v settings.eet_enabled, měnitelný z adminu)
let certOk = false;       // podařilo se načíst certifikát

const isOn = () => enabled && certOk;   // reálně posílat lze jen zapnuté a s certifikátem

// Uloží stav přepínače do settings (přežije restart)
async function writeEnabledSetting(val) {
  await pool.query(
    "INSERT INTO settings (skey, svalue) VALUES ('eet_enabled', ?) ON DUPLICATE KEY UPDATE svalue = VALUES(svalue)",
    [val ? 'true' : 'false']
  );
}

// Přepnutí EET z adminu (za closing PINem). Persistentní + zaloguje se.
async function setEnabled(value) {
  enabled = !!value;
  await writeEnabledSetting(enabled);
  console.log(`[EET] prepnuto na ${enabled ? 'ZAPNUTO' : 'VYPNUTO'} (admin)`);
  if (isOn()) tick().catch(() => {});   // po zapnutí hned zkus dohnat frontu
  return enabled;
}

// ── úložiště (DB) pro frontu ──
const repo = {
  async getById(id) { const [r] = await pool.query('SELECT * FROM eet_sales WHERE id = ?', [id]); return r[0] || null; },
  async getPending() { const [r] = await pool.query("SELECT * FROM eet_sales WHERE stav = 'ceka' ORDER BY created_at"); return r; },
  async update(id, f) {
    const keys = Object.keys(f);
    if (!keys.length) return;
    await pool.query(`UPDATE eet_sales SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...keys.map(k => f[k]), id]);
  },
};

// Sestaví větu a odešle. Opakovaná zpráva: stejné porad_cis/dat_trzby/celk_trzba,
// nové uuid_zpravy a dat_odesl, prvni_zaslani jen při prvním pokusu.
function makeSender(fromQueue) {
  return async (sale) => {
    const uuid = m.newUuid();
    const f = {
      uuid, datOdesl: m.formatDateTime(),
      eicPopl: config.eicPopl, idJednotky: config.idProvoz, idPokl: config.idPokl,
      poradCis: String(sale.porad_cis),
      datTrzby: m.formatDateTime(new Date(sale.dat_trzby)),
      celkTrzba: m.formatAmount(sale.celk_trzba),
      prvniZaslani: sale.pokusy === 0,
      overeni: !!sale.overeni,
    };
    const v = m.validate(f);
    if (!v.ok) {
      // lokálně nevalidní věta = chyba dat → zásah (neopakovat donekonečna)
      return { ok: false, vyzadujeZasah: true, chyba: { kod: 4, text: 'Lokální validace: ' + v.errors.join('; ') }, varovani: [], uuidZpravy: uuid };
    }
    const signed = signSoap(m.buildTrzba(f), cert);
    const res = await odesli(signed, { fromQueue, uuidZpravy: uuid });
    return { ...res, uuidZpravy: uuid };
  };
}

// Zapíše tržbu do fronty v rámci platební transakce. Vrací id řádku, nebo null (EET vypnuto).
async function recordSale(conn, { order_id, porad_cis, dat_trzby, celk_trzba }) {
  if (!isOn()) return null;
  const [r] = await conn.query(
    `INSERT INTO eet_sales (order_id, porad_cis, uuid_zpravy, dat_trzby, celk_trzba, overeni, prvni_zaslani, stav, pokusy)
     VALUES (?, ?, ?, ?, ?, ?, 1, 'ceka', 0)`,
    [order_id, String(porad_cis), m.newUuid(), dat_trzby, celk_trzba, config.overeni ? 1 : 0]
  );
  return r.insertId;
}

// Neblokující odeslání po commitu platby (krátký timeout). Chybu jen zaloguje — zbytek dořeší fronta.
function kickSend(id) {
  if (!isOn() || id == null) return;
  queue.sendOne(repo, senderNow, id).catch(e => console.error('[EET] kickSend:', e.message));
}

async function tick() {
  if (!isOn()) return;
  await queue.tick(repo, senderQueued, config);
}

// Podklad pro UI upozornění
async function status() {
  const base = {
    enabled, certOk,
    overeni: config.overeni,
    eic: config.eicPopl, idProvoz: config.idProvoz, idPokl: config.idPokl,
    ceka: 0, chyba: 0, oldestAgeMs: 0, alert: false, message: '', lastPok: null, lastSentAt: null,
  };
  if (!pool) return base;
  const [[c]] = await pool.query(
    `SELECT SUM(stav = 'ceka') AS ceka, SUM(stav = 'chyba') AS chyba,
            MIN(CASE WHEN stav = 'ceka' THEN created_at END) AS nejstarsi_ceka
     FROM eet_sales`
  );
  const [[last]] = await pool.query(
    "SELECT pok, sent_at FROM eet_sales WHERE stav = 'odeslano' AND pok IS NOT NULL ORDER BY sent_at DESC LIMIT 1"
  );
  const ceka = Number(c.ceka || 0);
  const chyba = Number(c.chyba || 0);
  const oldestAgeMs = c.nejstarsi_ceka ? Date.now() - new Date(c.nejstarsi_ceka).getTime() : 0;
  const starePrilis = oldestAgeMs > config.alertAgeMs;
  let message = '', alert = false;
  if (enabled && !certOk) { alert = true; message = 'Certifikát se nepodařilo načíst'; }
  else if (chyba > 0) { alert = true; message = `${chyba}× tržba vyžaduje zásah (chyba dat EET)`; }
  else if (enabled && starePrilis) { alert = true; message = `Nejstarší neodeslaná tržba je ${Math.round(oldestAgeMs / 60000)} min stará`; }
  return { ...base, ceka, chyba, oldestAgeMs, alert, message, lastPok: last ? last.pok : null, lastSentAt: last ? last.sent_at : null };
}

function init(dbPool) {
  pool = dbPool;
  enabled = config.enabled;   // počáteční stav z env (.env); přepíše se z DB níž
  // certifikát načteme VŽDY (ať jde zapnout z adminu bez restartu serveru)
  try { cert = loadP12(config.certPath, config.loadCertPassword()); certOk = true; }
  catch (e) { certOk = false; console.error('[EET] certifikat nelze nacist:', e.message); }
  senderNow = makeSender(false);
  senderQueued = makeSender(true);
  timer = setInterval(() => tick().catch(e => console.error('[EET] worker:', e.message)), config.workerIntervalMs);
  timer.unref();
  // dočti stav přepínače z DB (settings.eet_enabled), případně založ z env, a rozjeď frontu
  (async () => {
    try {
      const [[row]] = await pool.query("SELECT svalue FROM settings WHERE skey = 'eet_enabled'");
      if (row) enabled = row.svalue === 'true';
      else await writeEnabledSetting(enabled);
    } catch (e) { console.error('[EET] init settings:', e.message); }
    console.log(`[EET] ${enabled ? 'ZAPNUTO' : 'vypnuto'}, cert ${certOk ? 'OK' : 'CHYBI'}, eic=${config.eicPopl}`);
    if (isOn()) tick().catch(() => {});
  })();
}

module.exports = { init, recordSale, kickSend, status, setEnabled };
