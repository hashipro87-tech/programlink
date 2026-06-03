// StepOrgDetails.jsx — Step 2: Role-specific operational details
// The fields shown depend on the user's role (kitchen / site / delivery).
// This keeps one component clean rather than three near-identical files.

export default function StepOrgDetails({ role, formData, onChange, errors }) {
  const field = (name, type = 'text') => ({
    type,
    value:    formData[name] || '',
    onChange: (e) => onChange(name, e.target.value),
    className: `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2
                focus:ring-brand-500 focus:border-transparent
                ${errors?.[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`,
  });

  const select = (name) => ({
    value:    formData[name] || '',
    onChange: (e) => onChange(name, e.target.value),
    className: `w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none
                focus:ring-2 focus:ring-brand-500 focus:border-transparent
                ${errors?.[name] ? 'border-red-400' : 'border-gray-300'}`,
  });

  return (
    <div className="space-y-6">
      {/* ── KITCHEN ─────────────────────────────────────────────────────── */}
      {role === 'kitchen' && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Kitchen Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tell us about your kitchen's capacity and the types of meals you can produce.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meals per day capacity <span className="text-red-500">*</span>
              </label>
              <input {...field('mealCapacity', 'number')} placeholder="e.g. 500" min="1" />
              {errors?.mealCapacity && <p className="text-xs text-red-500 mt-1">{errors.mealCapacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kitchen type <span className="text-red-500">*</span>
              </label>
              <select {...select('kitchenType')}>
                <option value="">Select type…</option>
                <option value="commercial">Commercial kitchen</option>
                <option value="school">School cafeteria</option>
                <option value="faith">Faith-based facility</option>
                <option value="nonprofit">Nonprofit facility</option>
                <option value="other">Other</option>
              </select>
              {errors?.kitchenType && <p className="text-xs text-red-500 mt-1">{errors.kitchenType}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meal types you can provide <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Halal', 'Vegetarian'].map((type) => {
                const key = `mealType_${type.toLowerCase()}`;
                return (
                  <label key={type} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[key] || false}
                      onChange={(e) => onChange(key, e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operating hours
            </label>
            <input {...field('operatingHours')} placeholder="e.g. Mon–Fri, 6am–3pm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional notes
            </label>
            <textarea
              value={formData.kitchenNotes || ''}
              onChange={(e) => onChange('kitchenNotes', e.target.value)}
              rows={3}
              placeholder="Anything else your coordinator should know about your kitchen…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </>
      )}

      {/* ── SITE / DAYCARE ───────────────────────────────────────────────── */}
      {role === 'site' && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Site Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tell us about the children and families your site serves.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site type <span className="text-red-500">*</span>
              </label>
              <select {...select('siteType')}>
                <option value="">Select type…</option>
                <option value="daycare">Licensed daycare</option>
                <option value="headstart">Head Start program</option>
                <option value="afterschool">After-school program</option>
                <option value="summer">Summer program</option>
                <option value="community">Community center</option>
                <option value="other">Other</option>
              </select>
              {errors?.siteType && <p className="text-xs text-red-500 mt-1">{errors.siteType}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average daily enrollment <span className="text-red-500">*</span>
              </label>
              <input {...field('enrollment', 'number')} placeholder="e.g. 75" min="1" />
              {errors?.enrollment && <p className="text-xs text-red-500 mt-1">{errors.enrollment}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age range served
              </label>
              <input {...field('ageRange')} placeholder="e.g. 6 weeks – 12 years" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program hours
              </label>
              <input {...field('programHours')} placeholder="e.g. Mon–Fri, 7am–6pm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meals needed per day <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {['Breakfast', 'Lunch', 'Dinner', 'AM Snack', 'PM Snack'].map((meal) => {
                const key = `needsMeal_${meal.replace(/\s/g, '_').toLowerCase()}`;
                return (
                  <label key={meal} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[key] || false}
                      onChange={(e) => onChange(key, e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {meal}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State license number
            </label>
            <input {...field('licenseNumber')} placeholder="Your state-issued license or registration number" />
          </div>
        </>
      )}

      {/* ── DELIVERY PROVIDER ────────────────────────────────────────────── */}
      {role === 'delivery' && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Provider Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tell us about your delivery capacity and service area.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of vehicles <span className="text-red-500">*</span>
              </label>
              <input {...field('vehicleCount', 'number')} placeholder="e.g. 3" min="1" />
              {errors?.vehicleCount && <p className="text-xs text-red-500 mt-1">{errors.vehicleCount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle type <span className="text-red-500">*</span>
              </label>
              <select {...select('vehicleType')}>
                <option value="">Select type…</option>
                <option value="van">Cargo van</option>
                <option value="truck">Box truck</option>
                <option value="refrigerated">Refrigerated truck</option>
                <option value="car">Standard vehicle</option>
                <option value="mixed">Mixed fleet</option>
              </select>
              {errors?.vehicleType && <p className="text-xs text-red-500 mt-1">{errors.vehicleType}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max stops per route
              </label>
              <input {...field('maxStops', 'number')} placeholder="e.g. 10" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service area (counties / ZIP codes)
              </label>
              <input {...field('serviceArea')} placeholder="e.g. Cook County, 60601–60699" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery availability
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const key = `available_${day.toLowerCase()}`;
                return (
                  <label key={day} className="flex flex-col items-center gap-1 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[key] || false}
                      onChange={(e) => onChange(key, e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {day}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DOT / carrier number (if applicable)
            </label>
            <input {...field('dotNumber')} placeholder="USDOT or MC number" />
          </div>
        </>
      )}
    </div>
  );
}
