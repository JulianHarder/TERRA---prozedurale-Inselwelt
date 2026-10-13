# TERRA – Projektplan

> **TERRA – eine Welt aus einem Wort.**
> Du tippst ein Wort ein, und daraus entsteht eine komplette Inselwelt: Meer, Strände, Wälder,
> Gebirge, Flüsse, Seen und benannte Regionen – sofort vollständig sichtbar.
> Ziel: prozedurale Weltgenerierung begreifbar machen – und ein Projekt, das man weggeben kann
> („nimm den Seed `nordwind`") und das beim Gegenüber exakt gleich aussieht.
> Umsetzung: Claude Code, Vanilla JavaScript, Canvas 2D, kein Build-Tool, läuft über `file://`.

---

## 1. Vision

Ein leeres Eingabefeld, ein Knopf **Welt erzeugen**. Ein Klick, und da liegt eine Landkarte von
oben: tiefes Blau außen, ein heller Küstensaum, grünes Grasland, dunkle Wälder, graue Gebirge mit
weißen Kuppen. Flüsse laufen von den Höhen zur Küste.

Jede Insel, jedes Gebirge, jeder Wald, Sumpf und See trägt einen eigenen Namen – *Westwacht*,
*Donnerhorn*, *Möwenschlag* –, und die Namen stehen direkt auf der Karte. Beim Hineinzoomen tauchen
die kleineren Gebiete nach und nach auf, sobald sie Platz haben.

**Drei Prinzipien:**

1. **Ein Wort, eine Welt.** Derselbe Seed ergibt immer dieselbe Karte – auf jedem Gerät, zu jeder
   Zeit. Das macht die Welt teilbar und das Ergebnis überprüfbar.
2. **Alles sofort sichtbar.** Die Karte wird beim Laden ins Fenster eingepasst; man sieht die
   fertige Welt auf einen Blick, statt sie sich erarbeiten zu müssen.
3. **Nichts versteckt sich im Code.** Es gibt einen Werkstatt-Modus, der die Zwischenschritte der
   Generierung einzeln zeigt (rohes Rauschen → Höhenkarte → Biome → Flüsse). Das Projekt erklärt
   sich selbst.

**Wichtig:** Es gibt keinen Server, keine KI und kein Internet zur Laufzeit. Das Wort wird in eine
Startzahl umgerechnet, und der Rest ist Mathematik im Browser – in wenigen Millisekunden.

---

## 2. Wie die Karte aussieht

Darstellung: **2D von oben**, wie die Übersichtskarte eines Strategiespiels. Jedes Feld der Welt
ist ein kleines farbiges Quadrat. Als Zeichen-Skizze:

```
        ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
      ~ ~ . . . ░ ░ ░ ~ ~ ~ ~ ~
    ~ ~ . ░ ░ ▒ ▒ ▒ ░ . ~ ~ ~ ~
    ~ . ░ ▒ ▓ ▲ ▲ ▒ ▒ ░ . ~ ~ ~
    ~ . ░ ▒ ▲ ███ ▲ ▓ ▒ ░ ~ ~ ~
    ~ ~ . ░ ▒ ▲ ▲ ▓ ▒ ░ . ~ ~ ~
      ~ ~ . . ░ ▒ ▒ ░ . ~ ~ ~ ~
        ~ ~ ~ ~ . . ~ ~ ~ ~ ~ ~

  ~ Meer   . Strand   ░ Grasland
  ▒ Wald   ▓ Fels   ▲ Berg   ███ Schnee
```

Im Browser sind das keine Zeichen, sondern Farbflächen – und statt 12 × 8 Feldern sind es
**256 × 256**, also rund 65.000. Bei 6 Pixeln pro Feld ergibt das eine Karte von 1.536 × 1.536 Pixeln –
mehr, als ins Fenster passt, deshalb folgt eine Kamera dem Entdecker.

Begründung für 2D statt 3D: Der Nebel wirkt von oben am besten, weil man auf einen Blick sieht, was
man kennt und wo noch Schwarz liegt. Außerdem ist früh etwas Fertiges da. Die isometrische Ansicht
(Felder als Rauten, nach Höhe verschoben, Anno-Look) ist als **optionale Etappe 8** vorgesehen –
die Höhendaten liegen dann längst vor, es ist reine Zeichenarbeit.

### Bildschirmaufteilung

```
┌──────────────────────────────────────────────────────────────┐
│  TERRA   Seed: [ nordwind ] [Welt erzeugen] [Zufall]         │
│  [Namen] [Werkstatt] [PNG] [Link] [?]                        │
├──────────────────────────────────────┬───────────────────────┤
│                                      │  DIESE WELT           │
│              ░░░▒▒▒░░                │   Seed      nordwind  │
│           ░▒▒▲▲███▲▒▒▒░░             │   Regionen        19  │
│         ░▒▒▲ Donnerhorn ▒▒░          │   Landanteil    35 %  │
│        ░▒▒  Gebirgszug   ▒▒░         │   Erzeugt in  122 ms  │
│       ░▒▒▒              ▒▒▒░         │  ───────────────      │
│      ░▒   W E S T W A C H T  ▒░      │  ▣ Minikarte          │
│       ░▒▒   Möwenschlag  ▒▒░         │  ▣ Legende            │
│         ░░▒▒▒▒░░░░▒▒▒▒░░             │                       │
├──────────────────────────────────────┴───────────────────────┤
│  Mausrad = zoomen   0 = ganze Welt   B = Namen   E = Werkstatt│
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Tech-Stack und Entscheidungen

| Bereich | Wahl | Begründung |
|---|---|---|
| Build | **Kein Build-Tool** (klassische `<script>`-Tags) | `index.html` muss per Doppelklick über `file://` laufen; Browser blockieren ES-Module über `file://`, klassische Skripte nicht |
| Grafik | **Canvas 2D**, keine Bibliothek | Farbige Quadrate zeichnen braucht kein Framework; kein Three.js, kein WebGL nötig |
| Sprache | **Vanilla JavaScript**, klassische Skripte (kein `import`/`export`, gemeinsamer `window.TERRA`-Namensraum) | Wie HOP – bekannt und läuft ohne Bundler |
| Rauschen | **Eigene Value-Noise-Umsetzung** (ca. 60 Zeilen), jede Lage leicht gedreht | Der Lernkern des Projekts. Eine Bibliothek würde genau das wegnehmen, was man verstehen will. Simplex war nicht nötig: die Drehung je Lage bricht das Gittermuster schon auf |
| Zufall | **Eigener Seed-Generator** (`mulberry32`, 5 Zeilen) | `Math.random()` ist nicht reproduzierbar und kennt keinen Seed – damit wäre die ganze Idee kaputt |
| Zeichnen | Drei gestapelte Canvas-Ebenen (Gelände / Nebel / Figur) | Nebel und Figur ändern sich ständig, das Gelände fast nie – getrennte Ebenen sparen das Neuzeichnen von 65.000 Feldern pro Bild |
| Speicherung | `localStorage` (Seed, aufgedeckter Nebel, Logbuch) | Kein Backend nötig; Browser zu, Browser auf, Welt ist wieder da |
| Sprache der Inhalte | Deutsch | Wie alle anderen Projekte |
| Versionierung | **Git ja** (eigenes Repo), Push nur auf Zuruf | Wie TRACE; später Kopie ins Portfolio unter `projekte/terra/` |

**Bewusst nicht:** TypeScript, React, 3D, Physik, Pathfinding, Gegner, Kampf, Backend, Mehrspieler.
Das sind alles Dinge, die man später draufsetzen kann – jetzt würden sie nur bremsen.

---

## 4. Projektstruktur

```
TERRA - prozedurale Inselwelt/
├── CLAUDE.md                  # Projektregeln für Claude Code (Anhang A)
├── TERRA-Plan.md              # Diese Datei
├── README.md                  # Kurzbeschreibung + Bedienung
├── index.html                 # Lädt alle Skripte klassisch, in fester Reihenfolge
├── css/
│   ├── variablen.css          # Farben, Abstände, Schriftgrößen als CSS-Variablen
│   ├── grundlage.css          # Seitengerüst, Schrift, Reset
│   ├── karte.css              # Canvas-Stapel, Rahmen, Cursor
│   └── oberflaeche.css        # Kopfzeile, Logbuch, Legende, Werkstatt-Fenster
├── js/
│   ├── main.js                # Einstieg: baut alles zusammen, startet die Schleife
│   ├── kern/
│   │   ├── Zufall.js          # Seed-Wort → Startzahl → reproduzierbarer Zahlenstrom
│   │   ├── Rauschen.js        # Value/Simplex-Noise + fBm (mehrere Lagen übereinander)
│   │   └── Zustand.js         # Zentraler Zustand (Seed, Position, Nebel, Logbuch)
│   ├── welt/
│   │   ├── Hoehenkarte.js     # Rauschen + Inselmaske → Höhe pro Feld
│   │   ├── Feuchtigkeit.js    # Zweite Rauschkarte → Feuchtigkeit pro Feld
│   │   ├── Biome.js           # Tabelle Höhe × Feuchtigkeit → Biom
│   │   ├── Fluesse.js         # Abfluss, Seen, Einzugsgebiet → Flussnetz
│   │   ├── Namen.js           # Silbenbaukasten für Orts- und Regionsnamen
│   │   ├── Regionen.js        # Zusammenhängende Gebiete finden (Flood Fill)
│   │   └── Welt.js            # Setzt die sechs Schritte zusammen
│   ├── zeichnen/
│   │   ├── GelaendeEbene.js   # Zeichnet die Biom-Farben (nur bei neuer Welt)
│   │   ├── Beschriftung.js    # Regionsnamen auf der Karte
│   │   ├── FigurEbene.js      # Pfeil, dem die Kamera folgt
│   │   ├── Ansicht.js         # Kamera und Zusammenspiel der drei Ebenen
│   │   └── Minikarte.js       # Ganze Welt klein, mit Nebelstand
│   ├── spiel/
│   │   ├── Entdecker.js       # Bewegung des Ausschnitts, Geländegeschwindigkeit
│   │   ├── Aufdecken.js       # Sichtkreis in die Nebelmaske stanzen, Prozent zählen
│   │   ├── Logbuch.js         # Entdeckungen sammeln und anzeigen
│   │   └── Speicher.js        # localStorage lesen/schreiben
│   ├── ui/
│   │   ├── Kopfzeile.js       # Seed-Eingabe, Knöpfe
│   │   ├── Seitenleiste.js    # Logbuch, Prozentanzeige, Legende
│   │   ├── Werkstatt.js       # Zwischenschritte der Generierung anzeigen
│   │   └── Tastatur.js        # WASD, Klick-Ziel, Tastenkürzel
│   └── daten/
│       ├── biome.js           # Biom-Definitionen: Name, Farbe, Schwellwerte, Tempo
│       ├── silben.js          # Silben für den Namensgenerator
│       └── texte.js           # Alle Oberflächentexte an einer Stelle
└── screenshots/               # Bilder fürs Portfolio
```

---

## 5. Wie die Welt entsteht (der fachliche Kern)

Sechs Schritte, in dieser Reihenfolge. Jeder Schritt nimmt das Ergebnis des vorigen.

### Schritt 1 – Vom Wort zur Zahl

Das Seed-Wort wird Zeichen für Zeichen in eine einzige 32-Bit-Zahl verrechnet (`cyrb53`-artig).
Diese Zahl füttert `mulberry32`, einen winzigen Zufallsgenerator: Er liefert bei gleichem Start
immer dieselbe Zahlenfolge. Ab hier wird `Math.random()` im ganzen Projekt **nicht mehr benutzt** –
sonst wäre die Welt nicht reproduzierbar.

```
"nordwind"  →  2 847 193 044  →  0.3912, 0.8044, 0.1177, 0.9930, …  (immer gleich)
```

### Schritt 2 – Rauschen statt Zufall

Reiner Zufall sieht aus wie Fernsehrauschen – als Gelände unbrauchbar. **Noise** liefert stattdessen
sanft verlaufende Werte: Nachbarfelder sind ähnlich, weit entfernte unabhängig. Das Verfahren:

1. Ein Gitter von Stützpunkten, jeder mit einem Zufallswert aus Schritt 1.
2. Für jeden Punkt dazwischen wird zwischen den vier umliegenden Stützpunkten weich überblendet
   (keine lineare Überblendung, sondern eine geglättete Kurve – sonst sieht man das Gitter).

Dann **fBm**: mehrere Rauschlagen übereinander addieren.

| Lage | Gitterweite | Gewicht | Was sie macht |
|---|---|---|---|
| 1 | sehr grob | 1,0 | Kontinent-Umriss, wo überhaupt Land ist |
| 2 | grob | 0,5 | Gebirgszüge und große Täler |
| 3 | mittel | 0,25 | einzelne Hügel |
| 4 | fein | 0,125 | Felsen, raue Küsten |
| 5 | sehr fein | 0,06 | Körnung, damit nichts glatt wirkt |

Jede Lage halbiert ihr Gewicht und verdoppelt ihre Frequenz. Das ist das ganze Geheimnis hinter
Minecraft, No Man's Sky und jeder zufällig erzeugten Landschaft.

### Schritt 3 – Aus Rauschen wird eine Insel

Rohes fBm ergibt eine endlose Hügellandschaft ohne Rand. Damit eine **Insel** daraus wird,
multipliziert man es mit einer Maske, die in der Mitte 1 ist und zum Rand hin auf 0 fällt:

```
Höhe(x,y) = fBm(x,y) × Inselmaske(Abstand zur Mitte)
```

Ein Regler „Inselform ↔ Kontinent" stellt ein, wie hart dieser Abfall ist. Danach kommt eine
Umverteilungskurve (`Math.pow`), die steuert, ob die Welt flach mit wenigen Bergen ist oder
zerklüftet.

### Schritt 4 – Biome

Zweite, unabhängige Rauschkarte für die **Feuchtigkeit** (anderer Seed-Versatz). Aus Höhe und
Feuchtigkeit ergibt sich das Biom per Tabelle.

Die Schwellwerte sind dabei **nicht absolut, sondern relativ** – Wasser als Anteil des
Meeresspiegels, Land als Anteil der Landhöhe. Dadurch bleibt die Tabelle richtig, auch wenn der
Meeresspiegel-Regler bewegt wird; mit festen Zahlen hätte man sonst jedes Mal alles nachziehen
müssen.

Wasser (Anteil des Meeresspiegels, 0 = tiefste Stelle, 1 = Wasserkante):

| bis | Biom |
|---|---|
| 0,55 | tiefes Meer |
| 0,86 | Meer |
| 1,00 | flaches Wasser |

Land (Anteil der Landhöhe, 0 = Wasserkante, 1 = höchster Punkt):

| bis | trocken | mittel | feucht |
|---|---|---|---|
| 0,06 | Strand | Strand | Marsch |
| 0,30 | Steppe | Grasland | Sumpf |
| 0,58 | Buschland | Laubwald | Nadelwald |
| 0,82 | Fels | Bergwald | Nadelwald |
| 1,00 | Geröll | Schnee | Gletscher |

Die Schwellwerte stehen in `daten/biome.js`, nicht im Code – damit man sie justieren kann, ohne
Logik anzufassen. **Das ist die Stelle, an der am meisten probiert wird**, und genau dafür gibt es
die Werkstatt (Etappe 6).

### Schritt 5 – Flüsse und Seen

**Geplant war der Tropfen-Ansatz:** 150-mal einen Tropfen auf einen Berg setzen, immer auf den
tiefsten der acht Nachbarn weiterlaufen lassen und dort einen Fluss zeichnen, wo mehrere
durchkamen. Beim Bauen stellte sich heraus, dass das nicht funktioniert: zwei zufällige Tropfen
nehmen selten genau dieselbe Spur. Das Ergebnis waren 329 abgerissene Stummel statt Flüssen.

**Umgesetzt ist deshalb das Einzugsgebiet**, in drei Durchgängen:

1. **Abfluss.** Für jedes Landfeld den tiefsten der acht Nachbarn merken – die Richtung, in die
   sein Wasser läuft.
2. **Seen.** Felder ohne tieferen Nachbarn sind Senken. Dort läuft ein See voll: der Wasserstand
   steigt schrittweise, indem immer das niedrigste Feld am Seerand dazukommt, bis ein Randfeld
   unter dem Pegel liegt – das ist der Überlauf, und von dort fließt das Wasser weiter.
   Wichtig: **jede** Senke wird so geleitet, nicht nur die, aus denen ein sichtbarer See wird.
   Sonst versickert dort das Wasser ihres Einzugsgebiets und das Flussnetz bricht ab.
3. **Sammeln.** Alle Felder von hoch nach tief durchgehen und jedes sein gesammeltes Wasser an
   seinen Abfluss weitergeben. Danach weiß jedes Feld, wie viele Felder in es entwässern.

Ein Fluss ist dann einfach jedes Feld, in das mehr als `flussAb` Felder entwässern (Standard: 60).
Dadurch sind Flüsse von selbst durchgehend, werden talwärts breiter und verzweigen sich wie echte
Flusssysteme. Das größte Einzugsgebiet einer Welt liegt bei rund 1.000 bis 3.300 Feldern.

### Schritt 6 – Regionen und Namen

**Flood Fill** findet zusammenhängende Gebiete gleicher Art: jede Landmasse eine Insel, jedes
Hochgebirge ein Gebirgszug, jede Meeresbucht eine Bucht. Jedes Gebiet ab einer Mindestgröße bekommt
einen Namen aus dem Silbenbaukasten (`Kalm` + `fjord`, `Ost` + `wacht`, `Drei` + `Zähne`) – gezogen
aus demselben Seed-Zahlenstrom, also auch reproduzierbar. Diese Gebiete sind das, was das Logbuch
später abhakt.

---

## 6. Etappen

> **Stand: Etappen 1 bis 7 sind gebaut und im Browser geprüft.**
> Offen sind nur die Kür-Etappen 8 (isometrische Ansicht) und 9 (Ideen für später).

Jede Etappe endet mit etwas, das man im Browser sehen und anfassen kann. Nach jeder Etappe:
Sicherungskopie / Commit, Screenshot, kurz durchklicken.

### ✅ Etappe 1 – Gerüst und erste Höhenkarte *(Grundlage)*
`index.html`, CSS-Variablen, Canvas-Stapel, `Zufall.js`, `Rauschen.js`, `Hoehenkarte.js`.
**Fertig, wenn:** Eine Graustufen-Höhenkarte erscheint, Seed-Eingabe funktioniert, dasselbe Wort
ergibt dasselbe Bild.

### ✅ Etappe 2 – Insel und Biome *(das erste „Oha"-Erlebnis)*
Inselmaske, Feuchtigkeitskarte, Biom-Tabelle, Farbpalette, Legende.
**Fertig, wenn:** Eine farbige Insel liegt da, die nach Landschaft aussieht und nicht nach
Nudelsuppe. Hier wird nachjustiert, bis es stimmt.

### ✅ Etappe 3 – Flüsse und Küstenlinie *(Feinschliff am Gelände)*
Tropfen-Algorithmus, dunklere Küstenkante, flaches Wasser abgesetzt.
**Fertig, wenn:** Flüsse laufen plausibel von Bergen zum Meer und bündeln sich.

### ✅ Etappe 4 – Kamera und Bewegung *(aus Bild wird Ansicht)*
Kamera mit Zoom, WASD + Klick-Ziel zum Verschieben des Ausschnitts, Einpassen der ganzen Welt.
**Fertig, wenn:** Man die Welt im Ganzen sieht und frei hineinzoomen kann.

> Ursprünglich war hier ein **Nebel** vorgesehen, der beim Herumlaufen aufgedeckt wird. Das wurde
> gebaut, erprobt und auf Julians Wunsch wieder **vollständig entfernt** – die Welt soll sofort
> ganz zu sehen sein. Siehe Anhang B.

### ✅ Etappe 5 – Regionen, Namen, Beschriftung *(die Karte bekommt Sprache)*
Flood Fill, Namensgenerator, Namen auf der Karte (nach Bildschirmgröße gefiltert), Minikarte,
Speichern von Seed, Reglern und Ausschnitt in `localStorage`.
**Fertig, wenn:** Jedes nennenswerte Gebiet einen Namen auf der Karte trägt und ein Neuladen
dieselbe Welt mit demselben Ausschnitt zeigt.

### ✅ Etappe 6 – Werkstatt-Modus *(das Projekt erklärt sich selbst)*
Fenster mit den Zwischenschritten: rohes Rauschen, jede fBm-Lage einzeln, Höhe, Maske, Feuchtigkeit,
Biome, Flüsse. Regler für Lagenzahl, Inselform, Meeresspiegel, Feldgröße – live.
**Fertig, wenn:** Man am Regler zieht und sofort sieht, was sich ändert. Das ist der Teil, der im
Portfolio zeigt, dass du es verstanden hast.

### ✅ Etappe 7 – Politur und Portfolio *(abschließen)*
Ladebalken bei der Generierung, PNG-Export der Karte, Seed-Link teilen (`?seed=nordwind`),
Tastaturhilfe, `README.md`, Screenshots, Eintrag in `projekte-entdecken.js`.

### Etappe 8 – *optional:* isometrische Ansicht
Umschalter 2D ↔ 2.5D: dieselben Daten als Rauten mit Höhenversatz. Reine Zeichenarbeit.

### Etappe 9 – *optional:* Ideen für später
Tag/Nacht mit wanderndem Licht · Jahreszeiten-Palette · Tierspuren an Wasserstellen · Ruinen zum
Finden · Höhenlinien-Ansicht wie eine Wanderkarte · Fernrohr (Sichtkreis kurz vergrößern).

---

## 7. Spielregeln und Zahlen

| Größe | Wert | Anmerkung |
|---|---|---|
| Weltgröße | 256 × 256 Felder | 65.536 Felder, generiert in 70–160 ms |
| Felder-Pixel | 6 px (einstellbar 2–10) | Karte 1.536 × 1.536 px, Kamera folgt |
| Zoom | 1–12 px je Feld | Mausrad, `+`/`−`; `0` passt die ganze Welt ein, beim Laden automatisch |
| Namen auf der Karte | ab ~46 px Gebietsbreite | kleinere Gebiete erscheinen erst beim Hineinzoomen |
| Meeresspiegel | Höhe 0,27 | per Regler verstellbar; ergibt ~30 % Landfläche |
| Inselform | 0,62 | 0 = kompakte Insel, 1 = Kontinent bis zum Rand |
| Flüsse ab | 60 Felder Einzugsgebiet | kleiner = dichteres Netz |
| Seen je Welt | höchstens 7 | sonst wird die Welt zur Seenplatte |
| Mindestgröße Region | 40–120 Felder je Art | kleinere bekommen keinen Namen |
| Regionen je Welt | etwa 18–26 | Inseln, Gebirge, Wälder, Sümpfe, Trockenland, Seen |
| Tempo | Grasland 1,0 · Wald 0,7 · Fels 0,5 · Berg 0,35 · Wasser 0 | Gelände ist spürbar |
| Zielbildrate | 60 fps | nur Nebel- und Figurebene werden neu gezeichnet |

---

## 8. Was dabei gelernt wird

- **Prozedurale Generierung**: Noise, fBm, Masken, Umverteilungskurven – die Technik hinter jeder
  zufällig erzeugten Spielwelt
- **Seeded Random**: warum `Math.random()` für reproduzierbare Ergebnisse unbrauchbar ist
- **2D-Arrays als Datenmodell**: Welt als Gitter, Nachbarschaftssuche, Flood Fill
- **Canvas-Ebenen und Performance**: was neu gezeichnet werden muss und was nicht
- **Kamera und Koordinaten**: Umrechnung Bildschirm ↔ Weltkoordinaten
- **Zustand speichern**: `localStorage`, Welt aus Seed + Fortschritt wiederherstellen
- **Daten vom Code trennen**: Biome und Texte in eigenen Dateien, Logik bleibt sauber

---

## Anhang A – Inhalt für `CLAUDE.md`

```markdown
# TERRA – Projektregeln

## Projekt
Prozedural erzeugte Inselwelt zum Erkunden, 2D-Karte von oben, Nebel wird beim Laufen aufgedeckt.
Ein Seed-Wort ergibt immer dieselbe Welt. Der vollständige Plan steht in TERRA-Plan.md.

## Stack
- Vanilla JavaScript, Canvas 2D, kein Framework, kein TypeScript, kein Build-Tool
- **Kein ES-Module-Syntax (`import`/`export`) in `js/`.** `index.html` lädt klassische
  `<script>`-Tags in fester Reihenfolge, jede Datei hängt sich an `window.TERRA`.
  Grund: Die Seite muss per Doppelklick über `file://` laufen.
- Keine Noise-Bibliothek. Das Rauschen wird selbst geschrieben – es ist der Lernkern.
- Inhalte auf Deutsch, Kommentare auf Deutsch, Code-Bezeichner auf Englisch.

## Regeln
- **`Math.random()` ist im ganzen Projekt verboten.** Jede Zufallszahl kommt aus
  `TERRA.Zufall` mit dem Seed der Welt – sonst ist die Welt nicht reproduzierbar.
- Generierung ist eine reine Funktion: gleicher Seed + gleiche Einstellungen = gleiche Welt.
  Keine Zeitabhängigkeit, kein `Date.now()` in der Generierung.
- Biom-Schwellwerte, Farben und Texte liegen in `js/daten/`, nicht im Code.
- Gelände-Ebene nur bei neuer Welt neu zeichnen, nie pro Bild. Pro Bild nur Nebel und Figur.
- Keine Datei über 500 Zeilen. Ab ca. 350 Zeilen aufteilen. Nach Änderungen prüfen:
  `find js css -name "*.js" -o -name "*.css" | xargs wc -l | sort -n`
- Nur an der aktuellen Etappe arbeiten, nicht an mehreren gleichzeitig.
- Vor größeren Änderungen erst einen kurzen Plan zeigen.

## Befehle
- Kein Build, kein Dev-Server: `index.html` per Doppelklick im Browser öffnen.

## Arbeitsweise
- Git: ja, eigenes Repo. Commits auf Zuruf, Push nur wenn Julian „push" sagt.
- Nach jeder Etappe: Screenshot in `screenshots/`, kurz durchklicken, dann weiter.
```

---

## Anhang B – Getroffene Entscheidungen

| Frage | Entscheidung | Begründung |
|---|---|---|
| Baust du mit oder baue ich fertig? | Claude baut allein durch | Julians Wunsch |
| Weltgröße | 256² (65.536 Felder) | Generierung bleibt unter 160 ms |
| Value-Noise oder Simplex | Value-Noise, mit Drehung je Lage | Simplex war nicht nötig: die Drehung pro Lage bricht das Gittermuster schon auf |
| Darstellung der Figur | Pfeil in Laufrichtung | wie geplant |
| Flussalgorithmus | Einzugsgebiet statt Tropfen | Tropfen ergaben abgerissene Stummel, siehe Abschnitt 5 |
| Seen | höchstens 7, Becken steigt bis zum Überlauf | der erste Ansatz erzeugte gerade Striche quer durch die Karte |
| `index.html` | im Wurzelverzeichnis | damit GitHub sie als Einstieg erkennt |
| Externe Abhängigkeiten | keine, auch keine Webfonts | Julians Vorgabe: nichts laden |

### Nachträglich geändert

| Was | Warum |
|---|---|
| **Nebel, Fortschritt und Logbuch vollständig entfernt** | Julians Wunsch nach dem Ausprobieren: man soll die erzeugte Welt sofort ganz sehen. Erst war der Nebel nur standardmäßig aus und über `N` umschaltbar – auch das sollte weg. Gelöscht wurden `NebelEbene.js`, `Aufdecken.js` und `Logbuch.js` samt aller Zustände. TERRA ist damit ein **Weltbetrachter**, kein Erkundungsspiel. |
| Regionsnamen direkt auf der Karte | Folge der Streichung: ohne Logbuch wären die erzeugten Namen nirgends mehr zu sehen, und der ganze Namensgenerator wäre unsichtbare Arbeit. Gefiltert nach Bildschirmgröße, damit die eingepasste Karte nicht zugepflastert ist. `B` blendet sie aus. |
| Zoom über Mausrad, `+`/`−` und `0` | Gehört zur offenen Karte dazu: ohne Zoom sieht man entweder nur einen Ausschnitt oder alles zu klein. Beim Laden wird die Welt automatisch eingepasst. |
| Seitenleiste zeigt Angaben zur Welt | Der Platz von Fortschritt und Logbuch: Seed, Regionenzahl, Landanteil, Generierungsdauer. |

### Noch offen

| Frage | Anmerkung |
|---|---|
| Name des GitHub-Repos | Julian sagte „redme" – noch zu klären, siehe Gespräch |
| Isometrische Ansicht (Etappe 8) | Höhendaten liegen vor, wäre reine Zeichenarbeit |
