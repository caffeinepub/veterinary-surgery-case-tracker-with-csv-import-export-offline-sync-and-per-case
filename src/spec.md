# Specification

## Summary
**Goal:** Make Quick Add demographics paste reliably auto-fill the CaseForm “Pet Name” field when the pasted text includes a pet/patient name.

**Planned changes:**
- Investigate and fix the root cause preventing pet name extraction and/or application during Quick Add paste (within `extractDemographics` and/or `CaseForm.handlePasteExtraction`).
- Ensure Pet Name is only auto-filled on paste when the field is currently empty and untouched, and never overwritten if it has been touched or is non-empty.
- Verify other Quick Add demographic extractions (MRN/owner/species/breed/sex/DOB/arrival date/presenting complaint) continue to behave as before, and that existing English toasts/messages remain unchanged.

**User-visible outcome:** When creating a new case, pasting demographics into Quick Add will correctly populate Pet Name (only if the field is empty and untouched) without disrupting other auto-fill behavior.
