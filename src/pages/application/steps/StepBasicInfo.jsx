// StepBasicInfo.jsx — Step 1: Organization contact information
//
// Additions:
//  • Organization Type dropdown (CACFP-relevant types)
//  • Google Places address autocomplete — auto-fills city, state, ZIP
//    Requires VITE_GOOGLE_MAPS_API_KEY env var in Vercel.
//    Falls back to plain text inputs if the key is not set.

import { useEffect, useRef, useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react';

// ─── Google Places loader ─────────────────────────────────────────────────────
// Set VITE_GOOGLE_MAPS_API_KEY in your Vercel environment variables.
// In Google Cloud Console: enable "Places API" and restrict the key to your domain.
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__googleMapsPromise)  return window.__googleMapsPromise;
  window.__googleMapsPromise = new Promise((resolve) => {
    window.__googleMapsInit = () => { resolve(); delete window.__googleMapsInit; };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsInit`;
    s.async = true;
    document.head.appendChild(s);
  });
  return window.__googleMapsPromise;
}

// ─── Org types ────────────────────────────────────────────────────────────────
const ORG_TYPES = [
  { value: 'child_care_center', label: 'Child Care Center' },
  { value: 'family_day_care',   label: 'Family Day Care Home' },
  { value: 'head_start',        label: 'Head Start / Early Head Start' },
  { value: 'afterschool',       label: 'After-School Program' },
  { value: 'summer_food',       label: 'Summer Food Service' },
  { value: 'adult_day_care',    label: 'Adult Day Care' },
  { value: 'emergency_shelter', label: 'Emergency Shelter' },
  { value: 'other',             label: 'Other' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function StepBasicInfo({ formData, onChange, errors, role }) {
  // ORG_TYPES is a list of CHILD-CARE program types (Child Care Center, Family
  // Day Care Home, Head Start, Adult Day Care, ...). It only describes what a
  // *site* is. A kitchen or delivery applicant has no honest answer here —
  // this used to be required for every role, so a kitchen applying had to pick
  // "Other" from a list of options that don't apply to them, then reach Step 2
  // and answer the correct question ("Kitchen type": Commercial / School
  // cafeteria / Faith-based / Nonprofit) anyway. Now shown only for sites.
  const showOrgType = !role || role === 'site';
  const addressRef     = useRef(null);
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps?.places);
  const autocompleteRef = useRef(null);

  // Load Google Maps if API key is configured
  useEffect(() => {
    if (!MAPS_KEY || mapsReady) return;
    loadGoogleMaps(MAPS_KEY).then(() => setMapsReady(true));
  }, [MAPS_KEY, mapsReady]);

  // Attach Places Autocomplete to the address input once Maps is ready
  useEffect(() => {
    if (!mapsReady || !addressRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(addressRef.current, {
      types:                  ['address'],
      componentRestrictions:  { country: 'us' },
      fields:                 ['address_components'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place?.address_components) return;

      let streetNumber = '', route = '', city = '', state = '', zip = '';
      for (const comp of place.address_components) {
        if (comp.types.includes('street_number'))             streetNumber = comp.long_name;
        if (comp.types.includes('route'))                     route        = comp.short_name;
        if (comp.types.includes('locality'))                  city         = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) state      = comp.short_name;
        if (comp.types.includes('postal_code'))               zip          = comp.long_name;
      }

      onChange('address', `${streetNumber} ${route}`.trim());
      onChange('city',    city);
      onChange('state',   state);
      onChange('zip',     zip);
    });

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mapsReady, onChange]);

  // Helper to build common input props
  const field = (name, extra = {}) => ({
    value:    formData[name] || '',
    onChange: (e) => onChange(name, e.target.value),
    className: `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2
                focus:ring-brand-500 focus:border-transparent transition-colors
                ${errors?.[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`,
    ...extra,
  });

  const selectCls = (name) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none
     focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors
     ${errors?.[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

  const err = (name) =>
    errors?.[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your organization. This will be reviewed by your program coordinator.
        </p>
      </div>

      {/* Organization name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization name <span className="text-red-500">*</span>
        </label>
        <input type="text" placeholder="e.g. Sunshine Community Center" {...field('orgName')} />
        {err('orgName')}
      </div>

      {/* Organization type — site applicants only, see showOrgType note above */}
      {showOrgType && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.orgType || ''}
            onChange={(e) => onChange('orgType', e.target.value)}
            className={selectCls('orgType')}
          >
            <option value="">Select your organization type…</option>
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {err('orgType')}
        </div>
      )}

      {/* Contact name + title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary contact name <span className="text-red-500">*</span>
          </label>
          <input type="text" placeholder="First and last name" {...field('contactName')} />
          {err('contactName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact title / role
          </label>
          <input type="text" placeholder="e.g. Program Director" {...field('contactTitle')} />
        </div>
      </div>

      {/* Phone + email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number <span className="text-red-500">*</span>
          </label>
          <input type="tel" placeholder="(555) 000-0000" {...field('phone')} />
          {err('phone')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address <span className="text-red-500">*</span>
          </label>
          <input type="email" placeholder="contact@organization.org" {...field('email')} />
          {err('email')}
        </div>
      </div>

      {/* Address — with Google Places autocomplete if key is set */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Street address <span className="text-red-500">*</span>
          </label>
          {mapsReady && (
            <span className="flex items-center gap-1 text-[11px] text-brand-600 font-medium">
              <Sparkles className="w-3 h-3" /> Autocomplete on
            </span>
          )}
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={addressRef}
            type="text"
            placeholder={mapsReady ? 'Start typing your address…' : '123 Main St'}
            value={formData.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none
                        focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors
                        ${errors?.address ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            autoComplete="off"
          />
        </div>
        {err('address')}
        {mapsReady && (
          <p className="text-xs text-gray-400 mt-1">
            City, state, and ZIP will fill automatically when you select an address.
          </p>
        )}
      </div>

      {/* City / State / ZIP — auto-filled by Places, editable manually */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input type="text" placeholder="Springfield" {...field('city')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" placeholder="IL" maxLength={2} {...field('state')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP code</label>
          <input type="text" placeholder="62701" {...field('zip')} />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Fields marked <span className="text-red-500">*</span> are required to continue.
      </p>
    </div>
  );
}
