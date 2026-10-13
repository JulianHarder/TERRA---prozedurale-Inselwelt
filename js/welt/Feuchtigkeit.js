/* Feuchtigkeitskarte - der zweite Wert pro Feld.
 *
 * Erst aus Hoehe UND Feuchtigkeit laesst sich ein Biom bestimmen: gleiche
 * Hoehe kann Steppe oder Sumpf sein, je nachdem wie feucht es dort ist.
 *
 * Eigener Seed-Versatz, damit die Feuchtigkeit nicht der Hoehe folgt. Dazu
 * ein kleiner Einfluss der Hoehe selbst: hohe Lagen sind etwas trockener,
 * das laesst Gebirge glaubwuerdiger aussehen.
 */
window.TERRA = window.TERRA || {};

TERRA.Feuchtigkeit = (function () {
  'use strict';

  function erzeuge(seed, e, hoehe, schritte) {
    var N = e.groesse;
    var feuchte = new Float32Array(N * N);

    var rauschen = TERRA.Rauschen.fbm({
      seed: (seed ^ 0x51ed270b) | 0,
      lagen: Math.max(3, e.lagen - 1),
      frequenz: e.frequenz * 1.5,
      dauerhaftigkeit: 0.5,
      lakunaritaet: 2
    });

    var ms = e.meeresspiegel;
    var landSpanne = (1 - ms) || 1;

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var i = y * N + x;
        var landT = (hoehe[i] - ms) / landSpanne;   // 0 an der Wasserkante, 1 am Gipfel
        if (landT < 0) landT = 0; else if (landT > 1) landT = 1;

        var v = 0.80 * rauschen(x / N, y / N) + 0.20 * (1 - landT);
        feuchte[i] = v < 0 ? 0 : (v > 1 ? 1 : v);
      }
    }

    if (schritte) schritte.feuchtigkeit = feuchte;
    return feuchte;
  }

  return { erzeuge: erzeuge };
})();
