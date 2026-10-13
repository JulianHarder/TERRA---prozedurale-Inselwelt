/* Der Betrachter: ein Pfeil, dem die Kamera folgt.
 *
 * Ohne ihn gaebe es beim Hineinzoomen keine Moeglichkeit, sich ueber die
 * Karte zu bewegen - er ist der Punkt, auf den die Ansicht zentriert.
 */
window.TERRA = window.TERRA || {};

TERRA.FigurEbene = (function () {
  'use strict';

  function zeichnen(ctx, z, sicht) {
    var e = z.entdecker;
    var px = sicht.feldPixel * sicht.dpr;

    var bx = (e.x - sicht.kamX) * px;
    var by = (e.y - sicht.kamY) * px;

    // Laufziel als kleines Kreuz
    if (e.ziel) {
      var zx = (e.ziel.x - sicht.kamX) * px;
      var zy = (e.ziel.y - sicht.kamY) * px;
      ctx.strokeStyle = 'rgba(224, 184, 114, 0.75)';
      ctx.lineWidth = 1.5 * sicht.dpr;
      ctx.beginPath();
      ctx.moveTo(zx - 5 * sicht.dpr, zy); ctx.lineTo(zx + 5 * sicht.dpr, zy);
      ctx.moveTo(zx, zy - 5 * sicht.dpr); ctx.lineTo(zx, zy + 5 * sicht.dpr);
      ctx.stroke();
    }

    // Pfeil in Laufrichtung
    var gr = 6 * sicht.dpr;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(e.richtung);

    ctx.beginPath();
    ctx.moveTo(gr * 1.5, 0);
    ctx.lineTo(-gr, gr * 0.9);
    ctx.lineTo(-gr * 0.45, 0);
    ctx.lineTo(-gr, -gr * 0.9);
    ctx.closePath();

    ctx.fillStyle = '#f4f7fa';
    ctx.strokeStyle = 'rgba(10, 14, 20, 0.85)';
    ctx.lineWidth = 1.6 * sicht.dpr;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  return { zeichnen: zeichnen };
})();
