/* Biome: Namen, Farben, Laufgeschwindigkeiten und die Zuordnungstabelle.
 *
 * Hier wird justiert, wie die Welt aussieht - ohne eine Zeile Logik anzufassen.
 *
 * Wichtig zu den Schwellwerten: sie sind NICHT absolut, sondern relativ.
 *   Wasser: Anteil des Meeresspiegels   (0 = tiefste Stelle, 1 = Wasserkante)
 *   Land:   Anteil der Landhoehe        (0 = Wasserkante,    1 = hoechster Punkt)
 * Dadurch bleibt die Tabelle richtig, auch wenn der Meeresspiegel-Regler bewegt wird.
 */
window.TERRA = window.TERRA || {};
TERRA.daten = TERRA.daten || {};

TERRA.daten.biome = (function () {
  'use strict';

  var liste = {
    tiefesMeer:    { name: 'Tiefes Meer',    farbe: '#102f52', wasser: true },
    meer:          { name: 'Meer',           farbe: '#1a4a77', wasser: true },
    flachesWasser: { name: 'Flaches Wasser', farbe: '#2f7fa8', wasser: true },
    see:           { name: 'See',            farbe: '#2a6f9a', wasser: true },
    fluss:         { name: 'Fluss',          farbe: '#3a86b0' },
    strand:        { name: 'Strand',         farbe: '#ddd0a3' },
    marsch:        { name: 'Marsch',         farbe: '#9aa86a' },
    steppe:        { name: 'Steppe',         farbe: '#cdc28a' },
    grasland:      { name: 'Grasland',       farbe: '#8fae5d' },
    sumpf:         { name: 'Sumpf',          farbe: '#5f7a4a' },
    buschland:     { name: 'Buschland',      farbe: '#a8a263' },
    laubwald:      { name: 'Laubwald',       farbe: '#4e7a3e' },
    nadelwald:     { name: 'Nadelwald',      farbe: '#2f5a3a' },
    bergwald:      { name: 'Bergwald',       farbe: '#3b5f44' },
    fels:          { name: 'Fels',           farbe: '#7c7a73' },
    geroell:       { name: 'Geröll',         farbe: '#908c84' },
    schnee:        { name: 'Schnee',         farbe: '#eef1f3' },
    gletscher:     { name: 'Gletscher',      farbe: '#d7e6ee' }
  };

  // Reihenfolge fuer die Legende und fuer die Nummer im Uint8Array der Biomkarte.
  var reihenfolge = [
    'tiefesMeer', 'meer', 'flachesWasser', 'see', 'fluss',
    'strand', 'marsch', 'steppe', 'grasland', 'sumpf',
    'buschland', 'laubwald', 'nadelwald', 'bergwald',
    'fels', 'geroell', 'schnee', 'gletscher'
  ];

  // Wassertiefen (Anteil des Meeresspiegels, von tief nach flach).
  var wasserStufen = [
    { bis: 0.55, biom: 'tiefesMeer' },
    { bis: 0.86, biom: 'meer' },
    { bis: 1.01, biom: 'flachesWasser' }
  ];

  // Landstufen (Anteil der Landhoehe, von unten nach oben) x Feuchtigkeit.
  var landStufen = [
    { bis: 0.060, trocken: 'strand',    mittel: 'strand',   feucht: 'marsch' },
    { bis: 0.30,  trocken: 'steppe',    mittel: 'grasland', feucht: 'sumpf' },
    { bis: 0.58,  trocken: 'buschland', mittel: 'laubwald', feucht: 'nadelwald' },
    { bis: 0.82,  trocken: 'fels',      mittel: 'bergwald', feucht: 'nadelwald' },
    { bis: 1.01,  trocken: 'geroell',   mittel: 'schnee',   feucht: 'gletscher' }
  ];

  // Ab wo gilt ein Feld als trocken / mittel / feucht.
  var feuchteGrenzen = { trocken: 0.38, mittel: 0.66 };

  // Ab dieser Landhoehe zaehlt ein Feld zum Gebirge (fuer Regionen und Sichtweite).
  var gebirgeAb = 0.55;

  /* Gischt am Ufer. Keine Biomart, nur eine Zeichenfarbe - deshalb steht sie
   * weder in 'liste' noch in 'reihenfolge', sonst stuende "Schaum" als
   * Landschaftsart in der Legende. */
  var schaumFarbe = '#cfe6ec';

  // Nachschlagetabellen, einmal beim Laden gebaut.
  var nummerVon = {};
  var farbenRGB = {};
  reihenfolge.forEach(function (id, i) {
    nummerVon[id] = i;
    var h = liste[id].farbe;
    farbenRGB[id] = [
      parseInt(h.substr(1, 2), 16),
      parseInt(h.substr(3, 2), 16),
      parseInt(h.substr(5, 2), 16)
    ];
  });

  var schaumRGB = [
    parseInt(schaumFarbe.substr(1, 2), 16),
    parseInt(schaumFarbe.substr(3, 2), 16),
    parseInt(schaumFarbe.substr(5, 2), 16)
  ];

  return {
    liste: liste,
    reihenfolge: reihenfolge,
    wasserStufen: wasserStufen,
    landStufen: landStufen,
    feuchteGrenzen: feuchteGrenzen,
    gebirgeAb: gebirgeAb,
    nummerVon: nummerVon,
    farbenRGB: farbenRGB,
    schaumRGB: schaumRGB,
    idVonNummer: function (n) { return reihenfolge[n]; },
    info: function (n) { return liste[reihenfolge[n]]; }
  };
})();
