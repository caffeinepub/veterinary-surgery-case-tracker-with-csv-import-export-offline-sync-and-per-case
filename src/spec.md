# Specification

## Summary
**Goal:** Expand per-case to-do tasks so each case can select required tasks at entry, track completion on the case card, and persist/sync/import/export reliably.

**Planned changes:**
- Update the surgery case data model to include exactly these 7 task options: Discharge Notes, pDVM Notified, Labs, Histo, Surgery Report, Imaging, Culture; store per-task required and completed flags per case with correct backend persistence and frontend round-trip.
- Add a conditional migration to upgrade existing saved cases from the legacy two-task structure to the new seven-task structure without data loss or crashes.
- Update the Case Form UI to show checkboxes for selecting which tasks are required for the case (Discharge Notes and pDVM Notified checked by default; others unchecked), and persist/load these selections on create/edit.
- Update each Case Card to render only required tasks for that case and allow toggling completion; ensure completion state persists across reload and after sync.
- Update CSV import/export to include all 7 task columns, remain backward compatible with older two-task CSVs, and show English warnings for unrecognized task columns during import preview.

**User-visible outcome:** Users can choose which to-do items apply to a case when creating/editing it, see only those required items on the case card, toggle them complete, and have those choices persist across sync and CSV import/export.
