'use strict';

// Sestavení a validace datové věty EET 2.0 (element <Trzba>) podle EETXMLSchema.xsd (v4.1).
// Validace se dělá proti vzorům přímo z XSD (typy string20/25, dateTime, CastkaType, UUIDType, CZEICType).

const crypto = require('crypto');

const NS = 'http://fs.gov.cz/eet/schema/v4';

// Vzory 1:1 z EETXMLSchema.xsd
const PAT = {
  uuid:       /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
  dateTime:   /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(Z|[+\-]\d\d:\d\d)$/,
  castka:     /^((0|-?[1-9]\d{0,7})\.\d\d|-0\.(0[1-9]|[1-9]\d))$/,
  idJednotky: /^[1-9][0-9]{0,8}$/,
  string20:   /^[0-9a-zA-Z.,:;/#\-_ ]{1,20}$/,
  string25:   /^[0-9a-zA-Z.,:;/#\-_ ]{1,25}$/,
  eic:        /^CZ[0-9]{8,10}$/,
};

// Texty do EET jen ASCII bez diakritiky
function asciiFold(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}

const newUuid = () => crypto.randomUUID();

// Peníze počítáme v CELÝCH HALÉŘÍCH (integer) — žádné float chyby při sčítání/zaokrouhlení.
function toHaleru(czk) {
  const n = Number(czk);
  if (!Number.isFinite(n)) throw new Error(`Neplatná částka: ${czk}`);
  return Math.round(n * 100);
}

// Celé haléře → řetězec "X.YY" jen celočíselnou aritmetikou (bez opětovného dělení floatem)
function formatHaleru(haleru) {
  if (!Number.isInteger(haleru)) throw new Error(`Haléře musí být celé číslo: ${haleru}`);
  const sign = haleru < 0 ? '-' : '';
  const a = Math.abs(haleru);
  return `${sign}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`;
}

// CastkaType (2 desetinná místa) z částky v Kč — vždy přes celé haléře
function formatAmount(czk) {
  return formatHaleru(toHaleru(czk));
}

// dateTime s offsetem místní zóny, např. 2026-11-20T14:30:00+01:00
function formatDateTime(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();            // v minutách, kladné = východně od UTC
  const sign = off >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(off) / 60));
  const om = pad(Math.abs(off) % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`;
}

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// Validace povinných polí proti XSD vzorům → { ok, errors }
function validate(f) {
  const errors = [];
  const chk = (name, val, re) => { if (!re.test(String(val))) errors.push(`${name}="${val}" neodpovídá XSD`); };
  chk('uuid_zpravy', f.uuid, PAT.uuid);
  chk('dat_odesl', f.datOdesl, PAT.dateTime);
  chk('eic_popl', f.eicPopl, PAT.eic);
  chk('id_jednotky', f.idJednotky, PAT.idJednotky);
  chk('id_pokl', f.idPokl, PAT.string20);
  chk('porad_cis', f.poradCis, PAT.string25);
  chk('dat_trzby', f.datTrzby, PAT.dateTime);
  chk('celk_trzba', f.celkTrzba, PAT.castka);
  return { ok: errors.length === 0, errors };
}

// Sestaví element <Trzba> (řetězec). Pořadí elementů Hlavicka → Data dle XSD (atributy jsou neuspořádané).
function buildTrzba(f) {
  const hlavicka =
    `<Hlavicka uuid_zpravy="${esc(f.uuid)}" dat_odesl="${esc(f.datOdesl)}" ` +
    `prvni_zaslani="${f.prvniZaslani ? 'true' : 'false'}"` +
    (f.overeni ? ' overeni="true"' : '') + '/>';
  const data =
    `<Data eic_popl="${esc(f.eicPopl)}" id_jednotky="${esc(f.idJednotky)}" ` +
    `id_pokl="${esc(f.idPokl)}" porad_cis="${esc(f.poradCis)}" ` +
    `dat_trzby="${esc(f.datTrzby)}" celk_trzba="${esc(f.celkTrzba)}"/>`;
  return `<Trzba xmlns="${NS}">${hlavicka}${data}</Trzba>`;
}

module.exports = { NS, PAT, asciiFold, newUuid, toHaleru, formatHaleru, formatAmount, formatDateTime, validate, buildTrzba };
