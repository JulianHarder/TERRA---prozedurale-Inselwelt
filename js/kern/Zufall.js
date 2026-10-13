/* Zufall mit Gedaechtnis.
 *
 * Math.random() ist hier unbrauchbar: es laesst sich nicht steuern, und derselbe
 * Seed muesste dieselbe Welt ergeben. Also zwei eigene Bausteine:
 *
 *   1. hashWort()   - macht aus einem Wort eine 32-Bit-Zahl
 *   2. mulberry32() - macht aus dieser Zahl einen immer gleichen Zahlenstrom
 *
 * "nordwind" -> 2847193044 -> 0.3912, 0.8044, 0.1177, 0.9930, ... (immer identisch)
 */
window.TERRA = window.TERRA || {};

TERRA.Zufall = (function () {
  'use strict';

  // Wort -> 32-Bit-Zahl. Zwei Streuwerte parallel, damit auch aehnliche
  // Woerter ("nordwind" / "nordwin") voellig verschiedene Startzahlen ergeben.
  function hashWort(wort) {
    var h1 = 0xdeadbeef | 0;
    var h2 = 0x41c6ce57 | 0;
    for (var i = 0; i < wort.length; i++) {
      var c = wort.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((h1 ^ h2) >>> 0);
  }

  // Winziger Zufallsgenerator: gleicher Start = gleiche Folge.
  function mulberry32(start) {
    var a = start | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Ein bedienbarer Strom mit ein paar Bequemlichkeiten.
  function strom(startzahl) {
    var naechste = mulberry32(startzahl);
    return {
      zahl: startzahl,
      // 0 bis 1 (ausschliesslich 1)
      wert: naechste,
      // ganze Zahl von min bis max (einschliesslich)
      ganz: function (min, max) { return min + Math.floor(naechste() * (max - min + 1)); },
      // ein Element aus einer Liste
      ausWahl: function (liste) { return liste[Math.floor(naechste() * liste.length)]; },
      // Kommazahl in einem Bereich
      bereich: function (min, max) { return min + naechste() * (max - min); }
    };
  }

  return {
    hashWort: hashWort,
    mulberry32: mulberry32,

    // Hauptweg: aus einem Seed-Wort einen Zahlenstrom machen.
    ausWort: function (wort) {
      var s = strom(hashWort(String(wort)));
      s.wort = String(wort);
      return s;
    },

    // Nebenweg: wenn schon eine Zahl vorliegt (z. B. abgewandelter Seed).
    ausZahl: function (zahl) { return strom(zahl | 0); },

    // Ein zufaelliges Seed-Wort fuer den Wuerfel-Knopf. Hier ist Math.random()
    // erlaubt - es waehlt nur das Wort aus, nicht die Welt.
    zufallsWort: function () {
      var w = TERRA.daten.texte.zufallsWoerter;
      var a = w[Math.floor(Math.random() * w.length)];
      return a + '-' + (100 + Math.floor(Math.random() * 900));
    }
  };
})();
