/* Minikarte: die ganze Welt klein, mit dem aktuellen Sichtfeld.
 *
 * Nutzt dasselbe Quellbild wie die grosse Karte, nur auf Briefmarkengroesse
 * verkleinert - deshalb kostet sie fast nichts.
 */
window.TERRA = window.TERRA || {};

TERRA.Minikarte = (function () {
  'use strict';

  var leinwand, ctx, kante = 0;
  var sichtbar = true;

  function starten() {
    leinwand = document.getElementById('minikarte');
    ctx = leinwand.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function umschalten() {
    sichtbar = !sichtbar;
    document.getElementById('block-minikarte').hidden = !sichtbar;
    return sichtbar;
  }

  function zeichnen(z) {
    if (!sichtbar || !z.welt) return;
    var N = z.welt.groesse;
    if (kante !== N) {
      leinwand.width = N;
      leinwand.height = N;
      kante = N;
      ctx.imageSmoothingEnabled = false;
    }

    var gelaende = TERRA.Ansicht.gelaende();
    if (!gelaende) return;

    ctx.clearRect(0, 0, N, N);
    ctx.drawImage(gelaende, 0, 0);

    /* Sichtfeld der grossen Karte, auf die Weltgrenzen beschnitten.
     * Ohne das Beschneiden ragt der Rahmen ueber die Welt hinaus, sobald
     * das Fenster breiter ist als die Welt - das sah aus wie ein Fehler. */
    var s = TERRA.Ansicht.daten();
    var vx = Math.max(0, Math.round(s.kamX));
    var vy = Math.max(0, Math.round(s.kamY));
    var vb = Math.min(N - vx, Math.round(s.breiteFelder));
    var vh = Math.min(N - vy, Math.round(s.hoeheFelder));
    if (vb > 1 && vh > 1 && (vb < N || vh < N)) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx + 0.5, vy + 0.5, vb - 1, vh - 1);
    }
  }

  return { starten: starten, zeichnen: zeichnen, umschalten: umschalten };
})();
