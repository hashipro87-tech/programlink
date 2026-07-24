// formDataService.js — Pre-fill engine: pulls structured org data for any form template.
// Adding a new form = add one FORM_TEMPLATES entry. No new query logic needed.
'use strict';

const db = require('../config/database');

// ── Field source definitions ─────────────────────────────────────────────────
// Each key maps to: how to extract that value from the raw org data object.
// Raw org data shape is defined by loadOrgData() below.
const FIELD_SOURCES = {
  // Org fields
  org_name:          d => d.org.name,
  org_type:          d => d.org.type === 'kitchen' ? 'Child Nutrition Kitchen' : 'Child Care Site',
  org_address:       d => d.org.address || '',
  org_city:          d => d.org.city || '',
  org_state:         d => d.org.state || '',
  org_zip:           d => d.org.zip || '',
  org_full_address:  d => [d.org.address, d.org.city, d.org.state, d.org.zip].filter(Boolean).join(', '),
  org_phone:         d => d.org.phone || '',
  org_email:         d => d.org.email || '',
  org_license_num:   d => d.org.license_number || '',
  org_capacity:      d => d.org.capacity != null ? String(d.org.capacity) : '',

  // Sponsor fields
  sponsor_name:      d => d.sponsor.name || '',
  sponsor_address:   d => d.sponsor.address || '',
  sponsor_city:      d => d.sponsor.city || '',
  sponsor_state:     d => d.sponsor.state || '',
  sponsor_zip:       d => d.sponsor.zip || '',
  sponsor_phone:     d => d.sponsor.phone || '',
  sponsor_email:     d => d.sponsor.email || '',
  sponsor_number:    d => d.sponsor.id?.slice(0,8).toUpperCase() || '',

  // Contact / primary user
  contact_name:      d => d.contact ? `${d.contact.first_name || ''} ${d.contact.last_name || ''}`.trim() : '',
  contact_phone:     d => d.contact?.phone || '',
  contact_email:     d => d.contact?.email || '',

  // Meta
  program_year:      () => String(new Date().getFullYear()),
  current_date:      () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  current_month_year:() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
};

