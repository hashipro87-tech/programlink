// seed-complete-children.js
// Inserts 100 fully complete, audit-ready children for Hashi's sponsor account.
// Every field filled. form_status = approved. signature_obtained = true.
//
// Usage:
//   DATABASE_URL="postgresql://..." node tools/seed-complete-children.js
//
// To remove them later:
//   DELETE FROM children WHERE notes LIKE '%SEED_COMPLETE_2026%';

'use strict';
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SPONSOR_ORG_ID = '475ca0a8-01ef-481b-9b67-75bdb98aff7d';
const TAG = 'SEED_COMPLETE_2026';

function calcAgeGroup(birthdate) {
  const months = Math.floor((Date.now() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 6)  return 'infant_0_5';
  if (months < 12) return 'infant_6_11';
  if (months < 36) return 'toddler';
  if (months < 72) return 'preschool';
  return 'school_age';
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// 100 children — diverse names, all age groups covered
const CHILDREN_DATA = [
  // Infants 0-5 months (born Feb-Jul 2026)
  { first: 'Amara',    last: 'Johnson',    dob: '2026-04-12', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch',        parent: 'Diana Johnson',    phone: '(512) 555-0101', email: 'diana.johnson@email.com',    enroll: '2026-05-01', cert: '2026-05-01' },
  { first: 'Elijah',   last: 'Martinez',   dob: '2026-03-22', tier: 'tier2', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Rosa Martinez',    phone: '(512) 555-0102', email: 'rosa.martinez@email.com',    enroll: '2026-04-15', cert: '2026-04-15' },
  { first: 'Zoe',      last: 'Williams',   dob: '2026-05-05', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch',        parent: 'Marcus Williams',  phone: '(512) 555-0103', email: 'marcus.williams@email.com',  enroll: '2026-06-01', cert: '2026-06-01' },
  { first: 'Kai',      last: 'Thompson',   dob: '2026-02-14', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Linda Thompson',   phone: '(512) 555-0104', email: 'linda.thompson@email.com',   enroll: '2026-03-01', cert: '2026-03-01' },
  { first: 'Isla',     last: 'Garcia',     dob: '2026-06-01', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch',        parent: 'Carlos Garcia',    phone: '(512) 555-0105', email: 'carlos.garcia@email.com',    enroll: '2026-07-01', cert: '2026-07-01' },

  // Infants 6-11 months (born Aug 2025-Jan 2026)
  { first: 'Noah',     last: 'Anderson',   dob: '2025-10-08', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Patricia Anderson', phone: '(512) 555-0106', email: 'patricia.anderson@email.com', enroll: '2025-11-01', cert: '2025-11-01' },
  { first: 'Ava',      last: 'Robinson',   dob: '2025-09-15', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'James Robinson',   phone: '(512) 555-0107', email: 'james.robinson@email.com',   enroll: '2025-10-01', cert: '2025-10-01' },
  { first: 'Liam',     last: 'Clark',      dob: '2025-12-20', tier: 'tier2', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Susan Clark',      phone: '(512) 555-0108', email: 'susan.clark@email.com',      enroll: '2026-01-15', cert: '2026-01-15' },
  { first: 'Mia',      last: 'Lewis',      dob: '2026-01-05', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch',        parent: 'Robert Lewis',     phone: '(512) 555-0109', email: 'robert.lewis@email.com',     enroll: '2026-02-01', cert: '2026-02-01' },
  { first: 'Ethan',    last: 'Lee',        dob: '2025-08-30', tier: 'tier1', days: 'Monday,Tuesday,Wednesday',                 meals: 'breakfast,lunch,snack',  parent: 'Jennifer Lee',     phone: '(512) 555-0110', email: 'jennifer.lee@email.com',     enroll: '2025-10-01', cert: '2025-10-01' },

  // Toddlers 1-2 years (born Aug 2024-Jul 2025)
  { first: 'Olivia',   last: 'Harris',     dob: '2024-11-12', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Michael Harris',   phone: '(512) 555-0111', email: 'michael.harris@email.com',   enroll: '2025-01-06', cert: '2025-01-06' },
  { first: 'Jackson',  last: 'Walker',     dob: '2025-02-28', tier: 'tier2', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Karen Walker',     phone: '(512) 555-0112', email: 'karen.walker@email.com',     enroll: '2025-04-01', cert: '2025-04-01' },
  { first: 'Sofia',    last: 'Hall',       dob: '2024-09-03', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'David Hall',       phone: '(512) 555-0113', email: 'david.hall@email.com',       enroll: '2024-10-15', cert: '2024-10-15' },
  { first: 'Aiden',    last: 'Allen',      dob: '2025-05-17', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch',        parent: 'Mary Allen',       phone: '(512) 555-0114', email: 'mary.allen@email.com',       enroll: '2025-07-01', cert: '2025-07-01' },
  { first: 'Luna',     last: 'Young',      dob: '2024-12-25', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Joseph Young',     phone: '(512) 555-0115', email: 'joseph.young@email.com',     enroll: '2025-02-03', cert: '2025-02-03' },
  { first: 'Mateo',    last: 'Hernandez',  dob: '2025-01-19', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Ana Hernandez',    phone: '(512) 555-0116', email: 'ana.hernandez@email.com',    enroll: '2025-03-01', cert: '2025-03-01' },
  { first: 'Chloe',    last: 'King',       dob: '2024-08-07', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Charles King',     phone: '(512) 555-0117', email: 'charles.king@email.com',     enroll: '2024-09-01', cert: '2024-09-01' },
  { first: 'Sebastian',last: 'Wright',     dob: '2025-04-22', tier: 'tier2', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch',        parent: 'Lisa Wright',      phone: '(512) 555-0118', email: 'lisa.wright@email.com',      enroll: '2025-06-01', cert: '2025-06-01' },
  { first: 'Penelope', last: 'Scott',      dob: '2025-06-10', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Donald Scott',     phone: '(512) 555-0119', email: 'donald.scott@email.com',     enroll: '2025-08-01', cert: '2025-08-01' },
  { first: 'Lucas',    last: 'Green',      dob: '2024-10-01', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Betty Green',      phone: '(512) 555-0120', email: 'betty.green@email.com',      enroll: '2024-11-01', cert: '2024-11-01' },

  // Preschool 3-5 years (born Aug 2020-Jul 2024)
  { first: 'Isabella', last: 'Baker',      dob: '2022-03-14', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'George Baker',     phone: '(512) 555-0121', email: 'george.baker@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Mason',    last: 'Adams',      dob: '2021-07-04', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Dorothy Adams',    phone: '(512) 555-0122', email: 'dorothy.adams@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Aria',     last: 'Nelson',     dob: '2023-01-29', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'Kenneth Nelson',   phone: '(512) 555-0123', email: 'kenneth.nelson@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Logan',    last: 'Carter',     dob: '2022-09-18', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Sandra Carter',    phone: '(512) 555-0124', email: 'sandra.carter@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Grace',    last: 'Mitchell',   dob: '2023-05-11', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Gary Mitchell',    phone: '(512) 555-0125', email: 'gary.mitchell@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Elias',    last: 'Perez',      dob: '2021-11-30', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Maria Perez',      phone: '(512) 555-0126', email: 'maria.perez@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Scarlett', last: 'Roberts',    dob: '2022-06-08', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'Kevin Roberts',    phone: '(512) 555-0127', email: 'kevin.roberts@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Owen',     last: 'Turner',     dob: '2023-08-25', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Sharon Turner',    phone: '(512) 555-0128', email: 'sharon.turner@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Violet',   last: 'Phillips',   dob: '2021-04-02', tier: 'tier2', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch,snack',  parent: 'Edward Phillips',  phone: '(512) 555-0129', email: 'edward.phillips@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'James',    last: 'Campbell',   dob: '2022-12-15', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Deborah Campbell', phone: '(512) 555-0130', email: 'deborah.campbell@email.com', enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Aurora',   last: 'Parker',     dob: '2023-03-07', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'Brian Parker',     phone: '(512) 555-0131', email: 'brian.parker@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Grayson',  last: 'Evans',      dob: '2021-08-19', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Stephanie Evans',  phone: '(512) 555-0132', email: 'stephanie.evans@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Lily',     last: 'Edwards',    dob: '2022-02-01', tier: 'tier2', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Ronald Edwards',   phone: '(512) 555-0133', email: 'ronald.edwards@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Henry',    last: 'Collins',    dob: '2023-10-14', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Amy Collins',      phone: '(512) 555-0134', email: 'amy.collins@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Hazel',    last: 'Stewart',    dob: '2021-06-23', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Raymond Stewart',  phone: '(512) 555-0135', email: 'raymond.stewart@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Ezra',     last: 'Sanchez',    dob: '2022-05-31', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Angela Sanchez',   phone: '(512) 555-0136', email: 'angela.sanchez@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Nora',     last: 'Morris',     dob: '2023-07-09', tier: 'tier1', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch',        parent: 'Harold Morris',    phone: '(512) 555-0137', email: 'harold.morris@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Wyatt',    last: 'Rogers',     dob: '2021-09-14', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Shirley Rogers',   phone: '(512) 555-0138', email: 'shirley.rogers@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Riley',    last: 'Reed',       dob: '2022-11-27', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Jesse Reed',       phone: '(512) 555-0139', email: 'jesse.reed@email.com',       enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Harper',   last: 'Cook',       dob: '2023-02-18', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Virginia Cook',    phone: '(512) 555-0140', email: 'virginia.cook@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Asher',    last: 'Morgan',     dob: '2021-12-05', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch',        parent: 'Walter Morgan',    phone: '(512) 555-0141', email: 'walter.morgan@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },

  // School age 6+ (born before Aug 2020)
  { first: 'Charlotte',last: 'Bell',       dob: '2020-01-15', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Doris Bell',       phone: '(512) 555-0142', email: 'doris.bell@email.com',       enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Benjamin', last: 'Murphy',     dob: '2019-06-20', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Eugene Murphy',    phone: '(512) 555-0143', email: 'eugene.murphy@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Layla',    last: 'Bailey',     dob: '2018-03-08', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'snack',                  parent: 'Catherine Bailey', phone: '(512) 555-0144', email: 'catherine.bailey@email.com', enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Lincoln',  last: 'Rivera',     dob: '2019-11-11', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Jose Rivera',      phone: '(512) 555-0145', email: 'jose.rivera@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Stella',   last: 'Cooper',     dob: '2020-04-30', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'snack',                  parent: 'Frances Cooper',   phone: '(512) 555-0146', email: 'frances.cooper@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Oliver',   last: 'Richardson', dob: '2018-09-03', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Herbert Richardson',phone: '(512) 555-0147',email: 'herbert.richardson@email.com',enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Zoey',     last: 'Cox',        dob: '2019-02-22', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Theresa Cox',      phone: '(512) 555-0148', email: 'theresa.cox@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Miles',    last: 'Howard',     dob: '2020-07-17', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'snack',                  parent: 'Roger Howard',     phone: '(512) 555-0149', email: 'roger.howard@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Naomi',    last: 'Ward',       dob: '2018-12-01', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Joyce Ward',       phone: '(512) 555-0150', email: 'joyce.ward@email.com',       enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Caleb',    last: 'Torres',     dob: '2019-08-14', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Gloria Torres',    phone: '(512) 555-0151', email: 'gloria.torres@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },

  // More preschool & school age to reach 100 total
  { first: 'Savannah', last: 'Peterson',   dob: '2022-04-16', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Keith Peterson',   phone: '(512) 555-0152', email: 'keith.peterson@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Julian',   last: 'Gray',       dob: '2021-10-09', tier: 'tier2', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Janice Gray',      phone: '(512) 555-0153', email: 'janice.gray@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Leah',     last: 'Ramirez',    dob: '2023-06-20', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch',        parent: 'Juan Ramirez',     phone: '(512) 555-0154', email: 'juan.ramirez@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Ezekiel',  last: 'James',      dob: '2022-08-04', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Teresa James',     phone: '(512) 555-0155', email: 'teresa.james@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Aubrey',   last: 'Watson',     dob: '2021-03-28', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Dennis Watson',    phone: '(512) 555-0156', email: 'dennis.watson@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Nathan',   last: 'Brooks',     dob: '2023-09-13', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Carolyn Brooks',   phone: '(512) 555-0157', email: 'carolyn.brooks@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Addison',  last: 'Kelly',      dob: '2022-01-07', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Albert Kelly',     phone: '(512) 555-0158', email: 'albert.kelly@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Xavier',   last: 'Sanders',    dob: '2021-05-16', tier: 'tier2', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch',        parent: 'Martha Sanders',   phone: '(512) 555-0159', email: 'martha.sanders@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Skylar',   last: 'Price',      dob: '2022-07-24', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Arthur Price',     phone: '(512) 555-0160', email: 'arthur.price@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Josiah',   last: 'Bennett',    dob: '2023-11-30', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Lois Bennett',     phone: '(512) 555-0161', email: 'lois.bennett@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Madeline', last: 'Wood',       dob: '2020-06-08', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Frank Wood',       phone: '(512) 555-0162', email: 'frank.wood@email.com',       enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Micah',    last: 'Barnes',     dob: '2019-04-03', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Jean Barnes',      phone: '(512) 555-0163', email: 'jean.barnes@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Kinsley',  last: 'Ross',       dob: '2022-10-20', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Wayne Ross',       phone: '(512) 555-0164', email: 'wayne.ross@email.com',       enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Isaiah',   last: 'Henderson',  dob: '2021-02-12', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Kathleen Henderson',phone:'(512) 555-0165', email: 'kathleen.henderson@email.com',enroll:'2025-09-02',cert:'2025-09-02' },
  { first: 'Camila',   last: 'Coleman',    dob: '2023-04-05', tier: 'tier2', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'Louis Coleman',    phone: '(512) 555-0166', email: 'louis.coleman@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Eli',      last: 'Jenkins',    dob: '2022-11-14', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Evelyn Jenkins',   phone: '(512) 555-0167', email: 'evelyn.jenkins@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Piper',    last: 'Perry',      dob: '2021-07-27', tier: 'tier1', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch,snack',  parent: 'Carl Perry',       phone: '(512) 555-0168', email: 'carl.perry@email.com',       enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Jace',     last: 'Powell',     dob: '2023-01-01', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Gloria Powell',    phone: '(512) 555-0169', email: 'gloria.powell@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Autumn',   last: 'Long',       dob: '2022-03-19', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Patrick Long',     phone: '(512) 555-0170', email: 'patrick.long@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Levi',     last: 'Patterson',  dob: '2021-11-08', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Ruth Patterson',   phone: '(512) 555-0171', email: 'ruth.patterson@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Sadie',    last: 'Hughes',     dob: '2023-08-16', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch',        parent: 'Samuel Hughes',    phone: '(512) 555-0172', email: 'samuel.hughes@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Colton',   last: 'Flores',     dob: '2020-02-14', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Virginia Flores',  phone: '(512) 555-0173', email: 'virginia.flores@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Aaliyah',  last: 'Washington', dob: '2019-09-25', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Harold Washington',phone: '(512) 555-0174', email: 'harold.washington@email.com',enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Dominic',  last: 'Butler',     dob: '2022-06-02', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Christine Butler', phone: '(512) 555-0175', email: 'christine.butler@email.com', enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Genesis',  last: 'Simmons',    dob: '2021-09-01', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Philip Simmons',   phone: '(512) 555-0176', email: 'philip.simmons@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Peyton',   last: 'Foster',     dob: '2023-05-28', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Brenda Foster',    phone: '(512) 555-0177', email: 'brenda.foster@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Tristan',  last: 'Gonzalez',   dob: '2022-09-07', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Pedro Gonzalez',   phone: '(512) 555-0178', email: 'pedro.gonzalez@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Brooklyn', last: 'Bryant',     dob: '2021-04-14', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Rose Bryant',      phone: '(512) 555-0179', email: 'rose.bryant@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Silas',    last: 'Alexander',  dob: '2023-12-10', tier: 'tier2', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'Wanda Alexander',  phone: '(512) 555-0180', email: 'wanda.alexander@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Eva',      last: 'Russell',    dob: '2022-02-23', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Timothy Russell',  phone: '(512) 555-0181', email: 'timothy.russell@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Nathaniel',last: 'Griffin',    dob: '2021-06-30', tier: 'tier1', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch,snack',  parent: 'Pamela Griffin',   phone: '(512) 555-0182', email: 'pamela.griffin@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Alexis',   last: 'Diaz',       dob: '2023-03-25', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Miguel Diaz',      phone: '(512) 555-0183', email: 'miguel.diaz@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Bentley',  last: 'Hayes',      dob: '2022-07-11', tier: 'tier2', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Amy Hayes',        phone: '(512) 555-0184', email: 'amy.hayes@email.com',        enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Claire',   last: 'Myers',      dob: '2021-01-18', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Larry Myers',      phone: '(512) 555-0185', email: 'larry.myers@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Braxton',  last: 'Ford',       dob: '2023-10-04', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Ann Ford',         phone: '(512) 555-0186', email: 'ann.ford@email.com',         enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Lydia',    last: 'Hamilton',   dob: '2020-05-19', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Johnny Hamilton',  phone: '(512) 555-0187', email: 'johnny.hamilton@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Declan',   last: 'Graham',     dob: '2019-12-08', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'lunch,snack',            parent: 'Donna Graham',     phone: '(512) 555-0188', email: 'donna.graham@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Ariana',   last: 'Sullivan',   dob: '2022-12-28', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Jack Sullivan',    phone: '(512) 555-0189', email: 'jack.sullivan@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Emmett',   last: 'Wallace',    dob: '2021-08-06', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Diana Wallace',    phone: '(512) 555-0190', email: 'diana.wallace@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Paisley',  last: 'Woods',      dob: '2023-07-15', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Joe Woods',        phone: '(512) 555-0191', email: 'joe.woods@email.com',        enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Roman',    last: 'Cole',       dob: '2022-04-29', tier: 'tier1', days: 'Tuesday,Wednesday,Thursday',               meals: 'breakfast,lunch,snack',  parent: 'Jacqueline Cole',  phone: '(512) 555-0192', email: 'jacqueline.cole@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Serenity', last: 'West',       dob: '2021-11-22', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Ernest West',      phone: '(512) 555-0193', email: 'ernest.west@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Sawyer',   last: 'Jordan',     dob: '2023-02-08', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch',        parent: 'Alice Jordan',     phone: '(512) 555-0194', email: 'alice.jordan@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Willow',   last: 'Owens',      dob: '2022-08-17', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Vernon Owens',     phone: '(512) 555-0195', email: 'vernon.owens@email.com',     enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Jaxon',    last: 'Reynolds',   dob: '2021-03-03', tier: 'tier1', days: 'Tuesday,Thursday',                         meals: 'breakfast,lunch,snack',  parent: 'Martha Reynolds',  phone: '(512) 555-0196', email: 'martha.reynolds@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Delilah',  last: 'Fisher',     dob: '2023-05-01', tier: 'tier1', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Gregory Fisher',   phone: '(512) 555-0197', email: 'gregory.fisher@email.com',   enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Victor',   last: 'Ellis',      dob: '2022-01-25', tier: 'tier1', days: 'Monday,Tuesday,Wednesday',                 meals: 'breakfast,lunch,snack',  parent: 'Rebecca Ellis',    phone: '(512) 555-0198', email: 'rebecca.ellis@email.com',    enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Jade',     last: 'Harrison',   dob: '2021-07-12', tier: 'tier2', days: 'Monday,Tuesday,Wednesday,Thursday,Friday', meals: 'breakfast,lunch,snack',  parent: 'Willie Harrison',  phone: '(512) 555-0199', email: 'willie.harrison@email.com',  enroll: '2025-09-02', cert: '2025-09-02' },
  { first: 'Theo',     last: 'Gibson',     dob: '2023-09-28', tier: 'tier1', days: 'Monday,Wednesday,Friday',                  meals: 'breakfast,lunch,snack',  parent: 'Judy Gibson',      phone: '(512) 555-0200', email: 'judy.gibson@email.com',      enroll: '2025-09-02', cert: '2025-09-02' },
];

async function run() {
  try {
    // Get sites for this sponsor
    const siteRes = await pool.query(
      `SELECT id, name FROM organizations WHERE sponsor_id = $1 AND type = 'site' ORDER BY created_at LIMIT 20`,
      [SPONSOR_ORG_ID]
    );
    const sites = siteRes.rows;

    if (sites.length === 0) {
      console.log('❌ No sites found for this sponsor. Add at least one site first.');
      process.exit(1);
    }

    console.log(`✅ Found ${sites.length} site(s):`, sites.map(s => s.name).join(', '));
    console.log(`Distributing ${CHILDREN_DATA.length} children across ${sites.length} site(s)...\n`);

    let inserted = 0;
    for (let i = 0; i < CHILDREN_DATA.length; i++) {
      const c = CHILDREN_DATA[i];
      const org = sites[i % sites.length]; // distribute evenly across sites
      const ageGroup = calcAgeGroup(c.dob);
      const enrollExpires   = addMonths(c.enroll, 12);
      const certExpires     = addMonths(c.cert, 12);

      await pool.query(
        `INSERT INTO children
           (org_id, first_name, last_name, birthdate, enrollment_status, income_tier,
            age_group, enrollment_date, enrollment_expires,
            parent_name, parent_phone, parent_email,
            days_enrolled, meal_types,
            income_cert_date, income_cert_expires,
            signature_obtained, notes, form_status)
         VALUES ($1,$2,$3,$4,'enrolled',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,$16,'approved')`,
        [
          org.id, c.first, c.last, c.dob, c.tier, ageGroup,
          c.enroll, enrollExpires,
          c.parent, c.phone, c.email,
          c.days, c.meals,
          c.cert, certExpires,
          `Audit-ready enrollment record. ${TAG}`
        ]
      );
      inserted++;
      process.stdout.write(`\r  Inserted ${inserted}/${CHILDREN_DATA.length} — ${c.first} ${c.last} → ${org.name}`);
    }

    console.log(`\n\n✅ Done! ${inserted} children inserted, all audit-ready.`);
    console.log(`\nTo remove them later:\n  DELETE FROM children WHERE notes LIKE '%${TAG}%';\n`);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
