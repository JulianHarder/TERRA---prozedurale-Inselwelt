/* Fluesse und Seen - wohin das Wasser laeuft.
 *
 * Der erste Versuch waren Tropfen: 150-mal einen Tropfen auf einen Berg
 * setzen und bergab laufen lassen, und wo mehrere durchkamen, einen Fluss
 * zeichnen. Das Ergebnis waren 329 abgerissene Stummel, weil zwei zufaellige
 * Tropfen selten genau dieselbe Spur nehmen.
 *
 * Richtig geht es ueber das Einzugsgebiet. In drei Durchgaengen:
 *
 *   1. ABFLUSS   Fuer jedes Landfeld den tiefsten der acht Nachbarn merken.
 *                Das ist die Richtung, in die sein Wasser laeuft.
 *   2. SEEN      Felder ohne tieferen Nachbarn sind Senken. Dort laeuft ein
 *                See voll, bis er ueberlaeuft; der Ueberlauf wird sein Abfluss.
 *   3. SAMMELN   Alle Felder von oben nach unten durchgehen und jedes sein
 *                gesammeltes Wasser an seinen Abfluss weitergeben. Danach
 *                weiss jedes Feld, wie viele Felder in es entwaessern.
 *
 * Ein Fluss ist dann einfach jedes Feld, in das mehr als eine bestimmte
 * Flaeche entwaessert. Dadurch sind Fluesse von selbst durchgehend, werden
 * talwaerts breiter und verzweigen sich wie echte Flusssysteme.
 */
window.TERRA = window.TERRA || {};