// ── Form templates ────────────────────────────────────────────────────────────
// Adding a new form = add one object here. NO other code changes needed.
const FORM_TEMPLATES = {
  site_information_sheet: {
    label:       'Site Information Sheet',
    description: 'Basic site profile for CACFP enrollment and sponsor records.',
    roles:       ['site', 'kitchen'],
    sections: [
      {
        title: 'Site / Kitchen Information',
        fields: [
          { key: 'org_name',        label: 'Organization Name',    source: 'org_name'        },
          { key: 'org_type',        label: 'Program Type',         source: 'org_type'        },
          { key: 'org_address',     label: 'Street Address',       source: 'org_address'     },
          { key: 'org_city',        label: 'City',                 source: 'org_city'        },
          { key: 'org_state',       label: 'State',                source: 'org_state'       },
          { key: 'org_zip',         label: 'ZIP Code',             source: 'org_zip'         },
          { key: 'org_phone',       label: 'Phone',                source: 'org_phone'       },
          { key: 'org_email',       label: 'Email',                source: 'org_email'       },
          { key: 'org_capacity',    label: 'Licensed Capacity',    source: 'org_capacity'    },
          { key: 'org_license_num', label: 'License Number',       source: 'org_license_num' },
        ],
      },
      {
        title: 'Primary Contact',
        fields: [
          { key: 'contact_name',  label: 'Contact Name',  source: 'contact_name'  },
          { key: 'contact_phone', label: 'Contact Phone', source: 'contact_phone' },
          { key: 'contact_email', label: 'Contact Email', source: 'contact_email' },
        ],
      },
      {
        title: 'Sponsoring Organization',
        fields: [
          { key: 'sponsor_name',    label: 'Sponsor Name',    source: 'sponsor_name'    },
          { key: 'sponsor_address', label: 'Sponsor Address', source: 'sponsor_address' },
          { key: 'sponsor_phone',   label: 'Sponsor Phone',   source: 'sponsor_phone'   },
          { key: 'sponsor_email',   label: 'Sponsor Email',   source: 'sponsor_email'   },
          { key: 'sponsor_number',  label: 'Sponsor Number',  source: 'sponsor_number'  },
        ],
      },
    ],
    signature_line: true,
    signature_label: 'Authorized Site Representative',
  },

  sponsor_agreement: {
    label:       'Sponsor Agreement',
    description: 'Annual agreement between sponsor and participating site/kitchen.',
    roles:       ['sponsor'],
    sections: [
      {
        title: 'Sponsoring Organization',
        fields: [
          { key: 'sponsor_name',    label: 'Sponsor Organization Name', source: 'sponsor_name'    },
          { key: 'sponsor_address', label: 'Address',                   source: 'sponsor_address' },
          { key: 'sponsor_city',    label: 'City',                      source: 'sponsor_city'    },
          { key: 'sponsor_state',   label: 'State',                     source: 'sponsor_state'   },
          { key: 'sponsor_zip',     label: 'ZIP Code',                  source: 'sponsor_zip'     },
          { key: 'sponsor_phone',   label: 'Phone',                     source: 'sponsor_phone'   },
          { key: 'sponsor_email',   label: 'Email',                     source: 'sponsor_email'   },
          { key: 'sponsor_number',  label: 'Sponsor Number',            source: 'sponsor_number'  },
        ],
      },
      {
        title: 'Participating Organization',
        fields: [
          { key: 'org_name',         label: 'Site / Kitchen Name', source: 'org_name'        },
          { key: 'org_type',         label: 'Program Type',        source: 'org_type'        },
          { key: 'org_full_address', label: 'Address',             source: 'org_full_address' },
          { key: 'org_phone',        label: 'Phone',               source: 'org_phone'       },
          { key: 'org_email',        label: 'Email',               source: 'org_email'       },
          { key: 'contact_name',     label: 'Contact Person',      source: 'contact_name'    },
        ],
      },
      {
        title: 'Agreement Details',
        fields: [
          { key: 'program_year',  label: 'Program Year',  source: 'program_year'  },
          { key: 'current_date',  label: 'Effective Date', source: 'current_date' },
        ],
      },
    ],
    signature_line: true,
    signature_label: 'Site/Kitchen Authorized Representative',
    signature_line_2: true,
    signature_label_2: 'Sponsor Authorized Representative',
  },

  annual_renewal: {
    label:       'Annual Renewal Confirmation',
    description: 'Confirms participation intent and current site information for program year renewal.',
    roles:       ['site', 'kitchen', 'sponsor'],
    sections: [
      {
        title: 'Site / Kitchen Information',
        fields: [
          { key: 'org_name',         label: 'Organization Name', source: 'org_name'         },
          { key: 'org_type',         label: 'Program Type',      source: 'org_type'         },
          { key: 'org_full_address', label: 'Address',           source: 'org_full_address' },
          { key: 'org_phone',        label: 'Phone',             source: 'org_phone'        },
          { key: 'org_email',        label: 'Email',             source: 'org_email'        },
          { key: 'org_capacity',     label: 'Licensed Capacity', source: 'org_capacity'     },
          { key: 'org_license_num',  label: 'License Number',    source: 'org_license_num'  },
        ],
      },
      {
        title: 'Contact Information',
        fields: [
          { key: 'contact_name',  label: 'Primary Contact',  source: 'contact_name'  },
          { key: 'contact_phone', label: 'Contact Phone',    source: 'contact_phone' },
          { key: 'contact_email', label: 'Contact Email',    source: 'contact_email' },
        ],
      },
      {
        title: 'Renewal Period',
        fields: [
          { key: 'program_year',       label: 'Renewal Year',  source: 'program_year'        },
          { key: 'current_month_year', label: 'Submitted',     source: 'current_month_year'  },
          { key: 'sponsor_name',       label: 'Sponsor',       source: 'sponsor_name'        },
        ],
      },
    ],
    signature_line: true,
    signature_label: 'Authorized Representative',
    checklist: [
      'No changes to licensed capacity or age groups',
      'Contact information above is current and correct',
      'Site continues to meet all CACFP eligibility requirements',
      'Staff responsible for meal counts have completed required training',
    ],
  },

  income_eligibility_form: {
    label:       'Income Eligibility Statement',
    description: 'Family income eligibility form with site and sponsor information pre-filled.',
    roles:       ['site', 'sponsor'],
    sections: [
      {
        title: 'Site Information',
        fields: [
          { key: 'org_name',         label: 'Site Name',     source: 'org_name'         },
          { key: 'org_full_address', label: 'Site Address',  source: 'org_full_address' },
          { key: 'org_phone',        label: 'Site Phone',    source: 'org_phone'        },
          { key: 'sponsor_name',     label: 'Sponsor Name',  source: 'sponsor_name'     },
          { key: 'sponsor_number',   label: 'Sponsor Number',source: 'sponsor_number'   },
          { key: 'program_year',     label: 'Program Year',  source: 'program_year'     },
        ],
      },
    ],
    note: 'Family/guardian information and income data must be completed by the household.',
    signature_line: false,
  },
};

