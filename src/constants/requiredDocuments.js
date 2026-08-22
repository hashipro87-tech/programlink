// requiredDocuments.js — the ONE canonical list of required compliance
// documents per org type. This MUST match REQUIRED in
// programlink-backend/routes/compliance.js exactly — that backend constant is
// the authority the sponsor's Compliance page and the Claims engine both use
// to decide whether an org is "ready."
//
// Before this file existed there were FOUR independent copies of this list:
//   1. backend routes/compliance.js       REQUIRED.kitchen / REQUIRED.site
//   2. DocumentsPage.jsx                  REQUIRED_DOCS.kitchen / .site
//   3. KitchenDashboard.jsx               KITCHEN_REQUIRED_DOCS
//   4. application/steps/StepDocuments.jsx DOC_REQUIREMENTS.kitchen / .site
// #1-#3 agreed with each other (w9/food_permit/insurance/menu_plan/health_cert
// for kitchen; enrollment/license/insurance/health_cert for site). #4 used
// entirely different, invented doc_type strings — health_permit,
// food_handler_cert, kitchen_inspection, business_license, state_license,
// enrollment_records, director_info, fire_inspection — that never matched a
// real uploaded document anywhere. Since getDoc() looks documents up by exact
// doc_type match, the application's Documents step could never recognize a
// kitchen's real, already-approved compliance documents: a kitchen with 5/5
// docs approved on /documents still saw "0 of 3 required documents uploaded"
// on their own application and could not submit.
//
// If you need to change what's required for a role, change it here AND in
// the backend REQUIRED constant. Nothing else should define its own copy.
export const REQUIRED_DOCUMENTS = {
  kitchen: [
    { doc_type: 'w9',          label: 'W-9 Form',            hint: 'IRS W-9 for tax reporting' },
    { doc_type: 'food_permit', label: 'Food Service Permit', hint: 'Valid food handler / sanitation permit' },
    { doc_type: 'insurance',   label: 'Liability Insurance', hint: 'General liability certificate of insurance' },
    { doc_type: 'menu_plan',   label: 'Menu Plan',           hint: 'Approved CACFP menu cycle' },
    { doc_type: 'health_cert', label: 'Health Certificate',  hint: 'Health department inspection certificate' },
  ],
  site: [
    { doc_type: 'enrollment',  label: 'Enrollment Records',  hint: 'Current participant enrollment documentation' },
    { doc_type: 'license',     label: 'Child Care License',  hint: 'State-issued child care license' },
    { doc_type: 'insurance',   label: 'Liability Insurance', hint: 'General liability certificate of insurance' },
    { doc_type: 'health_cert', label: 'Health Certificate',  hint: 'Health department certificate' },
  ],
  // NOTE: no 'delivery' entry — nothing in compliance.js, the Compliance page,
  // or Claims tracks required documents for delivery orgs today. Delivery's
  // document list in StepDocuments.jsx is therefore left as its own local
  // list; it gates that applicant's submission but isn't cross-checked by
  // anything else in the product yet. If delivery compliance tracking gets
  // built, fold it in here too.
};

// Statuses that mean "a real file is on record and it counts toward the
// requirement" — i.e. not a placeholder ('requested') and not bounced back
// ('rejected'). Matches the set DocumentsPage.jsx's own isApproved() +
// KitchenDashboard.jsx's countUploadedDocs() treat as fulfilled.
export const DOC_FULFILLED_STATUSES = ['valid', 'approved', 'expiring_soon', 'pending_review', 'expired'];

export function isDocFulfilled(doc) {
  return !!doc && DOC_FULFILLED_STATUSES.includes(doc.status);
}
