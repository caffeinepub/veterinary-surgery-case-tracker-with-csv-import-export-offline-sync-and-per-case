# Specification

## Summary
**Goal:** Add persistent case notes to surgery cases and make notes and key tasks more visually prominent on the patient card.

**Planned changes:**
- Add a multi-line “Case Notes” field to the New Case / Edit Case form and persist it with the case data through create/edit/sync and reloads.
- Extend the backend case data model to store notes, including a safe migration to default existing cases’ notes to an empty string.
- Display case notes on the patient (case) card in a visually distinct colored boxed section, with consistent handling when notes are empty.
- Add visual task highlights on the patient card task list: purple outlined box for “Histo” and blue outlined box for “Imaging”.
- Re-run/repair the build and deploy flow so updated backend types and frontend bindings compile and the app redeploys successfully.

**User-visible outcome:** Users can enter and edit case notes that persist across sync and reloads, see notes clearly highlighted on the patient card, and quickly spot Histo and Imaging tasks via colored outlines in the task list.
