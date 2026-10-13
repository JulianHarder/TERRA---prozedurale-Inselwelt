/* Bewegung des Betrachters ueber die Karte.
 *
 * Die Position ist eine Kommazahl in Feldern - dadurch laeuft die Figur
 * gleichmaessig und nicht in Spruengen von Feld zu Feld.
 *
 * Das Gelaende bremst: Grasland 1.0, Wald 0.7, Fels 0.5, Schnee 0.35.
 * Wasser hat Tempo 0 und ist damit eine Wand. Die beiden Achsen werden
 * getrennt geprueft - so rutscht man an einer Kueste entlang, statt
 * steckenzubleiben, wenn man schraeg dagegen laeuft.
 */
window.TERRA = window.TERRA || {};

TERRA.Entdecker = (function () {
  'use strict';

  var GRUNDTEMPO = 7.0;      // Felder je Sekunde auf Grasland
  var ZIEL_GENAU = 0.35;     // ab hier gilt ein Laufziel als erreicht

  function tempoBei(z, x, y) {
    var N = z.welt.groesse;
    var fx = Math.floor(x), fy = Math.floor(y);
    if (fx < 0 || fy < 0 || fx >= N || fy >= N) return 0;
    return TERRA.Biome.tempo(z.welt.biom[fy * N + fx]);
  }

  function begehbar(z, x, y) {
    return tempoBei(z, x, y) > 0;
  }

  /* Einen Zeitschritt bewegen. richtungX/Y kommen von der Tastatur
   * (-1, 0 oder 1), ein Laufziel ueberschreibt sie. */
  function schritt(z, dt, eingabe) {
    var e = z.entdecker;
    var rx = eingabe.x, ry = eingabe.y;

    // Laufziel in eine Richtung umrechnen
    if (e.ziel && rx === 0 && ry === 0) {
      var dx = e.ziel.x - e.x;
      var dy = e.ziel.y - e.y;
      var weite = Math.sqrt(dx * dx + dy * dy);
      if (weite < ZIEL_GENAU) {
        e.ziel = null;
      } else {
        rx = dx / weite;
        ry = dy / weite;
      }
    } else if (rx !== 0 || ry !== 0) {
      e.ziel = null;                       // Tastatur hat Vorrang
    }

    if (rx === 0 && ry === 0) return false;

    // Schraeg nicht schneller
    var laenge = Math.sqrt(rx * rx + ry * ry);
    if (laenge > 0) { rx /= laenge; ry /= laenge; }

    e.richtung = Math.atan2(ry, rx);

    var tempo = tempoBei(z, e.x, e.y);
    if (tempo <= 0) tempo = 0.5;           // Notfall: nie ganz feststecken
    var weg = GRUNDTEMPO * tempo * dt;

    var altX = Math.floor(e.x), altY = Math.floor(e.y);
    var neuX = e.x + rx * weg;
    var neuY = e.y + ry * weg;

    // Achsen getrennt - erlaubt das Gleiten an Kuestenlinien
    if (begehbar(z, neuX, e.y)) e.x = neuX;
    if (begehbar(z, e.x, neuY)) e.y = neuY;

    var N = z.welt.groesse;
    e.x = Math.max(0.01, Math.min(N - 0.01, e.x));
    e.y = Math.max(0.01, Math.min(N - 0.01, e.y));

    // Hat der Blick das Feld gewechselt?
    return Math.floor(e.x) !== altX || Math.floor(e.y) !== altY;
  }

  function zielSetzen(z, feld) {
    if (!begehbar(z, feld.x, feld.y)) {
      TERRA.Seitenleiste.hinweis(TERRA.daten.texte.gesperrt);
      return false;
    }
    z.entdecker.ziel = { x: feld.x, y: feld.y };
    return true;
  }

  return {
    schritt: schritt,
    zielSetzen: zielSetzen,
    begehbar: begehbar,
    tempoBei: tempoBei,
    GRUNDTEMPO: GRUNDTEMPO
  };
})();
