# Risk API App — Outcomes Sheet & Daily Ops Build Plan

**Status:** Draft for review
**Owners:** Yogi (Qlik build), Matt (Vizient data feed), Marci (high-weight variable list)
**Key milestone:** Vizient data-feed review with Matt — **Monday 8/10/26**
**Last updated:** 2026-08-07

> **Scope note:** All work below is built in the **Risk API Qlik Sense application** (sheets,
> master items, expressions, load script). This repository (`server-side-extension`) is the
> open-source Qlik SSE library and does not contain the app itself, so this document is the
> implementation spec the team builds from — not code committed here.

---

## 1. How the work breaks down

The to-do items fall into three groups by readiness:

| Phase | Theme | Data ready? | Blocker |
|-------|-------|-------------|---------|
| **Phase 1** | Daily Ops "slightly above" + REL counter updates | ✅ In app today | Confirm field/band names |
| **Phase 2** | New **Outcomes** sheet — 6 priority builds | ✅ In app today | Marci's list (1 item), identify 2 charts to move |
| **Phase 3** | Vizient metrics — CMI & Mortality O/E | ❌ Needs new feed | Vizient feed — review 8/10 w/ Matt |

**Recommended order:** Phase 1 → Phase 2 (build the 5 data-in-app tables, then move the 2 charts) → Phase 3 after the Vizient feed is scoped and delivered. Phases 1 and 2 are independent and can proceed in parallel if two people are building.

---

## 2. Phase 1 — Daily Operations: add "slightly above" + update REL counters

**Request:** Display rows valued **"slightly above"** alongside the current values on the Daily
Operations page, and update the KPI scores in the **REL counters** on **both** the Daily Ops and
Encounters sheets to reflect the added band.

### Steps
1. **Identify the band field & value.** Locate the field that classifies each HAR/encounter by how
   its actual compares to expected (the field currently driving the Daily Ops table — e.g. a
   `Risk Band` / `REL Band` / `Relative Expected` category). Confirm the exact stored string for
   the "slightly above" value (spelling/casing matter for set analysis).
2. **Update the Daily Ops table object(s).** Wherever the current values are filtered in (via set
   analysis or the sheet/object selection), add the "slightly above" band. Example set-analysis
   change:
   `{<[REL Band] = {'Above'}>}` → `{<[REL Band] = {'Above', 'Slightly Above'}>}`.
3. **Update REL counters on Daily Ops.** Apply the same band expansion to the counter/KPI measures
   so the score reflects the additional rows.
4. **Update REL counters on the Encounters sheet.** Same expansion — these counters must stay
   consistent with Daily Ops so the numbers reconcile across sheets.
5. **Reconcile.** Verify the counter totals equal the row counts now shown in the Daily Ops table
   for the same selection state.

### To confirm before building
- Exact **field name** and the exact **"slightly above" value string**.
- Which **counter objects** on each sheet are "REL counters" (list them so none are missed).
- Whether "current values" implies a **today/date filter** that must also apply to the added rows.

---

## 3. Phase 2 — New "Outcomes" sheet

**Create a new sheet titled `Outcomes`.** Filters that influence its tables = **all filters
already in the application today** (Outcomes objects respond to the global selection state; no new
data feed needed). Add a filter pane with the key dimensions so users can slice locally:
**Hospital, CDI Status, REL Band, Month, MSDRG / MSDRG Group** (whichever exist today).

Build the six priority items below. Each notes the chart type, dimension(s), measure(s), and the
**data-model granularity it depends on** — validate that grain against the live model before building.

### 2.1 — Relative Expected Value: HAR count by hospital
- **Object:** Pivot table (or straight table). Distribution of HAR counts across REL values, per hospital.
- **Rows:** Hospital. **Columns:** REL Band/value. **Measure:** `Count(DISTINCT [HAR ID])`.
- **Needs:** HAR-level grain with hospital + REL value. ✅ expected in app today.

### 2.2 — HARs improved in terms of REL
- **Object:** Table (by hospital, and/or a single total KPI).
- **Measure:** count of HARs whose REL **improved across API runs** (latest run REL better than the
  first run). Two implementation options:
  - **Script flag (preferred):** compute an `REL Improved` flag per HAR in the load script by
    comparing first-run vs latest-run REL; then `Count(DISTINCT {<[REL Improved]={1}>} [HAR ID])`.
  - **Chart-side:** `FirstSortedValue`/`Aggr` over run number — heavier, only if run-level REL is
    already in the model.
- **Needs:** **per-run REL history per HAR** (multiple API runs retained). ⚠️ Confirm the model
  keeps run-level REL; if only the final value is stored, "improved" cannot be computed without a
  script change.
- **To confirm:** definition of "improved" (any decrease? crossing a band boundary? threshold?).

### 2.3 — Final HAR count per CDI status + # of API runs
- **Object:** Pivot/straight table.
- **Dimension:** CDI Status (e.g. *Complete with opportunity*, *Complete no opportunity*, …).
- **Measures:** `Count(DISTINCT [final HAR ID])` and `# of API runs` (`Count([API Run ID])` or
  `Sum([Run Count])`, per the model).
