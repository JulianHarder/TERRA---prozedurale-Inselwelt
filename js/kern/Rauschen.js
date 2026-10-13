/* Rauschen - sanft verlaufende Zufallswerte.
 *
 * Reiner Zufall sieht aus wie Fernsehrauschen und ist als Gelaende unbrauchbar:
 * Nachbarfelder haetten nichts miteinander zu tun. Value Noise loest das so:
 *
 *   1. Ein grobes Gitter von Stuetzpunkten, jeder mit einem Zufallswert.
 *   2. Jeder Punkt dazwischen wird aus den vier umliegenden Stuetzpunkten
 *      weich ueberblendet - nicht linear, sondern mit einer geglaetteten
 *      Kurve, sonst sieht man das Gitter als Raster im Bild.
 *
 * Darauf kommt fBm: mehrere Lagen uebereinander addieren. Jede Lage hat die
 * doppelte Frequenz und das halbe Gewicht der vorigen. Grobe Lage = Kontinent,
 * feine Lage = einzelne Felsen. Das ist die Technik hinter jeder prozedural
 * erzeugten Spielwelt.
 */
window.TERRA = window.TERRA || {};

TERRA.Rauschen = (function () {
  'use strict';

  // Streuwert fuer einen Gitterpunkt. Gleicher Seed + gleicher Punkt = gleicher Wert,
  // und das ohne Tabelle - deshalb ist das Gitter beliebig gross.
  function gitterwert(seed, x, y) {
    var h = (seed ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967295;
  }

  // Quintische Glaettung: 0 bleibt 0, 1 bleibt 1, aber die Kurve laeuft an
  // beiden Enden waagerecht aus. Dadurch verschwinden die Gitterkanten.
  function glaetten(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Eine einzelne Rauschlage an der Stelle (x, y).
  function lage(seed, x, y) {
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = glaetten(x - x0), fy = glaetten(y - y0);

    var v00 = gitterwert(seed, x0,     y0);
    var v10 = gitterwert(seed, x0 + 1, y0);
    var v01 = gitterwert(seed, x0,     y0 + 1);
    var v11 = gitterwert(seed, x0 + 1, y0 + 1);

    var oben  = v00 + (v10 - v00) * fx;
    var unten = v01 + (v11 - v01) * fx;
    return oben + (unten - oben) * fy;
  }

  /* Mehrere Lagen uebereinander (fBm).
   *
   * Rueckgabe: eine Funktion f(u, v) mit u, v von 0 bis 1 ueber die ganze Welt,
   * Ergebnis von 0 bis 1.
   *
   * Der Dreh pro Lage ist ein kleiner Trick: ohne ihn liegen alle Gitter genau
   * uebereinander und man sieht waagerechte und senkrechte Linien im Gelaende.
   */
  function fbm(opt) {
    var seed            = opt.seed | 0;
    var lagen           = opt.lagen || 5;
    var frequenz        = opt.frequenz || 3;
    var dauerhaftigkeit = opt.dauerhaftigkeit || 0.5;   // Gewichtsverlust pro Lage
    var lakunaritaet    = opt.lakunaritaet || 2;        // Frequenzgewinn pro Lage
    var drehung         = opt.drehung === undefined ? 0.7 : opt.drehung;

    // Gewichte, Frequenzen und Drehungen einmal vorab ausrechnen.
    var teile = [];
    var summe = 0;
    var f = frequenz, g = 1;
    for (var i = 0; i < lagen; i++) {
      var w = i * drehung;
      teile.push({
        seed: (seed + i * 1013904223) | 0,
        frequenz: f,
        gewicht: g,
        cos: Math.cos(w),
        sin: Math.sin(w)
      });
      summe += g;
      g *= dauerhaftigkeit;
      f *= lakunaritaet;
    }

    return function (u, v) {
      var wert = 0;
      for (var i = 0; i < teile.length; i++) {
        var t = teile[i];
        var x = (u * t.cos - v * t.sin) * t.frequenz;
        var y = (u * t.sin + v * t.cos) * t.frequenz;
        wert += lage(t.seed, x, y) * t.gewicht;
      }
      return wert / summe;
    };
  }

  return {
    gitterwert: gitterwert,
    glaetten: glaetten,
    lage: lage,
    fbm: fbm,

    /* Eine einzelne Lage als eigene Funktion - nur fuer die Werkstatt,
     * die die Lagen getrennt zeigt. */
    nurLage: function (seed, nummer, frequenz, lakunaritaet) {
      var f = frequenz * Math.pow(lakunaritaet, nummer);
      var s = (seed + nummer * 1013904223) | 0;
      var w = nummer * 0.7;
      var c = Math.cos(w), si = Math.sin(w);
      return function (u, v) {
        return lage(s, (u * c - v * si) * f, (u * si + v * c) * f);
      };
    }
  };
})();
