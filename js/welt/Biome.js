/* Biome bestimmen: Hoehe x Feuchtigkeit -> Landschaftsart.
 *
 * Reine Nachschlagearbeit. Die Tabelle steht in js/daten/biome.js, hier ist
 * nur die Logik, die sie anwendet - deshalb kann man die Welt umgestalten,
 * ohne diese Datei anzufassen.
 */
window.TERRA = window.TERRA || {};

TERRA.Biome = (function () {
  'use strict';

  var D = null;   // wird beim ersten Aufruf geholt (Ladereihenfolge)

  function daten() {
    if (!D) D = TERRA.daten.biome;
    return D;
  }

  // Welche Feuchtespalte gilt?
  function spalte(feuchte) {
    var g = daten().feuchteGrenzen;
    if (feuchte < g.trocken) return 'trocken';
    if (feuchte < g.mittel) return 'mittel';
    return 'feucht';
  }

  /* Biom-Kennung fuer ein einzelnes Feld.
   * meeresspiegel teilt die Welt: darunter Wasser, darueber Land. */
  function fuer(hoehe, feuchte, meeresspiegel) {
    var d = daten();
    var i;

    if (hoehe < meeresspiegel) {
      // Anteil des Meeresspiegels: 0 = tiefste Stelle, 1 = Wasserkante
      var tiefeT = meeresspiegel > 0 ? hoehe / meeresspiegel : 1;
      for (i = 0; i < d.wasserStufen.length; i++) {
        if (tiefeT < d.wasserStufen[i].bis) return d.wasserStufen[i].biom;
      }
      return 'flachesWasser';
    }

    // Anteil der Landhoehe: 0 = Wasserkante, 1 = hoechster Punkt
    var landSpanne = (1 - meeresspiegel) || 1;
    var landT = (hoehe - meeresspiegel) / landSpanne;
    var sp = spalte(feuchte);
    for (i = 0; i < d.landStufen.length; i++) {
      if (landT < d.landStufen[i].bis) return d.landStufen[i][sp];
    }
    return d.landStufen[d.landStufen.length - 1][sp];
  }

  /* Die ganze Karte auf einmal. Ergebnis ist ein Uint8Array mit der
   * Biom-Nummer pro Feld - ein Byte statt einer Zeichenkette, das spart
   * bei 65.536 Feldern einiges. */
  function karteBauen(hoehe, feuchte, e) {
    var N = e.groesse;
    var d = daten();
    var karte = new Uint8Array(N * N);
    for (var i = 0; i < karte.length; i++) {
      karte[i] = d.nummerVon[fuer(hoehe[i], feuchte[i], e.meeresspiegel)];
    }
    return karte;
  }

  // Ist dieses Feld Land? (Wasser hat Tempo 0 - ausser Fluessen, die man queren kann.)
  function istWasser(biomNummer) {
    return !!daten().info(biomNummer).wasser;
  }

  function tempo(biomNummer) {
    return daten().info(biomNummer).tempo;
  }

  return {
    fuer: fuer,
    spalte: spalte,
    karteBauen: karteBauen,
    istWasser: istWasser,
    tempo: tempo
  };
})();
