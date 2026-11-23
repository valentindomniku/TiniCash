'use strict';

// Načtení pokladního certifikátu z PKCS#12 přes node-forge.
// (Testovací .p12 používají RC2-40, který Node/OpenSSL 3 bez legacy provideru nepřečte;
//  node-forge má vlastní implementaci RC2, takže to zvládne.)
// Vrací: privateKeyPem (PEM), certPem (PEM), certBase64 (DER cert v base64 pro BinarySecurityToken).

const fs = require('fs');
const forge = require('node-forge');

function loadP12(p12Path, password) {
  const der = fs.readFileSync(p12Path, 'binary');
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  const shrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
  const plain = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
  const keyBag = (shrouded && shrouded[0]) || (plain && plain[0]);
  const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];
  if (!keyBag || !keyBag.key) throw new Error('V PKCS#12 chybí privátní klíč (špatné heslo?)');
  if (!certBag || !certBag.cert) throw new Error('V PKCS#12 chybí certifikát');

  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
  const certPem = forge.pki.certificateToPem(certBag.cert);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certBag.cert)).getBytes();
  const certBase64 = forge.util.encode64(certDer);

  return { privateKeyPem, certPem, certBase64 };
}

module.exports = { loadP12 };
