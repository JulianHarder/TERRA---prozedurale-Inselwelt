/* Der zentrale Zustand: alles, was sich zur Laufzeit aendert, liegt hier.
 *
 * Getrennt gehalten von der Welt selbst: die Welt ist das Ergebnis des Seeds
 * und aendert sich nie, der Zustand ist der Blick darauf.
 */
window.TERRA = window.TERRA || {};

TERRA.Zustand = (function () {
  'use strict';

  // Standardeinstellungen der Weltgenerierung. Die Werkstatt verstellt genau diese.
  var standard = {
    groesse: 256,          // Felder je Kante -> 65.536 Felder
    lagen: 5,              // Rauschlagen (fBm)
    frequenz: 3.0,         // Gitterweite der groebsten Lage
    dauerhaftigkeit: 0.5,  // Gewichtsverlust pro Lage
    lakunaritaet: 2.0,     // Frequenzgewinn pro Lage
    inselform: 0.62,       // 0 = kompakte Insel, 1 = Kontinent
    meeresspiegel: 0.27,
    umverteilung: 1.05,    // < 1 bergiger, > 1 flacher
    flussAb: 60,           // Fluss ab so vielen Feldern Einzugsgebiet
                           // (klein = dichtes Netz, gross = nur Hauptfluesse)
    feldPixel: 6,          // Bildpunkte je Feld (wird beim Laden eingepasst)
    namen: true,           // Regionsnamen auf der Karte zeigen
    relief: true           // Schattierung nach Gefaelle
  };

  var zustand = {
    welt: null,
    einstellungen: null,

    kamera: { x: 0, y: 0 },
    // Mitte des sichtbaren Ausschnitts, in Feldern. Ziehen mit der Maus und
    // die Richtungstasten verschieben genau diesen Punkt.
    blick: { x: 0, y: 0 }
  };

  /* Zustand auf eine neue Welt setzen. */
  function neueWelt(welt) {
    zustand.welt = welt;
    zustand.einstellungen = welt.einstellungen;
    zustand.blick.x = welt.groesse / 2;
    zustand.blick.y = welt.groesse / 2;
    return zustand;
  }

  function einstellungenKopie(ueberschreiben) {
    var e = {};
    for (var k in standard) if (standard.hasOwnProperty(k)) e[k] = standard[k];
    if (ueberschreiben) {
      /* Nur bekannte Schluessel uebernehmen. Ein gespeicherter Stand kann aus
       * einer aelteren Fassung stammen und Einstellungen enthalten, die es
       * nicht mehr gibt - die sollen nicht ewig mitwandern. */
      for (var j in standard) {
        if (standard.hasOwnProperty(j) && ueberschreiben.hasOwnProperty(j)) {
          e[j] = ueberschreiben[j];
        }
      }
    }
    return e;
  }

  zustand.standard = standard;
  zustand.neueWelt = neueWelt;
  zustand.einstellungenKopie = einstellungenKopie;
  return zustand;
})();
