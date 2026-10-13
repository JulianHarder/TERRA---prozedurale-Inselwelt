/* Regionsnamen auf der Karte.
 *
 * Die Welt vergibt Namen fuer Inseln, Gebirge, Waelder, Suempfe, Trockenland
 * und Seen. Damit sie sichtbar sind, werden sie direkt auf die Karte
 * geschrieben - auf die oberste Ebene, damit sie nichts verdeckt.
 *
 * Gefiltert wird nach Bildschirmgroesse, nicht nach Feldern: ist die ganze
 * Welt eingepasst, waeren zwei Dutzend Namen auf engstem Raum unleserlich.
 * Also bekommt nur eine Beschriftung, wer auf dem Bildschirm auch Platz hat -
 * beim Hineinzoomen tauchen die kleineren Gebiete nach und nach auf.
 */
window.TERRA = window.TERRA || {};

TERRA.Beschriftung = (function () {
  'use strict';

  var MINDESTBREITE = 46;    // Bildpunkte, die ein Gebiet breit sein muss

  function zeichnen(ctx, z, sicht) {
    if (!z.einstellungen.namen || !z.welt) return;

    var px = sicht.feldPixel * sicht.dpr;
    var arten = TERRA.daten.texte.arten;
    var regionen = z.welt.inseln.concat(z.welt.merkmale);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    for (var i = 0; i < regionen.length; i++) {
      var r = regionen[i];

      // Wie breit ist dieses Gebiet ungefaehr auf dem Bildschirm?
      // (Flaeche in Feldern -> Kantenlaenge -> Bildpunkte)
      var breite = Math.sqrt(r.felder) * px;
      var gross = r.art === 'festland' || r.art === 'insel';
      if (breite < (gross ? MINDESTBREITE : MINDESTBREITE * 1.4)) continue;

      var x = (r.mitte.x - sicht.kamX) * px;
      var y = (r.mitte.y - sicht.kamY) * px;
      if (x < -120 || y < -40 || x > ctx.canvas.width + 120 || y > ctx.canvas.height + 40) continue;

      // Schriftgroesse mit dem Gebiet wachsen lassen, aber gedeckelt.
      var groesse = Math.max(11, Math.min(gross ? 26 : 17, breite / 7)) * sicht.dpr;
      ctx.font = (gross ? 'bold ' : '') + groesse + 'px Georgia, "Times New Roman", serif';

      var text = gross ? r.name.toUpperCase() : r.name;
      if (gross) ctx.letterSpacing = Math.round(groesse * 0.12) + 'px';

      ctx.strokeStyle = 'rgba(8, 11, 16, 0.78)';
      ctx.lineWidth = Math.max(2, groesse * 0.22);
      ctx.strokeText(text, x, y);
      ctx.fillStyle = gross ? 'rgba(255, 246, 228, 0.95)' : 'rgba(255, 240, 215, 0.88)';
      ctx.fillText(text, x, y);

      if (gross) ctx.letterSpacing = '0px';

      // Art darunter, nur bei den kleineren Gebieten (bei Inseln ist der
      // Name schon gross genug und die Art meist offensichtlich).
      if (!gross && breite > MINDESTBREITE * 2.6) {
        var klein = Math.max(9, groesse * 0.62);
        ctx.font = klein + 'px Georgia, "Times New Roman", serif';
        ctx.lineWidth = Math.max(2, klein * 0.22);
        ctx.strokeText(arten[r.art] || '', x, y + groesse * 0.95);
        ctx.fillStyle = 'rgba(255, 240, 215, 0.6)';
        ctx.fillText(arten[r.art] || '', x, y + groesse * 0.95);
      }
    }

    ctx.letterSpacing = '0px';
  }

  return { zeichnen: zeichnen, MINDESTBREITE: MINDESTBREITE };
})();
