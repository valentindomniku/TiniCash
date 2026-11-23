'use strict';

// SOAP klient EET — odešle podepsanou zprávu a vrátí výsledek. Opakování řeší fronta (krok 5).
// Nikdy neloguje heslo, privátní klíč ani celý podepsaný požadavek.

const https = require('https');
const fs = require('fs');
const { URL } = require('url');
const config = require('./config');
const { parseOdpoved } = require('./response');

// Čistě síťová část: POST podepsané obálky. Vrací { statusCode, body, xGlobalTransactionId }.
function post(signedXml, timeoutMs, url = config.url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = Buffer.from(signedXml, 'utf8');
    const opts = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': config.soapAction,
        'Content-Length': body.length,
      },
      minVersion: 'TLSv1.2',     // TLS 1.2+
      rejectUnauthorized: true,  // ověřuj certifikát serveru – NIKDY nevypínat
    };
    if (config.caPath) { try { opts.ca = fs.readFileSync(config.caPath); } catch { /* ponech systémové CA */ } }

    const req = https.request(opts, res => {
      // nesledovat přesměrování
      if (res.statusCode >= 300 && res.statusCode < 400) {
        res.resume();
        return reject(new Error(`EET: přesměrování HTTP ${res.statusCode} (nesledujeme)`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        body: Buffer.concat(chunks).toString('utf8'),
        xGlobalTransactionId: res.headers['x-global-transaction-id'] || null,
      }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`EET: timeout po ${timeoutMs} ms`)));
    req.end(body);
  });
}

// Log: jen X-Global-Transaction-Id, kód výsledku a uuid_zpravy (nic citlivého)
function log(xgtid, v, uuidFallback) {
  const kod = v.pok ? `POK=${v.pok}` : (v.chyba ? `kod=${v.chyba.kod}` : 'bez vysledku');
  const uuid = v.uuidZpravy || uuidFallback || '-';
  console.log(`[EET] odpoved uuid=${uuid} ${kod}${v.test ? ' test' : ''} x-gtid=${xgtid || '-'}`);
}

// Odešle a vrátí výsledek. fromQueue → delší timeout (nikdo nečeká).
// Může vyhodit chybu (timeout/síť/nevalidní XML) — to řeší volající / fronta (tržba se neztratí).
async function odesli(signedXml, { fromQueue = false, uuidZpravy = null } = {}) {
  const timeoutMs = fromQueue ? config.timeoutQueueMs : config.timeoutMs;
  const res = await post(signedXml, timeoutMs);
  const vysledek = parseOdpoved(res.body);
  log(res.xGlobalTransactionId, vysledek, uuidZpravy);
  return { ...vysledek, xGlobalTransactionId: res.xGlobalTransactionId, httpStatus: res.statusCode };
}

module.exports = { odesli, post };
