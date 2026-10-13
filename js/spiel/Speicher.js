/* Speichern im Browser (localStorage).
 *
 * Gespeichert wird nicht die Welt - die steckt vollstaendig im Seed und in
 * den Einstellungen und ist in rund 100 ms wieder da. Gespeichert wird nur,
 * was man beim naechsten Oeffnen wiederhaben will: welcher Seed, welche
 * Reglerstellungen, welcher Bildausschnitt.
 */
window.TERRA = window.TERRA || {};

TERRA.Speicher = (function () {
  'use strict';

  var SCHLUESSEL = 'terra.stand.v2';

  function verfuegbar() {
    try {
      window.localStorage.setItem('terra.test', '1');
      window.localStorage.removeItem('terra.test');
      return true;
    } catch (fehler) {
      return false;   // privates Fenster, blockierte Seitendaten
    }
  }

  function sichern(z) {
    if (!z.welt || !verfuegbar()) return false;
    try {
      window.localStorage.setItem(SCHLUESSEL, JSON.stringify({
        version: 2,
        seed: z.welt.seed,
        einstellungen: z.einstellungen,
        blick: { x: z.entdecker.x, y: z.entdecker.y }
      }));
      return true;
    } catch (fehler) {
      return false;   // Speicher voll oder nicht erlaubt - kein Grund zum Absturz
    }
  }

  function lesen() {
    if (!verfuegbar()) return null;
    try {
      var rohtext = window.localStorage.getItem(SCHLUESSEL);
      if (!rohtext) return null;
      var stand = JSON.parse(rohtext);
      if (!stand || stand.version !== 2 || !stand.seed) return null;
      return stand;
    } catch (fehler) {
      return null;
    }
  }

  /* Einen gelesenen Stand auf die frisch erzeugte Welt anwenden. */
  function anwenden(z, stand) {
    if (!stand.blick) return;
    var N = z.welt.groesse;
    z.entdecker.x = Math.max(0, Math.min(N - 0.01, stand.blick.x));
    z.entdecker.y = Math.max(0, Math.min(N - 0.01, stand.blick.y));
  }

  function loeschen() {
    try { window.localStorage.removeItem(SCHLUESSEL); } catch (fehler) { /* egal */ }
  }

  return {
    sichern: sichern,
    lesen: lesen,
    anwenden: anwenden,
    loeschen: loeschen,
    verfuegbar: verfuegbar
  };
})();
