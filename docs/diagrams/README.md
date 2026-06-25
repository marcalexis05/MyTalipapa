# MyTalipapa — DFDs, ERD & Process Flowchart

System diagrams for the MyTalipapa paperless public-market navigation & stall-management
system. DFDs use **Yourdon–DeMarco** notation; rendered with **Mermaid** (automatic layout).

- **`*.png`** — high-resolution images, ready to drop into Word / PowerPoint / PDF.
- **`src/*.mmd`** — editable Mermaid source. Tweak text/flows and re-render.
- Compiled document: **`../MyTalipapa-DFD-ERD-and-Flowchart.docx`**.

| Image | Diagram |
|-------|---------|
| `dfd-level-0-context.png` | **DFD Level 0** — context diagram |
| `dfd-level-1-system.png` | **DFD Level 1** — 6 processes + 7 data stores |
| `dfd-level-2-applications.png` | **DFD Level 2** — 2.0 Applications & Approval |
| `dfd-level-3-review.png` | **DFD Level 3** — 2.2 Review & Validate |
| `dfd-level-2-navigation.png` | **DFD Level 2** — 4.0 Navigate & Find Stalls |
| `dfd-level-3-route.png` | **DFD Level 3** — 4.3 Compute Walking Route |
| `erd.png` | **Entity-Relationship Diagram** (data model) |
| `process-flowchart-wayfinding.png` | **Process Flowchart** — shopper wayfinding |

## Notation (Yourdon–DeMarco)
- **Circle / bubble** (blue) = process (numbered 0, 1.0, 2.1, 2.2.1 …)
- **Rectangle** (grey) = external entity
- **Open parallel lines** (amber) = data store (D1–D7)
- **Circle** (teal) = link to a process detailed on another level
- **Arrow** = data flow (the label names the data that moves)
- **ERD**: crow's-foot cardinality (single bar = one, fork = many); PK / FK attributes
- Flowchart: stadium = start/end, rectangle = action, diamond = decision

Data stores: D1 Accounts · D2 Stalls · D3 Applications · D4 Payments · D5 Contracts · D6 Notifications · D7 Map / Pathway Data

## Regenerating / editing
Edit `src/*.mmd` (Mermaid `flowchart` / `erDiagram` syntax), then re-render at
<https://mermaid.live> or locally with `src/render-build.js` + headless Chrome.
Note: DFD data stores are drawn as Mermaid rectangles and converted to Yourdon–DeMarco
open parallel lines by a small post-process step in the render harness.