- **Needs:** "final" HAR state per HAR + CDI status + run count. Confirm how **"final"** is
  flagged (latest run flag vs. a status).

### 2.4 — Most frequent final variables triggered over time
- **Object:** Trend + rank. Suggested: a **bar chart** of top-N variables by trigger frequency,
  plus a **line chart** of trigger counts by **Month** (top variables as series), or a pivot
  Variable × Month.
- **Dimension:** Variable (final-run triggers); time = Month. **Measure:** count of triggers.
- **Needs:** **variable-level grain** — a table listing triggered variables per HAR/final run,
  joinable to a date. ⚠️ Confirm this granularity exists; if variables are stored as a concatenated
  string, a script transform (subfield/expand) is required first.

### 2.5 — Most frequent **highest-weighted** variables
- **Object:** Bar chart / table ranked by frequency, filtered to the high-weight variable set.
- **Dependency:** **Marci's list of high-weighted variables.** Load it as a reference (inline
  `LOAD ... INLINE` table or mapping) tagging each variable `High Weight = 1`, or add a weight
  field, then rank frequency within that set.
- **Needs:** 2.4's variable grain **+** Marci's list. ⚠️ Blocked on Marci sharing the list.

### 2.6 — Move the 2 existing charts from Encounters → Outcomes
- **Action:** Identify the two chart objects currently on the Encounters sheet, then relocate them
  to Outcomes. Qlik has no drag-across-sheets, so either **convert each to a master visualization**
  and place it on Outcomes, or **rebuild** them there.
- **To confirm:** *which* two charts, and whether they should be **removed from** Encounters or
  **duplicated** (kept on both).

---

## 4. Phase 3 — Vizient metrics (new data feed — review 8/10 with Matt)

These require a **new data feed from Vizient** and are **blocked** until that feed is scoped and
delivered. Use the Monday 8/10/26 review with Matt to lock the data spec.

### 4.1 — CMI per hospital over time
- **Object:** Monthly **line chart**, one line per hospital, filterable by **MSDRG** and **MSDRG
  groups**.
- **Measure:** CMI (case-mix index). **Dimensions:** Month (X), Hospital (series).

### 4.2 — Mortality O/E (same source as CMI)
- **Object:** Line chart per hospital over time; **display Observed # over Expected #** (show O, E,
  and the O/E ratio).
- **Measures:** `Sum(Observed) / Sum(Expected)` for the ratio, plus O and E counts.

### Data spec to confirm with Vizient (bring to 8/10 review)
- **Grain:** encounter- or MSDRG-level, by hospital, by month.
- **Fields:** hospital, month/period, MSDRG, MSDRG group, CMI, observed mortality #, expected
  mortality #.
- **History depth:** how many months of back-data for the trend lines.
- **Delivery:** file drop / database / API? Cadence (monthly)? Refresh timing vs. app reload.
- **Keys:** how Vizient hospital/MSDRG identifiers map to the app's existing hospital & MSDRG keys.

---

## 5. Data-model readiness checklist

Validate these against the live model before starting each build; ⚠️ marks the risky ones.

- [ ] Band field + exact **"slightly above"** value string (Phase 1)
- [ ] HAR-level grain with Hospital + REL value (2.1)
- [ ] ⚠️ **Per-run REL history** per HAR (2.2)
- [ ] "Final" HAR flag + CDI status + API run count (2.3)
- [ ] ⚠️ **Variable-level grain** with a date (2.4)
- [ ] Marci's high-weight variable list loaded as reference (2.5)
- [ ] Identity of the two Encounters charts to move (2.6)
- [ ] Vizient feed fields/grain/keys/history (Phase 3)

---

## 6. Open questions / inputs needed

1. **Phase 1:** exact band field name + "slightly above" value; full list of REL counter objects on
   Daily Ops and Encounters; does a today/date filter apply?
2. **2.2:** precise definition of REL "improved"; is per-run REL retained in the model?
3. **2.3:** how is "final" HAR determined?
4. **2.4/2.5:** is variable-level data at the right grain, or stored as a concatenated string?
5. **2.5:** Marci to share the high-weight variable list.
6. **2.6:** which two charts, and remove-vs-duplicate?
7. **Phase 3:** Vizient data spec (section 4) — the 8/10 agenda.

---

## 7. Suggested sequence & milestones

1. **This week:** confirm Phase 1 field names → ship Phase 1 (Daily Ops "slightly above" + REL
   counters on both sheets). Reconcile counter totals.
2. **This week (parallel):** create the Outcomes sheet shell + filter pane; build 2.1 and 2.3
   (lowest data risk).
3. **Pending confirmations:** build 2.2 (needs run-level REL) and 2.4 (needs variable grain);
   pull 2.6 charts over once identified.
4. **On Marci's list:** build 2.5.
5. **Mon 8/10:** Vizient feed review with Matt → lock data spec (section 4).
6. **After feed lands:** build Phase 3 (CMI, Mortality O/E).
