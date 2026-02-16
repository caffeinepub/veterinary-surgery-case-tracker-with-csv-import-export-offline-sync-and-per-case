# Specification

## Summary
**Goal:** Fix Quick Add Demographics so pasted demographics text reliably extracts patient info and auto-fills the CaseForm, with clear feedback when nothing is detected.

**Planned changes:**
- Update the Quick Add Demographics paste handling so extraction runs on the pasted text reliably (without relying on the paste event’s clipboardData after the event) while keeping the pasted text visible/editable in the textarea.
- Improve extraction rules to better match real-world demographics formats (mixed-case names with common characters like hyphens/apostrophes; MRN formats with prefixes/separators).
- Ensure auto-fill respects existing CaseForm touchedFields behavior and does not overwrite fields the user has already touched.
- Add non-blocking user feedback when no demographics are detected, and keep/maintain success feedback indicating how many fields were filled when extraction succeeds.

**User-visible outcome:** When users paste demographics into Quick Add Demographics, eligible CaseForm fields (MRN, Pet Name, Owner Last Name, Species, Breed, Sex, Date of Birth) auto-fill more consistently; if nothing can be extracted, the app shows a clear non-blocking message while leaving the pasted text in place for editing.
