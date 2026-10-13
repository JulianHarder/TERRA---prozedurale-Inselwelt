/* Hoehenkarte: aus Rauschen wird eine Insel.
 *
 * Rohes fBm ist eine endlose Huegellandschaft ohne Rand. Damit daraus eine
 * Insel wird, wird es mit einer Maske multipliziert, die in der Mitte 1 ist
 * und zum Rand hin auf 0 faellt:
 *
 *     Hoehe(x,y) = fBm(x,y) x Inselmaske(Abstand zur Mitte)
 *
 * Eine runde Maske ergaebe aber einen Kreis als Insel. Deshalb wird der
 * Abstand vorher mit einer zweiten, groben Rauschkarte verzerrt - dadurch
 * wird die Kuestenlinie unregelmaessig, es entstehen Halbinseln, Buchten
 * und vorgelagerte kleine Inseln.
 */
window.TERRA = window.TERRA || {};

TERRA.Hoehenkarte = (function () {
  'use strict';

  // Weiche Kante zwischen a und b: liefert 0 unterhalb a, 1 oberhalb b.
  function kante(a, b, t) {
    var x = (t - a) / (b - a);
    if (x < 0) x = 0; else if (x > 1) x = 1;
    return x * x * (3 - 2 * x);
  }

  function erzeuge(seed, e, schritte) {
    var N = e.groesse;
    var anzahl = N * N;
    var hoehe = new Float32Array(anzahl);
    var roh = new Float32Array(anzahl);
    var maske = schritte ? new Float32Array(anzahl) : null;

    var gelaende = TERRA.Rauschen.fbm({
      seed: seed,
      lagen: e.lagen,
      frequenz: e.frequenz,
      dauerhaftigkeit: e.dauerhaftigkeit,
      lakunaritaet: e.lakunaritaet
    });

    // Eigene, sehr grobe Rauschkarte nur fuer die Form der Kueste.
    var kueste = TERRA.Rauschen.fbm({
      seed: (seed ^ 0x9e3779b9) | 0,
      lagen: 3,
      frequenz: 5.0,          // hoeher = zerrissenere Kueste, mehr abgetrennte Inseln
      dauerhaftigkeit: 0.55,
      lakunaritaet: 2
    });

    // 1. Rohes fBm einsammeln und auf die volle Spanne 0..1 strecken.
    //    Ohne das Strecken draengt sich alles um 0.5 und die Welt wird flach.
    var min = Infinity, max = -Infinity, i, x, y, v;
    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        v = gelaende(x / N, y / N);
        roh[y * N + x] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    var spanne = (max - min) || 1;
    for (i = 0; i < anzahl; i++) roh[i] = (roh[i] - min) / spanne;

    // 2. Inselmaske. e.inselform: 0 = kompakte Insel, 1 = Kontinent bis zum Rand.
    var randInnen  = 0.14 + 0.46 * e.inselform;
    var randAussen = 0.78 + 0.20 * e.inselform;

    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        i = y * N + x;
        var dx = (x / (N - 1)) * 2 - 1;
        var dy = (y / (N - 1)) * 2 - 1;
        var laenge = Math.sqrt(dx * dx + dy * dy);

        // Verzerrung 0.60 .. 1.40: wo der Wert hoch ist, liegt die Kueste
        // naeher an der Mitte - dort entstehen Buchten. Je groesser die
        // Spanne, desto zerrissener die Kueste und desto eher brechen
        // vorgelagerte Inseln ab.
        var verzerrung = 0.60 + 0.80 * kueste(x / N, y / N);
        var d = laenge * verzerrung;
        if (d > 1.4) d = 1.4;

        var m = 1 - kante(randInnen, randAussen, d);
        hoehe[i] = roh[i] * m;
        if (maske) maske[i] = m;
      }
    }

    /* 3. Nach der Maske noch einmal strecken.
     *
     * Das ist wichtiger, als es aussieht: die Maske drueckt alle Hoehen nach
     * unten, weil sie fast nirgends genau 1 ist. Ohne dieses Strecken kommt
     * der hoechste Punkt der Welt nur auf etwa 0,75 - und dann gibt es
     * ueberhaupt keine Gipfel mit Schnee, weil die obersten Biomstufen nie
     * erreicht werden. Jetzt liegt der hoechste Punkt immer bei 1.
     */
    var hMax = 0;
    for (i = 0; i < anzahl; i++) if (hoehe[i] > hMax) hMax = hoehe[i];
    if (hMax > 0) {
      for (i = 0; i < anzahl; i++) hoehe[i] /= hMax;
    }

    /* 4. Umverteilung: unter 1 macht die Welt bergiger, ueber 1 flacher
     *    (weil Werte zwischen 0 und 1 beim Potenzieren kleiner werden). */
    if (e.umverteilung !== 1) {
      for (i = 0; i < anzahl; i++) hoehe[i] = Math.pow(hoehe[i], e.umverteilung);
    }

    if (schritte) {
      schritte.rohesRauschen = roh;
      schritte.inselmaske = maske;
      schritte.hoehe = hoehe;
    }
    return hoehe;
  }

  return { erzeuge: erzeuge, kante: kante };
})();
