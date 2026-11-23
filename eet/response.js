'use strict';

// Parsování odpovědi EET (element Odpoved). Bez sítě, čistě ze stringu — testovatelné.
// Pozn.: podpis odpovědi od FS (I.CA) se zatím NEověřuje (samostatný pozdější krok).

const { DOMParser } = require('@xmldom/xmldom');

const NS = 'http://fs.gov.cz/eet/schema/v4';
const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';

// Chyby dat, které vyžadují zásah obsluhy (ne jen opakování). Kód 6 chybu nevyvolává.
const KODY_ZASAH = new Set([3, 4, 7, 8]);

function parseDoc(xml) {
  if (typeof xml !== 'string' || !xml.trim()) throw new Error('Prázdná odpověď EET');
  const errors = [];
  const doc = new DOMParser({
    errorHandler: { error: m => errors.push(m), fatalError: m => errors.push(m), warning: () => {} },
  }).parseFromString(xml, 'text/xml');
  if (errors.length || !doc || !doc.documentElement) throw new Error('Nevalidní XML odpovědi EET');
  return doc;
}

const first = (doc, name) => doc.getElementsByTagNameNS(NS, name)[0] || null;
const all = (doc, name) => Array.from(doc.getElementsByTagNameNS(NS, name) || []);
const txt = node => (node && node.textContent ? node.textContent.trim() : '');

// Vrátí strukturovaný výsledek:
//   { ok, uuidZpravy, datPrij, datOdmit, test, pok, chyba:{kod,text}, varovani:[{kod,text}],
//     docasnaChyba, vyzadujeZasah }
function parseOdpoved(xml) {
  const doc = parseDoc(xml);

  const odpoved = first(doc, 'Odpoved');
  if (!odpoved) {
    const fault = doc.getElementsByTagNameNS(SOAP_NS, 'Fault')[0]
      || doc.getElementsByTagName('faultstring')[0];
    if (fault) throw new Error('SOAP Fault: ' + txt(fault));
    throw new Error('Odpověď neobsahuje element Odpoved');
  }

  const hlav = first(doc, 'Hlavicka');
  const potvr = first(doc, 'Potvrzeni');
  const chyba = first(doc, 'Chyba');

  const result = {
    ok: false,
    uuidZpravy: hlav ? hlav.getAttribute('uuid_zpravy') || null : null,
    datPrij: hlav ? hlav.getAttribute('dat_prij') || null : null,
    datOdmit: hlav ? hlav.getAttribute('dat_odmit') || null : null,
    test: false,
    pok: null,
    chyba: null,
    varovani: all(doc, 'Varovani').map(v => ({ kod: Number(v.getAttribute('kod_varov')), text: txt(v) })),
    docasnaChyba: false,
    vyzadujeZasah: false,
  };

  if (potvr) {
    result.pok = potvr.getAttribute('pok');
    result.test = potvr.getAttribute('test') === 'true';
    result.ok = true;
  } else if (chyba) {
    const kod = Number(chyba.getAttribute('kod'));
    result.test = chyba.getAttribute('test') === 'true';
    result.chyba = { kod, text: txt(chyba) };
    if (kod === 0) result.ok = true;                    // ověřovací mód: úspěch (bez POK)
    else if (kod === -1) result.docasnaChyba = true;    // dočasná chyba → poslat později
    else if (KODY_ZASAH.has(kod)) result.vyzadujeZasah = true;  // chyba dat → zásah
  } else {
    throw new Error('Odpoved neobsahuje Potvrzeni ani Chyba');
  }

  return result;
}

module.exports = { parseOdpoved, KODY_ZASAH };
