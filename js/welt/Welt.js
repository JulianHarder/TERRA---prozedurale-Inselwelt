/* Welt.erzeuge() - die sechs Schritte in der richtigen Reihenfolge.
 *
 *   1. Wort      -> Startzahl             (Zufall.js)
 *   2. Rauschen  -> Hoehenkarte + Insel   (Hoehenkarte.js)
 *   3. Rauschen  -> Feuchtigkeit          (Feuchtigkeit.js)
 *   4. Tabelle   -> Biome                 (Biome.js)
 *   5. Tropfen   -> Fluesse und Seen      (Fluesse.js)
 *   6. Flood Fill-> Regionen mit Namen    (Regionen.js, Namen.js)
 *
 * Das Ganze ist eine reine Funktion: gleicher Seed + gleiche Einstellungen
 * ergeben immer dieselbe Welt. Nichts hier darf von der Uhrzeit, der
 * Fenstergroesse oder Math.random() abhaengen.
 */
window.TERRA = window.TERRA || {};

TERRA.Welt = (function () {
  'use strict';

  function erzeuge(seedWort, einstellungen, schritteSammeln) {
    var beginn = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var e = einstellungen;
    var N = e.groesse;

    var zufall = TERRA.Zufall.ausWort(seedWort);
    var schritte = schritteSammeln ? {} : null;

    var hoehe = TERRA.Hoehenkarte.erzeuge(zufall.zahl, e, schritte);
    var feuchte = TERRA.Feuchtigkeit.erzeuge(zufall.zahl, e, hoehe, schritte);
    var biom = TERRA.Biome.karteBauen(hoehe, feuchte, e);
    if (schritte) schritte.biomOhneFluss = biom.slice(0);

    var wasser = TERRA.Fluesse.erzeuge(zufall, e, hoehe, schritte);
    TERRA.Fluesse.inBiomkarte(biom, wasser.fluss, wasser.seen, hoehe, e);

    var r = TERRA.Regionen.erzeuge(zufall, e, hoehe, biom);

    var welt = {
      seed: String(seedWort),
      seedZahl: zufall.zahl,
      einstellungen: e,
      groesse: N,
      hoehe: hoehe,
      feuchte: feuchte,
      biom: biom,
      fluss: wasser.fluss,
      inselVon: r.inselVon,
      merkmalVon: r.merkmalVon,
      regionen: r.regionen,
      inseln: r.inseln,
      merkmale: r.merkmale,
      anzahlRegionen: r.anzahl,
      schritte: schritte
    };

    welt.landFelder = zaehleLand(hoehe, e.meeresspiegel);
    welt.dauerMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - beginn;
    return welt;
  }

  function zaehleLand(hoehe, ms) {
    var n = 0;
    for (var i = 0; i < hoehe.length; i++) if (hoehe[i] >= ms) n++;
    return n;
  }

  return { erzeuge: erzeuge };
})();
