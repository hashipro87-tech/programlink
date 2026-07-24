// exportEngine.js — Routes claim data to the right export adapter based on format.
// Adding a new format/state = add one adapter file + one line here.
'use strict';

const ADAPTERS = {
  pdf:            require('./exportAdapters/pdf'),
  excel:          require('./exportAdapters/excel'),
  xlsx:           require('./exportAdapters/excel'),   // alias
  csv:            require('./exportAdapters/csv'),
  tx_squaremeals: require('./exportAdapters/tx_squaremeals'),
};

/**
 * run(format, claimData, res)
 * format: 'pdf' | 'excel' | 'csv' | 'tx_squaremeals' | ...
 * claimData: { claim, stateConfig, orgName, month, mealsBySite }
 * res: Express response object
 */
async function run(format, claimData, res) {
  const key     = (format || 'pdf').toLowerCase();
  const adapter = ADAPTERS[key];

  if (!adapter) {
    return res.status(400).json({
      error: `Unknown export format: "${format}". Supported: ${Object.keys(ADAPTERS).join(', ')}.`,
    });
  }

  return adapter.render(claimData, res);
}

module.exports = { run, SUPPORTED_FORMATS: Object.keys(ADAPTERS) };
