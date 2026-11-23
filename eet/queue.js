'use strict';

// Fronta neodeslaných tržeb — čistá logika; repo (úložiště) a sender (odeslání) se injektují,
// takže jde testovat bez DB i bez sítě.
//  - Jeden odesílač v čase (serializace) → žádné duplicitní zprávy při souběhu.
//  - Rostoucí backoff mezi pokusy, strop z configu, BEZ horní meze počtu pokusů.
//  - Chyby dat {3,4,7,8} → stav 'chyba' (vyžaduje zásah), neopakovat.
//  - Dočasná chyba (-1) i výpadek/timeout (sender vyhodí) → zůstává 'ceka' (tržba se neztratí).

// Pauza před dalším pokusem roste s počtem pokusů, zastropovaná
function backoffMs(pokusy, cfg) {
  const n = Math.max(1, pokusy);
  return Math.min(cfg.retryBaseMs * 2 ** (n - 1), cfg.retryMaxMs);
}

// Je tržba připravená na (další) pokus?
function isDue(sale, now, cfg) {
  if (sale.stav !== 'ceka') return false;
  if (!sale.posledni_pokus) return true;                 // ještě se neposílalo → hned
  const last = new Date(sale.posledni_pokus).getTime();
  return (now.getTime() - last) >= backoffMs(sale.pokusy, cfg);
}

// Z výsledku odpovědi sestav, co zapsat do řádku fronty
function outcomeToUpdate(result, sale, now) {
  const base = { pokusy: sale.pokusy + 1, posledni_pokus: now, uuid_zpravy: result.uuidZpravy || sale.uuid_zpravy };
  if (result.ok) {
    return {
      ...base, stav: 'odeslano', sent_at: now,
      pok: result.pok || null,
      test_odpoved: result.test ? 1 : 0,
      kod_chyby: result.chyba ? result.chyba.kod : null,
      varovani: JSON.stringify(result.varovani || []),
      x_global_transaction_id: result.xGlobalTransactionId || null,
    };
  }
  if (result.vyzadujeZasah) {
    return {
      ...base, stav: 'chyba',
      kod_chyby: result.chyba ? result.chyba.kod : null,
      varovani: JSON.stringify(result.varovani || []),
      x_global_transaction_id: result.xGlobalTransactionId || null,
    };
  }
  // dočasná chyba (-1) nebo jiný neúspěch s odpovědí → zůstává ve frontě
  return { ...base, stav: 'ceka', kod_chyby: result.chyba ? result.chyba.kod : null };
}

// Jeden pokus o odeslání jedné tržby. sender(sale) buď vrátí výsledek, nebo vyhodí
// (síť/timeout/pád procesu uprostřed) → žádná odpoved → tržba zůstává 'ceka', jen roste pokusy.
async function processSale(repo, sender, sale, now) {
  let update;
  try {
    const result = await sender(sale);
    update = outcomeToUpdate(result, sale, now);
  } catch (e) {
    update = { pokusy: sale.pokusy + 1, posledni_pokus: now, stav: 'ceka' };
  }
  await repo.update(sale.id, update);
  return update;
}

// ── serializace: jen jeden odesílač v čase (sdílený řetěz slibů) ──
let chain = Promise.resolve();
function serialize(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => {}, () => {});   // řetěz se nikdy nezasekne na chybě
  return run;
}

// Odešle konkrétní tržbu pod zámkem. Před odesláním znovu načte stav — kdyby ji mezitím
// vyřídil jiný spouštěč (platba vs. worker), přeskočí ji → žádné duplicity.
function sendOne(repo, sender, id, nowFn = () => new Date()) {
  return serialize(async () => {
    const sale = await repo.getById(id);
    if (!sale || sale.stav !== 'ceka') return null;
    return processSale(repo, sender, sale, nowFn());
  });
}

// Projde frontu a odešle vše „due" — sekvenčně, pod zámkem.
async function tick(repo, sender, cfg, nowFn = () => new Date()) {
  const pending = await repo.getPending();   // všechny 'ceka', nejstarší první
  let odeslano = 0;
  for (const sale of pending) {
    if (!isDue(sale, nowFn(), cfg)) continue;
    await sendOne(repo, sender, sale.id, nowFn);
    odeslano++;
  }
  return odeslano;
}

module.exports = { backoffMs, isDue, outcomeToUpdate, processSale, sendOne, tick, serialize };
