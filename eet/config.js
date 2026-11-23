'use strict';

// Konfigurace EET 2.0.
// Identita připojení (URL, EIČ, provozovna, pokladna, cert, heslo) se bere VÝHRADNĚ z .env —
// žádné zabudované defaulty. Co není v .env, je null → projeví se to jako jasná chyba, ne tiché
// přepnutí na playground. Hodnoty (cert, heslo) se NIKDY necommitují.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const resolve = p => (p ? path.resolve(ROOT, p) : null);   // relativní cesty z .env vůči kořeni projektu

// Heslo k certifikátu: přímo z env, nebo ze souboru (EET_CERT_PASSWORD_FILE).
// Záměrně funkce (ne property), aby se heslo nedostalo do logu přes JSON.stringify(config).
function loadCertPassword() {
  if (process.env.EET_CERT_PASSWORD) return process.env.EET_CERT_PASSWORD;
  const file = resolve(process.env.EET_CERT_PASSWORD_FILE);
  if (!file) return null;
  try { return fs.readFileSync(file, 'utf8').trim(); }
  catch { return null; }
}

module.exports = {
  enabled: process.env.EET_ENABLED === 'true',
  soapAction: 'http://fs.gov.cz/eet/OdeslaniTrzby',
  overeni: process.env.EET_OVERENI === 'true',          // ověřovací mód (netrvalá tržba)

  // ── identita jen z .env (bez defaultů) ──
  url: process.env.EET_URL || null,
  eicPopl: process.env.EET_EIC || null,
  idProvoz: process.env.EET_ID_PROVOZ || null,          // id_jednotky
  idPokl: process.env.EET_ID_POKL || null,              // id_pokl
  certPath: resolve(process.env.EET_CERT_PATH),
  caPath: resolve(process.env.EET_CA_PATH),             // volitelný extra CA pro ověření serveru

  // ── provozní hodnoty (rozumné defaulty, v .env je řešit nemusíš) ──
  timeoutMs: Number(process.env.EET_TIMEOUT_MS || 2000),              // odeslání při platbě (nesmí blokovat prodej)
  timeoutQueueMs: Number(process.env.EET_TIMEOUT_QUEUE_MS || 15000),  // odeslání z fronty (nikdo nečeká)
  retryBaseMs: Number(process.env.EET_RETRY_BASE_MS || 30000),        // ~30 s první pauza, pak roste
  retryMaxMs: Number(process.env.EET_RETRY_MAX_MS || 900000),         // strop ~15 min
  workerIntervalMs: Number(process.env.EET_WORKER_INTERVAL_MS || 30000),
  alertAgeMs: Number(process.env.EET_ALERT_AGE_MS || 3600000),        // upozornit, když nejstarší „čeká" > 1 h

  loadCertPassword,
};
