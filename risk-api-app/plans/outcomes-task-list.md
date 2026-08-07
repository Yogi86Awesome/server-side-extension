# Risk API — Outcomes & Daily Ops Task List

Work top to bottom. `[ ]` = to do, `[~]` = blocked, **Owner** and **Blocker** noted inline.
Companion spec: [`outcomes-sheet-build-plan.md`](./outcomes-sheet-build-plan.md)

---

## 🔎 Pre-work — confirm before building (do first)
- [ ] Get exact **band field name** + the **"slightly above"** value string — *Owner: Yogi*
- [ ] List every **REL counter object** on Daily Ops and Encounters — *Owner: Yogi*
- [ ] Confirm model keeps **per-run REL history** per HAR (needed for "improved") — *Owner: Yogi*
- [ ] Confirm **variable-level grain + a date** exists (or is a concatenated string) — *Owner: Yogi*
- [ ] Confirm how **"final"** HAR and **"improved"** REL are defined — *Owner: Yogi / Marci*
- [ ] Identify **which 2 charts** to move off Encounters, and remove-vs-duplicate — *Owner: Yogi*
- [ ] **Marci** to share the **high-weighted variable list** — *Owner: Marci*

---

## 🟢 Phase 1 — Daily Ops "slightly above" + REL counters
- [ ] Add **"slightly above"** rows to the Daily Ops table (expand the set-analysis filter)
- [ ] Update **REL counters on Daily Ops** to include the new band
- [ ] Update **REL counters on Encounters** to match
- [ ] Reconcile: counter totals = Daily Ops row counts for the same selection

---

## 🟢 Phase 2 — New "Outcomes" sheet
- [ ] Create sheet titled **`Outcomes`**
- [ ] Add filter pane: Hospital, CDI Status, REL Band, Month, MSDRG / MSDRG Group
- [ ] **2.1** Table — REL Value **HAR count by hospital** (pivot: Hospital × REL band)
- [ ] **2.3** Table — **final HAR per CDI status** + **# of API runs**
- [~] **2.2** Table — **HARs improved in REL** — *Blocker: per-run REL history confirmation*
- [~] **2.4** **Most frequent final variables triggered over time** (bar + monthly trend) — *Blocker: variable-level grain*
- [~] **2.5** **Most frequent highest-weighted variables** — *Blocker: Marci's list*
- [ ] **2.6** Move the **2 charts** from Encounters → Outcomes (convert to master viz or rebuild)

---

## 🔴 Phase 3 — Vizient metrics (needs new feed)
- [ ] **Mon 8/10** — Vizient feed review w/ Matt; lock data spec (fields, grain, keys, history, cadence)
- [~] **CMI** per hospital over time — monthly line, filter by MSDRG & MSDRG groups — *Blocker: feed*
- [~] **Mortality O/E** (same source) — line per hospital, show Observed # / Expected # — *Blocker: feed*

---

### Suggested order
1. Pre-work confirmations → **Phase 1** (ship + reconcile)
2. **2.1** and **2.3** (lowest data risk) → sheet + filter pane
3. Unblock and build **2.2**, **2.4**; pull over **2.6** charts
4. Build **2.5** once Marci's list lands
5. **8/10** Vizient review → build **Phase 3** after feed delivers