TERRA.Fluesse = (function () {
  'use strict';

  var NX = [1, 1, 0, -1, -1, -1, 0, 1];
  var NY = [0, 1, 1, 1, 0, -1, -1, -1];

  var MAX_SEE_FELDER = 220;    // groesser wird kein See
  var MAX_SEE_TIEFE = 0.02;    // und nicht tiefer als das ueber der Senke
  var MIN_SEE_FELDER = 8;      // kleinere Pfuetzen zaehlen nicht als See
  var MAX_SEEN = 7;            // sonst wird die Welt zur Seenplatte

  function erzeuge(zufall, e, hoehe, schritte) {
    var N = e.groesse;
    var anzahl = N * N;
    var ms = e.meeresspiegel;

    var abfluss = new Int32Array(anzahl);      // Zielfeld, -1 = Senke, -2 = Meer
    var seen = new Uint8Array(anzahl);
    var pegel = new Float32Array(anzahl);      // Hoehe fuer die Reihenfolge
    var land = [];
    var senken = [];
    var i;

    // --- 1. Abflussrichtung ---
    for (i = 0; i < anzahl; i++) {
      pegel[i] = hoehe[i];
      if (hoehe[i] < ms) { abfluss[i] = -2; continue; }
      land.push(i);
      var tiefster = tiefsterNachbar(i, N, hoehe);
      abfluss[i] = tiefster;
      if (tiefster < 0) senken.push(i);
    }
    if (!land.length) return fertig();

    // --- 2. Seen in den Senken ---
    // Reihenfolge der Senken mit dem Seed durchmischen, damit die Seen ueber
    // die Welt verteilt liegen und nicht alle in der linken oberen Ecke.
    mischen(senken, zufall);

    /* JEDE Senke wird gefuellt, nicht nur die, aus denen ein sichtbarer See
     * wird. Sonst versickert das Wasser ihres Einzugsgebiets dort und das
     * Flussnetz bricht ab. Sichtbar werden nur die ersten paar grossen. */
    var besucht = new Int32Array(anzahl);
    var seenAnzahl = 0;
    for (var s = 0; s < senken.length; s++) {
      var becken = beckenFuellen(senken[s], N, hoehe, besucht, s + 1, ms);
      if (!becken.felder.length) continue;

      // Alle Beckenfelder entwaessern ueber den Ueberlauf.
      for (var b = 0; b < becken.felder.length; b++) {
        var f = becken.felder[b];
        abfluss[f] = becken.auslass;
        // Knapp ueber dem Ueberlauf einsortieren, damit beim Sammeln
        // zuerst das Becken und dann sein Abfluss an die Reihe kommt.
        pegel[f] = becken.auslass >= 0 ? hoehe[becken.auslass] + 0.000001 : hoehe[f];
      }

      // Gross genug und noch Platz? Dann wird es ein sichtbarer See.
      if (seenAnzahl < MAX_SEEN && becken.felder.length >= MIN_SEE_FELDER) {
        for (var g = 0; g < becken.felder.length; g++) seen[becken.felder[g]] = 1;
        seenAnzahl++;
      }
    }

    // --- 3. Einzugsgebiet aufsummieren ---
    // Von hoch nach tief: dann ist ein Feld immer schon fertig, bevor sein
    // Abfluss an die Reihe kommt.
    land.sort(function (a, b) { return pegel[b] - pegel[a]; });

    var sammeln = new Float32Array(anzahl);
    for (i = 0; i < land.length; i++) sammeln[land[i]] = 1;

    for (i = 0; i < land.length; i++) {
      var feld = land[i];
      var ziel = abfluss[feld];
      if (ziel >= 0) sammeln[ziel] += sammeln[feld];
    }

    if (schritte) schritte.fluss = sammeln;
    return fertig();

    function fertig() {
      return { fluss: sammeln || new Float32Array(anzahl), seen: seen, abfluss: abfluss };
    }
  }

  /* Liste mit dem Seed-Zahlenstrom mischen (Fisher-Yates).
   * Math.random() waere hier verboten - die Seen muessen reproduzierbar sein. */
  function mischen(liste, zufall) {
    for (var i = liste.length - 1; i > 0; i--) {
      var k = Math.floor(zufall.wert() * (i + 1));
      var zwischen = liste[i];
      liste[i] = liste[k];
      liste[k] = zwischen;
    }
  }

  /* Tiefster der acht Nachbarn, oder -1 wenn keiner tiefer liegt. */
  function tiefsterNachbar(pos, N, hoehe) {
    var x = pos % N, y = (pos - (pos % N)) / N;
    var bester = -1, tiefste = hoehe[pos];
    for (var k = 0; k < 8; k++) {
      var nx = x + NX[k], ny = y + NY[k];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      var ni = ny * N + nx;
      if (hoehe[ni] < tiefste) { tiefste = hoehe[ni]; bester = ni; }
    }
    return bester;
  }

  /* Eine Senke volllaufen lassen und ihren Ueberlauf finden.
   * Markiert selbst nichts - der Aufrufer entscheidet, ob daraus ein
   * sichtbarer See wird oder nur eine Wegbeschreibung fuer das Wasser.
   *
   * Nicht "alle Nachbarfelder unterhalb eines festen Pegels" - das ist kein
   * Becken, sondern folgt jeder flachen Rinne. In einem Versuch entstand so
   * ein "See" von 260 Feldern in einem Rahmen von 5 x 124, also ein
   * schnurgerader Strich quer durch die Landschaft.
   *
   * Richtig steigt der Wasserstand schrittweise:
   *   1. Der See ist anfangs nur die Senke, der Pegel ihre Hoehe.
   *   2. Vom Seerand das NIEDRIGSTE Feld dazunehmen, Pegel auf dessen Hoehe.
   *   3. Liegt ein Randfeld unter dem Pegel, hat das Wasser einen Weg nach
   *      draussen: das ist der Ueberlauf, und der See ist fertig.
   */
  function beckenFuellen(start, N, hoehe, besucht, runde, meeresspiegel) {
    var becken = [start];
    var rand = [];
    var pegel = hoehe[start];
    var auslass = -1;

    besucht[start] = runde;
    randAufnehmen(start);

    while (becken.length < MAX_SEE_FELDER && rand.length) {
      // Niedrigstes Randfeld suchen. Seen bleiben klein, deshalb genuegt die
      // einfache Suche - eine Vorrangwarteschlange waere hier Ballast.
      var k = 0;
      for (var j = 1; j < rand.length; j++) {
        if (hoehe[rand[j]] < hoehe[rand[k]]) k = j;
      }
      var c = rand[k];
      rand.splice(k, 1);

      if (hoehe[c] < pegel) { auslass = c; break; }               // Ueberlauf
      if (hoehe[c] < meeresspiegel) { auslass = c; break; }       // Kueste
      if (hoehe[c] - hoehe[start] > MAX_SEE_TIEFE) { auslass = c; break; }

      pegel = hoehe[c];
      becken.push(c);
      randAufnehmen(c);
    }

    if (auslass < 0 && rand.length) {
      var m = 0;
      for (var q = 1; q < rand.length; q++) if (hoehe[rand[q]] < hoehe[rand[m]]) m = q;
      auslass = rand[m];
    }

    return { auslass: auslass, felder: becken };

    function randAufnehmen(i) {
      var x = i % N, y = (i - (i % N)) / N;
      for (var r = 0; r < 4; r++) {
        var nx = x + (r === 0 ? 1 : r === 1 ? -1 : 0);
        var ny = y + (r === 2 ? 1 : r === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var ni = ny * N + nx;
        if (besucht[ni] === runde) continue;
        besucht[ni] = runde;
        rand.push(ni);
      }
    }
  }

  /* Fluesse und Seen in die Biomkarte eintragen.
   * e.flussAb ist die Mindestgroesse des Einzugsgebiets in Feldern:
   * kleiner Wert = dichtes Flussnetz, grosser Wert = nur die Hauptfluesse. */
  function inBiomkarte(biom, sammeln, seen, hoehe, e) {
    var d = TERRA.daten.biome;
    var nrFluss = d.nummerVon.fluss;
    var nrSee = d.nummerVon.see;
    var schwelle = e.flussAb;

    for (var i = 0; i < biom.length; i++) {
      if (hoehe[i] < e.meeresspiegel) continue;
      if (seen[i]) biom[i] = nrSee;
      else if (sammeln[i] >= schwelle) biom[i] = nrFluss;
    }
  }

  return {
    erzeuge: erzeuge,
    inBiomkarte: inBiomkarte,
    tiefsterNachbar: tiefsterNachbar
  };
})();