// ── Data loader ───────────────────────────────────────────────────────────────
async function loadOrgData(orgId, sponsorId) {
  // Load the target org
  const orgRes = await db.query(
    `SELECT id, name, type, address, city, state, zip, phone, email,
            license_number, capacity, sponsor_id
     FROM organizations WHERE id = $1`,
    [orgId]
  );
  const org = orgRes.rows[0];
  if (!org) throw new Error('Organization not found');

  // Load the sponsor org
  const effectiveSponsorId = sponsorId || org.sponsor_id;
  let sponsor = { name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', id: '' };
  if (effectiveSponsorId) {
    const sRes = await db.query(
      `SELECT id, name, address, city, state, zip, phone, email
       FROM organizations WHERE id = $1`,
      [effectiveSponsorId]
    );
    if (sRes.rows[0]) sponsor = sRes.rows[0];
  }

  // Load primary contact (first active user for this org)
  const contactRes = await db.query(
    `SELECT first_name, last_name, email, phone
     FROM users
     WHERE organization_id = $1 AND is_active = true
     ORDER BY created_at ASC LIMIT 1`,
    [orgId]
  );
  const contact = contactRes.rows[0] || null;

  return { org, sponsor, contact };
}

// ── Public API ─────────────────────────────────────────────────────────────────
// Returns resolved field values for a given org + template.
async function generateFormData(orgId, templateId, sponsorId) {
  const template = FORM_TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  const rawData = await loadOrgData(orgId, sponsorId);

  // Resolve every field in every section
  const resolvedSections = template.sections.map(section => ({
    title: section.title,
    fields: section.fields.map(field => ({
      key:   field.key,
      label: field.label,
      value: FIELD_SOURCES[field.source] ? FIELD_SOURCES[field.source](rawData) : '',
    })),
  }));

  return {
    templateId,
    label:        template.label,
    description:  template.description,
    sections:     resolvedSections,
    signature_line:   template.signature_line   ?? false,
    signature_label:  template.signature_label  ?? 'Authorized Representative',
    signature_line_2: template.signature_line_2 ?? false,
    signature_label_2:template.signature_label_2 ?? '',
    checklist:    template.checklist   ?? null,
    note:         template.note        ?? null,
    generated_at: new Date().toISOString(),
    org: {
      id:   rawData.org.id,
      name: rawData.org.name,
      type: rawData.org.type,
    },
  };
}

module.exports = {
  FORM_TEMPLATES,
  generateFormData,
};
