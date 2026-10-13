/* Gelaende-Ebene: die farbige Landkarte.
 *
 * Gezeichnet wird in ein eigenes Canvas mit genau einem Bildpunkt je Feld
 * (256 x 256). Das wird spaeter vergroessert auf den Bildschirm gelegt.
 * Der Grund: 65.536 einzelne Rechtecke zu fuellen dauert Millisekunden, ein
 * ImageData-Feld direkt zu beschreiben dagegen kaum messbar lange - und
 * dieses Bild entsteht ohnehin nur einmal je Welt, nicht pro Bild.
 *
 * Zwei Kniffe heben die Karte ueber reine Flaechenfarben:
 *   Relief  - Felder, die nach Suedosten abfallen, werden heller; das laesst
 *             Gebirge auch in der Draufsicht plastisch wirken.
 *   Kueste  - Landfelder am Wasser werden abgedunkelt, das gibt eine Kante.
 */
window.TERRA = window.TERRA || {};

TERRA.GelaendeEbene = (function () {
  'use strict';

  var LICHT = 9;        // Staerke der Reliefschattierung
  var KUESTE = 0.84;    // Abdunkelung der Landkante

  function erzeuge(welt) {
    var N = welt.groesse;
    var d = TERRA.daten.biome;
    var ms = welt.einstellungen.meeresspiegel;
    var relief = welt.einstellungen.relief;
    var hoehe = welt.hoehe;
    var biom = welt.biom;

    var leinwand = document.createElement('canvas');
    leinwand.width = N;
    leinwand.height = N;
    var ctx = leinwand.getContext('2d');
    var bild = ctx.createImageData(N, N);
    var px = bild.data;

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var i = y * N + x;
        var p = i * 4;
        var rgb = d.farbenRGB[d.idVonNummer(biom[i])];
        var f = 1;
        var istLand = hoehe[i] >= ms;

        if (istLand) {
          if (relief) {
            // Gefaelle nach Osten und Sueden; Licht kommt von Nordwesten.
            var links  = x > 0     ? hoehe[i - 1] : hoehe[i];
            var rechts = x < N - 1 ? hoehe[i + 1] : hoehe[i];
            var oben   = y > 0     ? hoehe[i - N] : hoehe[i];
            var unten  = y < N - 1 ? hoehe[i + N] : hoehe[i];
            f = 1 + ((rechts - links) + (unten - oben)) * LICHT;
            if (f < 0.6) f = 0.6; else if (f > 1.45) f = 1.45;
          }
          // Kante zum Wasser
          if ((x > 0     && hoehe[i - 1] < ms) ||
              (x < N - 1 && hoehe[i + 1] < ms) ||
              (y > 0     && hoehe[i - N] < ms) ||
              (y < N - 1 && hoehe[i + N] < ms)) {
            f *= KUESTE;
          }
        }

        px[p]     = begrenzen(rgb[0] * f);
        px[p + 1] = begrenzen(rgb[1] * f);
        px[p + 2] = begrenzen(rgb[2] * f);
        px[p + 3] = 255;
      }
    }

    ctx.putImageData(bild, 0, 0);
    return leinwand;
  }

  function begrenzen(v) {
    return v < 0 ? 0 : (v > 255 ? 255 : v | 0);
  }

  return { erzeuge: erzeuge, LICHT: LICHT };
})();
