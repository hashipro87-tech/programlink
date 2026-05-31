// StepBasicInfo.jsx — Step 1: Organization contact information
// Shared across kitchen, site, and delivery roles.
// Data is stored in the parent's formData state and persisted via localStorage auto-save.

export default function StepBasicInfo({ formData, onChange, errors }) {
  const field = (name) => ({
    value:    formData[name] || '',
    onChange: (e) => onChange(name, e.target.value),
    className: `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2
                focus:ring-brand-500 focus:border-transparent
                ${errors?.[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your organization. This information will be reviewed by your program coordinator.
        </p>
      </div>

      {/* Organization name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization name <span className="text-red-500">*</span>
        </label>
        <input type="text" placeholder="e.g. Sunshine Community Center" {...field('orgName')} />
        {errors?.orgName && <p className="text-xs text-red-500 mt-1">{errors.orgName}</p>}
      </div>

      {/* Contact name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary contact name <span className="text-red-500">*</span>
          </label>
          <input type="text" placeholder="First and last name" {...field('contactName')} />
          {errors?.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact title / role
          </label>
          <input type="text" placeholder="e.g. Program Director" {...field('contactTitle')} />
        </div>
      </div>

      {/* Contact details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number <span className="text-red-500">*</span>
          </label>
          <input type="tel" placeholder="(555) 000-0000" {...field('phone')} />
          {errors?.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address <span className="text-red-500">*</span>
          </label>
          <input type="email" placeholder="contact@organization.org" {...field('email')} />
          {errors?.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street address <span className="text-red-500">*</span>
        </label>
        <input type="text" placeholder="123 Main St" {...field('address')} />
        {errors?.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
      </div>

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
