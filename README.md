# TERRA – prozedurale Inselwelt

**Ein Wort erzeugt eine Welt.** Du tippst einen Seed ein, und daraus rechnet der
Browser eine komplette Inselwelt: Meer, Strände, Wälder, Gebirge mit Schnee,
Flüsse, Seen und benannte Regionen.

Die Karte liegt vollständig offen. Jede Insel, jedes Gebirge, jeder Wald,
Sumpf und See trägt einen eigenen Namen – sie stehen direkt auf der Karte und
tauchen beim Hineinzoomen nach und nach auf, sobald sie genug Platz haben.

Dasselbe Wort ergibt immer dieselbe Welt – auf jedem Gerät, zu jeder Zeit.
`nordwind` ist heute und morgen die gleiche Insel.

## Starten

`index.html` doppelklicken. Das war's.

Kein Build, kein Server, keine Installation. Die Seite lädt **nichts** aus dem
Netz: keine Bibliothek, kein CDN, keine Webfonts. Alle Skripte sind als normale
`<script src="…">`-Tags eingebunden und liegen im Projektordner.

## Bedienung

| Taste | Wirkung |
| --- | --- |
| Mausrad, `+` `−` | zoomen |
| `0` | ganze Welt einpassen |
| `W` `A` `S` `D` oder Pfeile | Ausschnitt verschieben |
| Klick auf die Karte | dorthin fahren |
| `B` | Regionsnamen an- und ausschalten |
| `M` | Minikarte ein- und ausblenden |
| `E` | Werkstatt – zeigt, wie die Welt entsteht |
| `P` | Karte als PNG speichern (dreifach vergrößert, beschriftet) |
| `L` | Link mit diesem Seed kopieren |
| `Enter` | ins Seed-Feld springen |
| `Esc` | Fenster schließen |

Seed, Reglerstellungen und Bildausschnitt werden im Browser gespeichert. Beim
nächsten Öffnen ist dieselbe Welt wieder da.

Einen Seed teilen: `index.html?seed=nordwind`

## Wie die Welt entsteht

Sechs Schritte, in dieser Reihenfolge. Die **Werkstatt** (`E`) zeigt jeden
davon als eigenes Bild und lässt die Regler verstellen.

1. **Wort → Zahl.** Der Seed wird zu einer 32-Bit-Zahl verrechnet, die einen
   eigenen Zufallsgenerator startet. `Math.random()` wäre unbrauchbar: es kennt
   keinen Seed, und die Welt wäre nicht reproduzierbar.
2. **Rauschen.** Value Noise liefert weich verlaufende Werte statt
   Fernsehrauschen. Fünf Lagen übereinander, jede doppelt so fein und halb so
   stark wie die vorige – grobe Lage = Kontinent, feine Lage = einzelne Felsen.
3. **Insel.** Das Rauschen wird mit einer Maske multipliziert, die in der Mitte
   1 ist und zum Rand auf 0 fällt. Der Abstand zur Mitte wird vorher mit einer
   zweiten Rauschkarte verzerrt – daher die unregelmäßige Küste mit Buchten,
   Halbinseln und vorgelagerten Inseln.
4. **Biome.** Höhe und Feuchtigkeit (zweite Rauschkarte) ergeben über eine
   Tabelle die Landschaftsart. Die Tabelle steht in `js/daten/biome.js`.
5. **Flüsse und Seen.** Jedes Feld merkt sich seinen tiefsten Nachbarn. Senken
   laufen zu Seen voll, bis sie überlaufen. Dann wird von oben nach unten
   aufsummiert, wie viel Land in jedes Feld entwässert – wo das über einer
   Schwelle liegt, ist ein Fluss. Dadurch sind Flüsse durchgehend und
   verzweigen sich wie echte Flusssysteme.
6. **Regionen.** Flood Fill findet zusammenhängende Gebiete – Inseln, Gebirge,
   Wälder, Sümpfe, Trockenland, Seen. Jedes bekommt einen Namen aus einem
   Silbenbaukasten, gezogen aus demselben Seed.

Eine Welt mit 256 × 256 = 65.536 Feldern entsteht so in rund 100 Millisekunden.

## Aufbau

```
index.html          Lädt alle Skripte klassisch, in fester Reihenfolge
css/                variablen · grundlage · karte · oberflaeche
js/
  daten/            Biome, Silben, Texte – hier wird justiert, nicht im Code
  kern/             Zufall, Rauschen, Zustand
  welt/             Hoehenkarte, Feuchtigkeit, Biome, Fluesse, Regionen, Namen, Welt
  zeichnen/         GelaendeEbene, Beschriftung, FigurEbene, Ansicht (Kamera), Minikarte
  spiel/            Entdecker (Bewegung des Ausschnitts), Speicher
  ui/               Kopfzeile, Seitenleiste, Werkstatt, Tastatur
  main.js           Einstieg und Schleife
```

Zwei Canvas-Ebenen liegen übereinander: **Gelände** – nur bei einer neuen Welt
gezeichnet und danach nur noch als fertiges Bild verschoben – und darüber die
**Namen und der Pfeil**, die jedes Bild neu kommen. Pro Bild bleiben dadurch
ein `drawImage` und ein paar Textzeilen übrig.

Jede Datei hängt sich an das globale Objekt `window.TERRA`. Kein
`import`/`export` – damit die Seite über `file://` per Doppelklick läuft, denn
Browser blockieren ES-Module-Importe über `file://`.

## Einstellungen

Alle Regler stehen in `js/kern/Zustand.js` unter `standard` und lassen sich in
der Werkstatt live verstellen:

| Regler | Standard | Wirkung |
| --- | --- | --- |
| `groesse` | 256 | Felder je Kante |
| `lagen` | 5 | Rauschlagen (fBm) |
| `frequenz` | 3.0 | Gitterweite der gröbsten Lage |
| `inselform` | 0.62 | 0 = kompakte Insel, 1 = Kontinent bis zum Rand |
| `meeresspiegel` | 0.27 | darunter Wasser, darüber Land |
| `umverteilung` | 1.05 | unter 1 bergiger, über 1 flacher |
| `flussAb` | 60 | Fluss ab so vielen Feldern Einzugsgebiet |
| `feldPixel` | 6 | Bildpunkte je Feld (beim Laden auf das Fenster eingepasst) |
| `namen` | an | Regionsnamen auf der Karte |
| `relief` | an | Schattierung nach Gefälle |

## Zum Testen

`index.html` reicht. Wer einen lokalen Server braucht (etwa um die Seite auf
dem Handy im selben Netz zu öffnen):

```bash
python3 -m http.server 8779
```
