/* Regionen - zusammenhaengende Gebiete finden (Flood Fill).
 *
 * Eine Karte ohne Namen ist nur ein Bild. Also wird die Welt in Gebiete
 * zerlegt, die einen Namen bekommen koennen:
 *
 *   Inseln    - alle zusammenhaengenden Landfelder
 *   Merkmale  - Gebirge, Waelder, Suempfe, Trockenland, Seen
 *
 * Zwei getrennte Karten, weil ein Feld beides sein kann: es liegt auf der
 * Insel Ostwacht UND im Gebirgszug Thornkamm.
 *
 * Flood Fill mit eigenem Stapel statt Rekursion - bei 65.536 Feldern wuerde
 * der Aufrufstapel des Browsers sonst ueberlaufen. Der Stapel wird einmal
 * vorbelegt und wiederverwendet; das ist der Unterschied zwischen 100 ms
 * und 20 ms, weil pro Gebiet sonst neue Arrays und Closures entstehen.
 */
window.TERRA = window.TERRA || {};

TERRA.Regionen = (function () {
  'use strict';

  var MIN = { insel: 40, gebirge: 60, wald: 120, sumpf: 50, steppe: 120, see: 14 };

  // Reihenfolge = Rangfolge. Ein Feld gehoert zum erstgenannten passenden Merkmal.
  var MERKMALE = ['see', 'gebirge', 'sumpf', 'wald', 'steppe'];

  function gehoertZu(art, biomId, landT) {
    switch (art) {
      case 'see':     return biomId === 'see';
      case 'gebirge': return landT >= TERRA.daten.biome.gebirgeAb;
      case 'sumpf':   return biomId === 'sumpf' || biomId === 'marsch';
      case 'wald':    return biomId === 'laubwald' || biomId === 'nadelwald' || biomId === 'bergwald';
      case 'steppe':  return biomId === 'steppe' || biomId === 'buschland';
    }
    return false;
  }

  /* Flood Fill ueber alle Felder mit demselben Kennwert in quelle.
   *
   * marke  - hier wird die Gebietsnummer eingetragen (0 = noch frei)
   * stapel - vorbelegter Int32Array, wird wiederverwendet
   * ergebnis - vorbelegter Int32Array, nimmt die gefundenen Felder auf
   * Rueckgabe: Anzahl gefundener Felder (sie stehen vorn in ergebnis)
   */
  function fuellen(start, N, quelle, kennwert, marke, nummer, stapel, ergebnis) {
    var oben = 0, anzahl = 0;
    stapel[oben++] = start;
    marke[start] = nummer;

    while (oben > 0) {
      var i = stapel[--oben];
      ergebnis[anzahl++] = i;

      var x = i % N;
      var y = (i - x) / N;

      // vier Richtungen genuegen - diagonal verbundene Gebiete wirken zerrissen
      if (x > 0         && marke[i - 1] === 0 && quelle[i - 1] === kennwert) { marke[i - 1] = nummer; stapel[oben++] = i - 1; }
      if (x < N - 1     && marke[i + 1] === 0 && quelle[i + 1] === kennwert) { marke[i + 1] = nummer; stapel[oben++] = i + 1; }
      if (y > 0         && marke[i - N] === 0 && quelle[i - N] === kennwert) { marke[i - N] = nummer; stapel[oben++] = i - N; }
      if (y < N - 1     && marke[i + N] === 0 && quelle[i + N] === kennwert) { marke[i + N] = nummer; stapel[oben++] = i + N; }
    }
    return anzahl;
  }

  function schwerpunkt(felder, anzahl, N) {
    var sx = 0, sy = 0;
    for (var k = 0; k < anzahl; k++) {
      var x = felder[k] % N;
      sx += x;
      sy += (felder[k] - x) / N;
    }
    return { x: Math.round(sx / anzahl), y: Math.round(sy / anzahl) };
  }

  function erzeuge(zufall, e, hoehe, biom) {
    var N = e.groesse;
    var anzahl = N * N;
    var d = TERRA.daten.biome;
    var ms = e.meeresspiegel;
    var landSpanne = (1 - ms) || 1;

    var inselVon = new Int32Array(anzahl);
    var merkmalVon = new Int32Array(anzahl);
    var regionen = {};
    var inseln = [], merkmale = [];
    var vergeben = {};
    var i;

    // Arbeitsspeicher, einmal belegt und durchgaengig wiederverwendet.
    var stapel = new Int32Array(anzahl);
    var treffer = new Int32Array(anzahl);
    var marke = new Int32Array(anzahl);

    /* Vorlauf: pro Feld in einem Durchgang bestimmen
     *   landKarte[i] - 1 = Land, 0 = Wasser
     *   artVon[i]    - Nummer der hoechstrangigen Merkmalsart (0 = keine)
     * Die Zeichenketten-Vergleiche passieren nur hier, nicht im Flood Fill. */
    var landKarte = new Uint8Array(anzahl);
    var artVon = new Uint8Array(anzahl);

    for (i = 0; i < anzahl; i++) {
      landKarte[i] = hoehe[i] >= ms ? 1 : 0;
      var landT = (hoehe[i] - ms) / landSpanne;
      var biomId = d.idVonNummer(biom[i]);
      for (var m = 0; m < MERKMALE.length; m++) {
        if (gehoertZu(MERKMALE[m], biomId, landT)) { artVon[i] = m + 1; break; }
      }
    }

    // --- 1. Inseln: alle zusammenhaengenden Landfelder ---
    var rohInseln = [];
    for (i = 0; i < anzahl; i++) {
      if (landKarte[i] !== 1 || marke[i] !== 0) continue;
      var n = fuellen(i, N, landKarte, 1, marke, rohInseln.length + 1, stapel, treffer);
      rohInseln.push({ felder: treffer.slice(0, n), anzahl: n });
    }
    // Groesste zuerst, damit das Festland auch als Festland gilt.
    rohInseln.sort(function (a, b) { return b.anzahl - a.anzahl; });

    var nummer = 1;
    for (var g = 0; g < rohInseln.length; g++) {
      var ri = rohInseln[g];
      if (ri.anzahl < MIN.insel) continue;
      var art = (g === 0 && ri.anzahl > anzahl * 0.08) ? 'festland' : 'insel';
      var region = {
        nummer: nummer,
        art: art,
        name: TERRA.Namen.erzeuge(zufall, 'insel', vergeben),
        felder: ri.anzahl,
        mitte: schwerpunkt(ri.felder, ri.anzahl, N)
      };
      for (i = 0; i < ri.anzahl; i++) inselVon[ri.felder[i]] = nummer;
      regionen[nummer] = region;
      inseln.push(region);
      nummer++;
    }

    // --- 2. Merkmale ---
    marke.fill(0);
    for (i = 0; i < anzahl; i++) {
      var a = artVon[i];
      if (a === 0 || marke[i] !== 0) continue;

      var gefunden = fuellen(i, N, artVon, a, marke, nummer, stapel, treffer);
      var artName = MERKMALE[a - 1];
      if (gefunden < MIN[artName]) continue;   // zu klein fuer einen Namen

      var r = {
        nummer: nummer,
        art: artName,
        name: TERRA.Namen.erzeuge(zufall, artName, vergeben),
        felder: gefunden,
        mitte: schwerpunkt(treffer, gefunden, N)
      };
      for (var q = 0; q < gefunden; q++) merkmalVon[treffer[q]] = nummer;
      regionen[nummer] = r;
      merkmale.push(r);
      nummer++;
    }

    return {
      inselVon: inselVon,
      merkmalVon: merkmalVon,
      regionen: regionen,
      inseln: inseln,
      merkmale: merkmale,
      anzahl: nummer - 1
    };
  }

  return { erzeuge: erzeuge, MIN: MIN, MERKMALE: MERKMALE };
})();
