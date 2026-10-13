/* Silbenbaukasten fuer Orts- und Regionsnamen.
 * Gezogen wird immer aus dem Seed-Zahlenstrom, nie mit Math.random() -
 * deshalb heisst dieselbe Region bei gleichem Seed auch immer gleich.
 */
window.TERRA = window.TERRA || {};
TERRA.daten = TERRA.daten || {};

TERRA.daten.silben = {
  vorne: [
    'Kalm', 'Nord', 'Ost', 'Süd', 'West', 'Thorn', 'Mor', 'Grim', 'Fenn', 'Hald',
    'Brak', 'Eld', 'Visk', 'Ulm', 'Sarn', 'Dorn', 'Lind', 'Rauh', 'Still', 'Wind',
    'Alt', 'Hoch', 'Tief', 'Schwarz', 'Weiß', 'Grau', 'Eis', 'Glut', 'Nebel', 'Stern',
    'Mond', 'Raben', 'Wolf', 'Bären', 'Falken', 'Hirsch', 'Eschen', 'Birken', 'Erlen', 'Fichten',
    'Salz', 'Bernstein', 'Kupfer', 'Flint', 'Scherben', 'Donner', 'Möwen', 'Robben', 'Krähen', 'Distel'
  ],

  hinten: {
    insel:   ['wacht', 'holm', 'ey', 'land', 'sund', 'au', 'werder', 'oog', 'eiland', 'riff'],
    gebirge: ['kamm', 'grat', 'zacken', 'hörner', 'rücken', 'klippen', 'spitzen', 'wall', 'joch', 'horn'],
    wald:    ['hain', 'forst', 'wald', 'dickicht', 'grund', 'bruch', 'holz', 'schlag'],
    sumpf:   ['moor', 'bruch', 'marsch', 'fenn', 'moos', 'siel'],
    steppe:  ['heide', 'weite', 'flur', 'steppe', 'trift', 'blöße'],
    see:     ['see', 'teich', 'auge', 'spiegel', 'tümpel', 'weiher']
  }
};
