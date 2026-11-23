'use strict';

// WS-Security podpis SOAP 1.1 obálky pro EET 2.0.
// Podepisuje se JEN soap:Body. RSA-SHA256, digest SHA-256, Exclusive C14N,
// certifikát jako BinarySecurityToken (KeyInfo → SecurityTokenReference).
// Žádné další hlavičky (Timestamp, WS-Addressing).

const { SignedXml } = require('xml-crypto');

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const WSSE = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const WSU  = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
const BASE64_ENC = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary';
const X509_VT    = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3';

const SIG_ALG = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
const C14N    = 'http://www.w3.org/2001/10/xml-exc-c14n#';
const SHA256  = 'http://www.w3.org/2001/04/xmlenc#sha256';

// Sestaví SOAP obálku kolem <Trzba> a podepíše soap:Body.
// cert = { privateKeyPem, certBase64 } (DER cert v base64, bez PEM hlaviček).
function signSoap(trzbaXml, cert) {
  const tokenId = 'X509-token';
  const envelope =
    `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}">` +
      `<soapenv:Header>` +
        `<wsse:Security xmlns:wsse="${WSSE}" xmlns:wsu="${WSU}" soapenv:mustUnderstand="1">` +
          `<wsse:BinarySecurityToken EncodingType="${BASE64_ENC}" ValueType="${X509_VT}" wsu:Id="${tokenId}">` +
            cert.certBase64 +
          `</wsse:BinarySecurityToken>` +
        `</wsse:Security>` +
      `</soapenv:Header>` +
      `<soapenv:Body>${trzbaXml}</soapenv:Body>` +
    `</soapenv:Envelope>`;

  const sig = new SignedXml({
    privateKey: cert.privateKeyPem,
    signatureAlgorithm: SIG_ALG,
    canonicalizationAlgorithm: C14N,
    idMode: 'wssecurity',            // přidá wsu:Id na podepisovaný Body a správně ho referuje
  });

  // Podepiš výhradně soap:Body (exkluzivní C14N transform, SHA-256 digest)
  sig.addReference({
    xpath: "//*[local-name(.)='Body']",
    transforms: [C14N],
    digestAlgorithm: SHA256,
  });

  // KeyInfo → SecurityTokenReference odkazující na BinarySecurityToken s certifikátem
  sig.getKeyInfoContent = () =>
    `<wsse:SecurityTokenReference xmlns:wsse="${WSSE}">` +
      `<wsse:Reference URI="#${tokenId}" ValueType="${X509_VT}"/>` +
    `</wsse:SecurityTokenReference>`;

  // Signature vlož do wsse:Security
  sig.computeSignature(envelope, {
    prefix: 'ds',
    location: { reference: "//*[local-name(.)='Security']", action: 'append' },
  });

  return sig.getSignedXml();
}

module.exports = {
  signSoap,
  constants: { SOAP_NS, WSSE, WSU, X509_VT, SIG_ALG, C14N, SHA256 },
};
