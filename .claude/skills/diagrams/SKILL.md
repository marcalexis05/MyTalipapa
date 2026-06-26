---
name: diagrams
description: >-
  Create professional, hand-designed system diagrams — Data Flow Diagrams (DFDs in
  Yourdon–DeMarco notation), Entity-Relationship Diagrams (ERDs with crow's-foot), and
  process flowcharts — using a custom SVG engine with deliberate layout and orthogonal
  connector routing (NOT Mermaid / auto-layout). Renders to crisp PNG and vector PDF via
  headless Chrome, and packages into per-artifact PDFs (cover page + per-diagram
  explanations) plus an editable Word document. Use whenever asked to create, update,
  redesign, or export DFDs, ERDs, data-flow diagrams, entity-relationship diagrams,
  context diagrams, process flowcharts, or a system-design diagram document/PDF.
---

# Hand-designed system diagrams (DFD · ERD · Flowchart)

This is the exact method used to build the MyTalipapa diagram package. Reproduce it
faithfully. The client rejected Mermaid/auto-layout ("looks generated") and wanted
**Yourdon–DeMarco** DFDs. So we draw with a small custom SVG engine where **every node
position and every connector waypoint is placed by hand**.

## Golden rules
1. **Never use Mermaid, Graphviz, or any auto-layout** for the final diagrams. Use the
   bundled engine (`engine/gen.js`). Deliberate placement is the whole point.
2. **Yourdon–DeMarco notation** for DFDs: process = **circle** (numbered), external
   entity = **rectangle**, data store = **open parallel lines** (DeMarco), off-page
   link to another level = **teal circle**, data flow = **labelled arrow**.
3. **Orthogonal connectors** (right-angle, rounded corners) on dense diagrams; straight
   radial lines are fine for a context (Level 0) bubble.
4. **Verify every diagram visually before delivering** — render to PNG, downscale, and
   look at it. Fix overlaps/clipping. Iterate.
5. Keep one consistent visual system across all diagrams (tokens are in `engine/gen.js`).

## Workflow

### 0. Setup (once per session)
- The render pipeline needs **headless Chrome** and **Python+Pillow**. Chrome is at
  `C:\Program Files\Google\Chrome\Application\chrome.exe` on this machine.
- For PDF packaging you also need Node `docx` only for the Word doc; PDFs use Chrome's
  `--print-to-pdf`. `PyMuPDF` (`import fitz`) is available to render PDF pages for QA.
- Work in a scratch dir; copy `engine/gen.js` next to your diagram scripts.

### 1. Author each diagram (`<name>.gen.js`)
`require('./gen')` and place nodes at **explicit coordinates**, then list edges as
**explicit orthogonal waypoint arrays**. See `engine/example-dfd.gen.js` and the worked
set in `docs/diagrams/src/*.gen.js` (l0, l1, l2, l3, navl2, navl3, erd, flow).

Engine API (`engine/gen.js`):
- `entity(cx,cy,w,h,lines)` — grey rectangle external entity.
- `proc(cx,cy,r,lines)` — blue circle process (Yourdon). `link(cx,cy,r,lines)` — teal off-page link.
- `store(cx,cy,w,id,name)` — DeMarco open data store (parallel lines + D-id compartment).
- `edge(pts[, {both}])` — orthogonal arrow through `[{x,y}…]`, rounded corners.
- `label(x,y,text)` — white pill flow label (place at a segment midpoint).
- `terminator/action/diamond` — flowchart shapes (stadium / rect / decision).
- `erEntity(x,y,title,rows)` — ER table; returns `{svg, box}`. `rows`=`[{type,name,key}]`.
- `rel(pts, lbl)` — crow's-foot relationship (one `||` at start, many `o<` at end).
- `render(name, [w,h], body, title)` — writes `<name>.svg` (title becomes a heading bar).

### 2. Layout principles (how to keep dense DFDs clean)
- **Bands**: external entities across the **top**, processes in the **middle**, data
  stores across the **bottom**. Most flows become short verticals.
- **Align into columns**: put each entity directly above the process it mainly talks to,
  and each store directly **under its owning process** — then entity→process→store are
  straight vertical lines. Only the ~2 unavoidable bipartite crossings remain.
- **Lanes**: when horizontal segments must cross, give each its own Y (a "lane") so
  labels never collide. Offset parallel vertical pairs by ~16px.
- **Watch out**: a store sitting directly under a process makes the vertical store-link
  clip the circle — **offset one of them**. Keep labels on a segment, not floating.
- Context diagram (L0): single big circle centre, entities around it, **straight radial**
  bidirectional pairs (offset ±8 perpendicular). See `engine/example-context.gen.js`.

### 3. Render to PNG (and self-check)
Use `engine/render.sh <name> [winW] [winH]` — it runs the gen script, wraps the SVG in
HTML, screenshots with Chrome at `--force-device-scale-factor=2`, and PIL-autocrops to
`<name>.png` (+ a `<name>_view.png` thumbnail ≤1500px to actually look at). **Read the
thumbnail and fix issues before moving on.** Large PNGs (>2000px) can't be Read directly —
that's why a thumbnail is produced.

### 4. Package the deliverables
Run `package/build-pdf.js` (edit the diagram list + explanations at the top). It builds,
per artifact, a print HTML with:
- a **cover page** (project title, artifact name, notation, version/date),
- each diagram on its own page with an **explanation block** (heading + 2–4 sentence
  description + the sub-process list for decomposition diagrams), with the SVG's embedded
  title **stripped** so it reads as one clean figure,
then prints to PDF with Chrome `--headless=new --no-pdf-header-footer --print-to-pdf`.
- DFDs/ERD → **A4 landscape**; tall flowcharts → **A4 portrait**.
- Split large sets sensibly (e.g. DFD "System & Management" vs "Navigation").
- Verify pages with PyMuPDF: `fitz.open(pdf)[n].get_pixmap(dpi=85).save(...)` then Read.

For the editable **Word document**, mirror the structure of
`docs/diagrams/src/` build (cover, TOC, system overview, notation key, external-entities
table, data dictionary, then each diagram + narrative). docx-js gotchas: set page size
explicitly (US Letter 12240×15840 DXA), tables need both `columnWidths` and per-cell
`width` in DXA, use `ShadingType.CLEAR`, images need `type:"png"`. Validate with the
docx skill's `validate.py` (run with `PYTHONUTF8=1`).

## Notation reference
- **Process** — blue circle, numbered `0`, `1.0`, `2.1`, `2.2.1` …
- **External entity** — grey rectangle.
- **Data store** — amber open parallel lines, labelled `D1 · Accounts`.
- **Off-page link** — teal circle ("from 2.1", "to 4.4").
- **Data flow** — arrow; the label names the data that moves.
- **ERD** — table per entity (type · name · PK/FK); crow's-foot ends = cardinality
  (single bar = one, fork = many).
- **Flowchart** — green stadium = start/end, blue rect = action, amber diamond = decision.

## Environment notes (this machine)
- **Chrome path**: `C:\Program Files\Google\Chrome\Application\chrome.exe`. No Graphviz,
  Mermaid CLI, Java, or LibreOffice. `npm i mermaid/docx` works if ever needed.
- **No PDF from docx locally** (no LibreOffice) — generate PDFs from the SVGs via Chrome
  `--print-to-pdf` (this skill's method), or tell the user to "Save as PDF" from Word.
- **SendUserFile is not available** here — deliver via on-disk paths and, to show a
  diagram inline for approval, pass the SVG to `show_widget` (it renders standalone SVG).
- Deliverables live in `docs/diagrams/` (PNG + `src/*.svg` + `src/*.gen.js`) and
  `docs/*.pdf` / `docs/*.docx`.

## Quick checklist
- [ ] Yourdon–DeMarco shapes, custom engine (not Mermaid).
- [ ] Entities top / processes mid / stores bottom; columns aligned; stores under owners.
- [ ] Orthogonal connectors on lanes; no clipped circles; labels on segments.
- [ ] Rendered, thumbnail-checked, overlaps fixed.
- [ ] PDFs: cover + per-diagram explanations + stripped duplicate title; landscape DFDs.
- [ ] Word doc rebuilt + validated. Confirm the style with the user on the first diagram.
