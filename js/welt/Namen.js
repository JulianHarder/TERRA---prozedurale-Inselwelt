/* Namen aus dem Silbenbaukasten.
 *
 * "Kalm" + "fjord", "Thorn" + "kamm", "Ost" + "wacht". Gezogen wird aus dem
 * Seed-Zahlenstrom, nicht mit Math.random() - sonst hiesse dieselbe Region
 * bei jedem Laden anders.
 */
window.TERRA = window.TERRA || {};

TERRA.Namen = (function () {
  'use strict';

  function erzeuge(zufall, art, vergeben) {
    var s = TERRA.daten.silben;
    var enden = s.hinten[art] || s.hinten.insel;

    // Bis zu 40 Versuche fuer einen noch freien Namen, danach eine Ziffer dran.
    for (var versuch = 0; versuch < 40; versuch++) {
      var name = zufall.ausWahl(s.vorne) + zufall.ausWahl(enden);
      if (!vergeben[name]) {
        vergeben[name] = true;
        return name;
      }
    }
    var ersatz = zufall.ausWahl(s.vorne) + zufall.ausWahl(enden);
    var n = 2;
    while (vergeben[ersatz + ' ' + n]) n++;
    vergeben[ersatz + ' ' + n] = true;
    return ersatz + ' ' + n;
  }

  // "Gebirgszug Thornkamm"
  function mitArt(region) {
    var arten = TERRA.daten.texte.arten;
    return (arten[region.art] || '') + ' ' + region.name;
  }

  return { erzeuge: erzeuge, mitArt: mitArt };
})();
