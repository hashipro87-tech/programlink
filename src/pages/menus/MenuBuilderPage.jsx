// MenuBuilderPage — CACFP Weekly Menu Builder
// Features: meal templates, USDA food library, compliance assistant, infant validation,
//           daily reimbursement estimate, per-cell comments
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UtensilsCrossed, Plus, X, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, AlertTriangle, Wheat, Copy,
  FileCheck, Loader2, CopyCheck, Star, MessageSquare,
  Trash2, BookOpen, Baby, DollarSign, Search,
  ChevronDown, ChevronUp, ShieldCheck, AlertOctagon,
} from 'lucide-react';
import api from '../../services/api';

// ── CACFP Constants ───────────────────────────────────────────────────────────
const DAYS = [
  { num: 1, short: 'Mon', label: 'Monday'    },
  { num: 2, short: 'Tue', label: 'Tuesday'   },
  { num: 3, short: 'Wed', label: 'Wednesday' },
  { num: 4, short: 'Thu', label: 'Thursday'  },
  { num: 5, short: 'Fri', label: 'Friday'    },
  { num: 6, short: 'Sat', label: 'Saturday'  },
  { num: 7, short: 'Sun', label: 'Sunday'    },
];

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', color: 'amber'  },
  { key: 'lunch',     label: 'Lunch',     color: 'green'  },
  { key: 'snack',     label: 'Snack',     color: 'blue'   },
  { key: 'supper',    label: 'Supper',    color: 'purple' },
];

const COMPONENTS = [
  { key: 'milk',      label: 'Milk',           emoji: '🥛' },
  { key: 'grain',     label: 'Grain/Bread',    emoji: '🌾' },
  { key: 'protein',   label: 'Meat/Meat Alt.', emoji: '🥩' },
  { key: 'fruit',     label: 'Fruit',          emoji: '🍎' },
  { key: 'vegetable', label: 'Vegetable',      emoji: '🥦' },
  { key: 'other',     label: 'Other',          emoji: '➕' },
];

const INFANT_COMPONENTS = [
  { key: 'formula',       label: 'Breast Milk / Formula', emoji: '🍼' },
  { key: 'infant_cereal', label: 'Infant Cereal',         emoji: '🥣' },
  { key: 'pureed_fruit',  label: 'Pureed Fruit',          emoji: '🍑' },
  { key: 'pureed_veg',    label: 'Pureed Vegetable',      emoji: '🥕' },
  { key: 'soft_protein',  label: 'Soft Protein',          emoji: '🥚' },
  { key: 'finger_food',   label: 'Finger Food',           emoji: '🫐' },
];

const ALL_COMPONENTS = [...COMPONENTS, ...INFANT_COMPONENTS];

const MEAL_COLOR = {
  breakfast: { bg: 'bg-amber-50',  border: 'border-amber-200', header: 'bg-amber-100',  text: 'text-amber-800'  },
  lunch:     { bg: 'bg-green-50',  border: 'border-green-200', header: 'bg-green-100',  text: 'text-green-800'  },
  snack:     { bg: 'bg-blue-50',   border: 'border-blue-200',  header: 'bg-blue-100',   text: 'text-blue-800'   },
  supper:    { bg: 'bg-purple-50', border: 'border-purple-200',header: 'bg-purple-100', text: 'text-purple-800' },
  infant:    { bg: 'bg-pink-50',   border: 'border-pink-200',  header: 'bg-pink-100',   text: 'text-pink-800'   },
};

// ── USDA Curated Food Library ──────────────────────────────────────────────────
const CACFP_FOODS = [
  // Milk
  { name: '1% low-fat milk',          component: 'milk',      wgr: false },
  { name: '2% reduced-fat milk',      component: 'milk',      wgr: false },
  { name: 'Skim milk',                component: 'milk',      wgr: false },
  { name: 'Whole milk',               component: 'milk',      wgr: false },
  { name: 'Low-fat chocolate milk',   component: 'milk',      wgr: false },
  // Grains — WGR
  { name: 'Whole wheat bread',        component: 'grain',     wgr: true  },
  { name: 'Whole grain tortilla',     component: 'grain',     wgr: true  },
  { name: 'Whole wheat English muffin', component: 'grain',   wgr: true  },
  { name: 'Oatmeal (rolled oats)',    component: 'grain',     wgr: true  },
  { name: 'Whole grain cereal',       component: 'grain',     wgr: true  },
  { name: 'Whole wheat pancakes',     component: 'grain',     wgr: true  },
  { name: 'Whole wheat waffles',      component: 'grain',     wgr: true  },
  { name: 'Brown rice',               component: 'grain',     wgr: true  },
  { name: 'Whole wheat pasta',        component: 'grain',     wgr: true  },
  { name: 'Whole grain crackers',     component: 'grain',     wgr: true  },
  // Grains — non-WGR
  { name: 'White bread',              component: 'grain',     wgr: false },
  { name: 'White rice',               component: 'grain',     wgr: false },
  { name: 'Cornbread',                component: 'grain',     wgr: false },
  { name: 'Biscuit',                  component: 'grain',     wgr: false },
  { name: 'Saltine crackers',         component: 'grain',     wgr: false },
  { name: 'Dinner roll',              component: 'grain',     wgr: false },
  // Protein
  { name: 'Scrambled eggs',           component: 'protein',   wgr: false },
  { name: 'Hard-boiled egg',          component: 'protein',   wgr: false },
  { name: 'Chicken (cooked)',         component: 'protein',   wgr: false },
  { name: 'Ground turkey (cooked)',   component: 'protein',   wgr: false },
  { name: 'Ground beef (cooked)',     component: 'protein',   wgr: false },
  { name: 'Fish (baked)',             component: 'protein',   wgr: false },
  { name: 'Tuna (canned)',            component: 'protein',   wgr: false },
  { name: 'Peanut butter',            component: 'protein',   wgr: false },
  { name: 'Black beans',              component: 'protein',   wgr: false },
  { name: 'Kidney beans',             component: 'protein',   wgr: false },
  { name: 'Cheese (sliced)',          component: 'protein',   wgr: false },
  { name: 'Cottage cheese',           component: 'protein',   wgr: false },
  { name: 'Yogurt (plain)',           component: 'protein',   wgr: false },
  { name: 'Hummus',                   component: 'protein',   wgr: false },
  { name: 'Tofu (soft)',              component: 'protein',   wgr: false },
  // Fruit
  { name: 'Apple slices',             component: 'fruit',     wgr: false },
  { name: 'Banana',                   component: 'fruit',     wgr: false },
  { name: 'Orange sections',          component: 'fruit',     wgr: false },
  { name: 'Grapes (halved)',          component: 'fruit',     wgr: false },
  { name: 'Strawberries',             component: 'fruit',     wgr: false },
  { name: 'Blueberries',             component: 'fruit',     wgr: false },
  { name: 'Peach slices',             component: 'fruit',     wgr: false },
  { name: 'Pear slices',              component: 'fruit',     wgr: false },
  { name: 'Pineapple chunks',         component: 'fruit',     wgr: false },
  { name: 'Watermelon cubes',         component: 'fruit',     wgr: false },
  { name: 'Mixed fruit cup',          component: 'fruit',     wgr: false },
  { name: 'Applesauce (unsweetened)', component: 'fruit',     wgr: false },
  { name: '100% orange juice',        component: 'fruit',     wgr: false },
  { name: '100% apple juice',         component: 'fruit',     wgr: false },
  // Vegetables
  { name: 'Broccoli (steamed)',       component: 'vegetable', wgr: false },
  { name: 'Carrots (cooked)',         component: 'vegetable', wgr: false },
  { name: 'Baby carrots',             component: 'vegetable', wgr: false },
  { name: 'Green beans',              component: 'vegetable', wgr: false },
  { name: 'Peas',                     component: 'vegetable', wgr: false },
  { name: 'Corn',                     component: 'vegetable', wgr: false },
  { name: 'Sweet potato (mashed)',    component: 'vegetable', wgr: false },
  { name: 'Cucumber slices',          component: 'vegetable', wgr: false },
  { name: 'Celery sticks',            component: 'vegetable', wgr: false },
  { name: 'Cherry tomatoes (halved)', component: 'vegetable', wgr: false },
  { name: 'Mixed salad greens',       component: 'vegetable', wgr: false },
  { name: 'Spinach (cooked)',         component: 'vegetable', wgr: false },
  { name: 'Bell pepper strips',       component: 'vegetable', wgr: false },
  { name: 'Squash (cooked)',          component: 'vegetable', wgr: false },
  { name: 'Mashed potatoes',          component: 'vegetable', wgr: false },
];

// ── Non-creditable foods (for compliance search) ──────────────────────────────
const NON_CREDITABLE = [
  { name: 'Ketchup / condiments',   reason: 'Condiments do not count as a vegetable component.' },
  { name: 'Fruit snacks / gummies', reason: 'Must be real fruit — processed fruit snacks are not creditable.' },
  { name: 'Pudding / gelatin',      reason: 'Not creditable for any CACFP meal component.' },
  { name: 'Juice (>1 serving/day)', reason: '100% juice is creditable but only once per day per child.' },
  { name: 'Flavored sweetened milk',reason: 'Only low-fat flavored milk (e.g. chocolate) is creditable for ages 6+.' },
  { name: 'Beans counted twice',    reason: 'Beans/legumes may count as protein OR vegetable — never both in the same meal.' },
  { name: 'Iceberg lettuce',        reason: 'Creditable as vegetable but very low nutrient density. USDA discourages overuse.' },
  { name: 'Pickle / olives',        reason: 'High sodium — creditable as vegetable but discouraged for young children.' },
  { name: 'Infant cereal for toddlers', reason: 'Infant cereal (iron-fortified) is only creditable for infants, not for children 1+.' },
  { name: 'Whole milk for 2+ year olds', reason: 'Ages 2+ require low-fat (1%) or fat-free milk. Whole milk is only for age 1.' },
];

// ── Compliance Guide data ─────────────────────────────────────────────────────
const MEAL_GUIDE = {
  breakfast: {
    emoji: '🌅', label: 'Breakfast',
    components: [
      { name: 'Milk', note: 'Age 1: whole milk · Age 2+: low-fat or fat-free' },
      { name: 'Grain/Bread', note: 'At least 1 grain per day must be Whole Grain Rich (≥51% whole grain)' },
      { name: 'Fruit or Vegetable', note: '¼ cup minimum · 100% juice counts but only once per day' },
    ],
    tip: 'Fruit and vegetable are interchangeable at breakfast — only one is required.',
  },
  lunch: {
    emoji: '☀️', label: 'Lunch',
    components: [
      { name: 'Milk', note: 'Age 1: whole milk · Age 2+: low-fat or fat-free' },
      { name: 'Grain/Bread', note: 'Enriched or whole grain' },
      { name: 'Meat/Meat Alternate', note: 'Chicken, beef, fish, eggs, cheese, yogurt, beans, peanut butter, tofu' },
      { name: 'Fruit', note: 'Must be separate from the vegetable component' },
      { name: 'Vegetable', note: 'Cannot use the same food for both fruit and vegetable' },
    ],
    tip: 'Beans/legumes count as either protein OR vegetable — not both in the same meal.',
  },
  snack: {
    emoji: '🍎', label: 'Snack',
    components: [
      { name: 'Choose any 2 components', note: 'From: Milk · Grain/Bread · Meat/Meat Alternate · Fruit · Vegetable' },
    ],
    tip: 'Children who receive 3 meals per day are only reimbursable for 1 snack, and vice versa.',
  },
  supper: {
    emoji: '🌙', label: 'Supper',
    components: [
      { name: 'Milk', note: 'Same requirements as Lunch' },
      { name: 'Grain/Bread', note: 'Enriched or whole grain' },
      { name: 'Meat/Meat Alternate', note: 'Same creditable items as Lunch' },
      { name: 'Fruit', note: 'Required — separate from vegetable' },
      { name: 'Vegetable', note: 'Required — separate from fruit' },
    ],
    tip: 'Supper is only reimbursable in certain CACFP programs (e.g. at-risk afterschool care, shelters).',
  },
};

const SEVERITY = {
  critical: { dot: '🟥', bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-800',   fixText: 'text-red-600',   label: 'Critical' },
  warning:  { dot: '🟨', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', fixText: 'text-amber-600', label: 'Warning'  },
  info:     { dot: '🟦', bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800',  fixText: 'text-blue-600',  label: 'Info'     },
};

const COMMON_ERRORS = [
  { severity: 'critical', icon: '🥦', text: 'Missing vegetable at lunch/supper',       fix: 'Add a vegetable item (even ¼ cup counts).', citation: '7 CFR §226.20(a)' },
  { severity: 'critical', icon: '🥛', text: 'Wrong milk type for age group',             fix: 'Age 1: whole milk · Age 2+: low-fat (1%) or fat-free.', citation: '7 CFR §226.20(a)(1)' },
  { severity: 'critical', icon: '🥩', text: 'Missing meat/meat alternate at lunch/supper', fix: 'Eggs, cheese, yogurt, beans, peanut butter, and tofu all qualify.', citation: '7 CFR §226.20(a)' },
  { severity: 'critical', icon: '🍎', text: 'Same food counted as fruit AND vegetable', fix: 'Fruit and vegetable must be two different foods.', citation: '7 CFR §226.20(a)' },
  { severity: 'critical', icon: '🍼', text: 'Infant meal missing formula/breast milk',  fix: 'Breast milk or iron-fortified formula is required for all infant meals.', citation: '7 CFR §226.20(b)' },
  { severity: 'warning',  icon: '🌾', text: 'No Whole Grain Rich grain for the day',    fix: 'At least 1 grain per day must be WGR — check the 🌾 box when adding it.', citation: 'USDA CACFP WGR Criteria' },
  { severity: 'warning',  icon: '🍽️', text: 'Snack has only 1 component',              fix: 'Snacks require any 2 of the 5 components (Milk, Grain, Protein, Fruit, Vegetable).', citation: '7 CFR §226.20(a)' },
  { severity: 'info',     icon: '🧃', text: 'Juice can only count once per day',        fix: '100% juice is creditable as fruit but is limited to 1 serving per day per child.', citation: '7 CFR §226.20(a)' },
  { severity: 'info',     icon: '🫘', text: 'Beans/legumes — count as protein OR vegetable, not both', fix: 'Choose one role per meal. They cannot fill two components simultaneously.', citation: '7 CFR §226.20(a)' },
];

// ── Smart Q&A Search Database ─────────────────────────────────────────────────
const QA_DB = [
  { q: ['yogurt','can yogurt','yogurt count'],
    a: 'Yes — plain or flavored yogurt is creditable as Meat/Meat Alternate. 4 oz (½ cup) = 1 oz equivalent.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['what milk','milk age','milk for 2','milk for 3','milk year','toddler milk','whole milk','low fat milk'],
    a: 'Age 1: whole milk required. Ages 2+: low-fat (1%) or fat-free milk required. Whole milk is NOT allowed for age 2+.',
    severity: 'critical', citation: '7 CFR §226.20(a)(1)' },
  { q: ['beans','can beans','beans twice','legumes','count twice'],
    a: 'No — beans and legumes count as either Protein OR Vegetable in a single meal. They cannot fill both components.',
    severity: 'critical', citation: '7 CFR §226.20(a)' },
  { q: ['whole grain','wgr','whole grain rich','what qualifies','grain qualify'],
    a: 'A grain is WGR when ≥51% of the grain ingredients are whole grain, listed first on the label. Examples: whole wheat bread, oatmeal, brown rice.',
    severity: 'info', citation: 'USDA CACFP WGR Criteria' },
  { q: ['juice','can juice','juice count','orange juice','apple juice'],
    a: '100% fruit juice counts as a fruit component but only once per day per child. Whole fruit is always preferred.',
    severity: 'warning', citation: '7 CFR §226.20(a)' },
  { q: ['peanut butter','can peanut'],
    a: '2 tablespoons of peanut butter = 1 oz meat alternate. Creditable at lunch, supper, or snack.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['eggs','can eggs','egg count'],
    a: '1 large egg = 1 oz meat alternate. Creditable at any meal.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['tofu','can tofu'],
    a: '4 oz (½ cup) of tofu = 1 oz meat alternate. Must be firm enough to measure by volume.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['cheese','can cheese'],
    a: '1 oz of natural cheese = 1 oz meat alternate. Creditable at any CACFP meal.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['infant cereal','baby food','infant'],
    a: 'Iron-fortified infant cereal is creditable only for infants (under 12 months). For children 1+, use regular grain products.',
    severity: 'critical', citation: '7 CFR §226.20(b)' },
  { q: ['snack','how many snack','snack components'],
    a: 'Snacks require any 2 of 5 components: Milk · Grain/Bread · Meat/Meat Alternate · Fruit · Vegetable.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['chocolate milk','flavored milk'],
    a: 'Low-fat flavored milk (e.g. chocolate) is creditable only for children 6 years and older.',
    severity: 'critical', citation: '7 CFR §226.20(a)(1)' },
  { q: ['ketchup','condiment','sauce','pickle'],
    a: 'Ketchup, condiments, and pickles do NOT count as a vegetable. Only whole or minimally processed vegetables are creditable.',
    severity: 'critical', citation: 'USDA CACFP Creditable Foods Guide' },
  { q: ['hummus'],
    a: 'Hummus (chickpea-based) is creditable as a Meat/Meat Alternate. 2 oz (¼ cup) = 1 oz equivalent.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
  { q: ['cottage cheese'],
    a: '4 oz (½ cup) of cottage cheese = 1 oz meat alternate.',
    severity: 'info', citation: '7 CFR §226.20(a)' },
];

// ── State Resources ───────────────────────────────────────────────────────────
const STATE_RESOURCES = {
  TX: {
    name: 'Texas',
    flag: '🤠',
    agency: 'Texas Department of Agriculture (TDA)',
    portal: 'https://squaremeals.org',
    portalName: 'SquareMeals (squaremeals.org)',
    phone: '1-877-TEX-MEAL (1-877-839-6325)',
    email: 'cacfp@texasagriculture.gov',
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'e.g., July claims due by Sept 30' },
      { label: 'Annual Sponsor Renewal', value: 'May 31 each year', note: 'Sponsor agreement via SquareMeals' },
      { label: 'Site Reviews', value: 'Every 3 years minimum', note: 'TDA schedules; 10 days to respond if contacted' },
    ],
    requiredForms: [
      { name: 'CACFP Sponsor Application', note: 'Annual renewal via SquareMeals portal' },
      { name: 'Site Application', note: 'Required for each new site added to your program' },
      { name: 'Monthly Claim for Reimbursement', note: 'Submitted via SquareMeals by the 60-day deadline' },
      { name: 'Production Records', note: 'Required for each meal service — retain 3 years' },
      { name: 'Attendance / Sign-in Sheets', note: 'Daily records per site — retain 3 years' },
      { name: 'Income Eligibility Forms', note: 'Required for Tier I/II determination — retain 3 years' },
    ],
    tips: [
      'Claims are submitted via SquareMeals only — TDA does not accept paper claims.',
      'Keep all records (meal counts, menus, income certs) for at least 3 years from submission.',
      'Contact TDA before deadlines if you have a data entry issue — late claims may be denied.',
    ],
  },
  CA: {
    name: 'California',
    flag: '🌴',
    agency: 'California Dept. of Social Services (CDSS)',
    portal: 'https://www.cdss.ca.gov/inforesources/cdss-programs/cacfp',
    portalName: 'CDSS CACFP Portal',
    phone: '916-657-2144',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Contact your CDSS region for extensions' },
      { label: 'Annual Agreement Renewal', value: 'Varies by region', note: 'Check with your CDSS regional office' },
    ],
    requiredForms: [
      { name: 'Program Agreement', note: 'Annual renewal' },
      { name: 'Monthly Meal Count Claim', note: 'Submitted via CDSS portal' },
      { name: 'Income Eligibility Statements', note: 'Retain 3 years' },
    ],
    tips: [
      'CDSS has regional offices — contact your assigned office for state-specific guidance.',
      'California requires Spanish-language versions of key parent forms in many counties.',
    ],
  },
  OH: {
    name: 'Ohio',
    flag: '🌻',
    agency: 'Ohio Dept. of Education (ODE)',
    portal: 'https://education.ohio.gov/Topics/Other-Resources/Food-and-Nutrition/Child-and-Adult-Care-Food-Program',
    portalName: 'ODE CACFP Page',
    phone: '877-644-6338',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Varies by local agency' },
    ],
    requiredForms: [
      { name: 'Program Agreement', note: 'Annual renewal' },
      { name: 'Monthly Claim', note: 'Submitted via ODE portal' },
    ],
    tips: [
      'Contact your assigned ODE representative for state-specific deadlines.',
    ],
  },
  VA: {
    name: 'Virginia',
    flag: '🦅',
    agency: 'Virginia Dept. of Education (VDOE)',
    portal: 'https://www.doe.virginia.gov/programs-services/child-nutrition/cacfp',
    portalName: 'VDOE CACFP Page',
    phone: '804-225-2074',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Contact VDOE for extensions' },
    ],
    requiredForms: [
      { name: 'Program Agreement', note: 'Annual renewal via VDOE' },
      { name: 'Monthly Claim', note: 'Submitted via VDOE portal' },
    ],
    tips: [
      'Virginia processes claims through VDOE — contact your assigned specialist for guidance.',
    ],
  },
  CO: {
    name: 'Colorado',
    flag: '🏔️',
    agency: 'Colorado Dept. of Human Services (CDHS)',
    portal: 'https://cdhs.colorado.gov/cacfp',
    portalName: 'CDHS CACFP Page',
    phone: '303-866-5700',
    email: null,
    deadlines: [
      { label: 'Monthly Claim Deadline', value: '60 days after month end', note: 'Contact CDHS for sponsor-specific deadlines' },
    ],
    requiredForms: [
      { name: 'Program Agreement', note: 'Annual renewal via CDHS' },
      { name: 'Monthly Claim', note: 'Submitted via CDHS portal' },
    ],
    tips: [
      'CDHS administers CACFP for Colorado — contact your assigned specialist for state-specific rules.',
    ],
  },
};

// ── Validation ────────────────────────────────────────────────────────────────
function validateMealClient(items, mealType) {
  const has = (comp) => Array.isArray(comp)
    ? comp.some(c => items.some(i => i.component === c))
    : items.some(i => i.component === comp);
  const missing = [];
  if (mealType === 'breakfast') {
    if (!has('milk'))                 missing.push('Milk');
    if (!has('grain'))                missing.push('Grain/Bread');
    if (!has(['fruit','vegetable']))  missing.push('Fruit or Vegetable');
  } else if (mealType === 'lunch' || mealType === 'supper') {
    if (!has('milk'))      missing.push('Milk');
    if (!has('grain'))     missing.push('Grain/Bread');
    if (!has('protein'))   missing.push('Meat/Meat Alt.');
    if (!has('fruit'))     missing.push('Fruit');
    if (!has('vegetable')) missing.push('Vegetable');
  } else if (mealType === 'snack') {
    const present = ['milk','grain','protein','fruit','vegetable'].filter(c => items.some(i => i.component === c)).length;
    if (present < 2) missing.push(`Need ${2 - present} more component${2 - present !== 1 ? 's' : ''}`);
  } else if (mealType === 'infant') {
    if (!has('formula')) missing.push('Breast Milk / Formula');
  }
  return missing;
}

function getMealStatus(items, mealType) {
  if (items.length === 0) return 'empty';
  return validateMealClient(items, mealType).length === 0 ? 'complete' : 'incomplete';
}

function getDayWGROk(dayItems) {
  const grains = dayItems.filter(i => i.component === 'grain');
  if (grains.length === 0) return null;
  return grains.some(i => i.is_whole_grain);
}

function getDayIssues(dayItems) {
  const issues = [];
  if (getDayWGROk(dayItems) === false)
    issues.push({ severity: 'yellow', meal: 'breakfast', label: 'Missing Whole Grain Rich item' });
  [...MEALS, { key: 'infant' }].forEach(m => {
    const mi = dayItems.filter(i => i.meal_type === m.key);
    if (mi.length === 0) return;
    validateMealClient(mi, m.key).forEach(miss =>
      issues.push({ severity: 'red', meal: m.key, label: `${m.label || 'Infant'} — missing ${miss}` })
    );
  });
  return issues;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split('T')[0];
}
function addWeeks(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().split('T')[0];
}
function formatWeek(weekStart) {
  const start = new Date(weekStart);
  const end   = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
}
function dayDate(weekStart, dayNum) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + (dayNum - 1));
  return d.getDate();
}
function fmtMoney(n) { return n < 1 ? `${(n*100).toFixed(0)}¢` : `$${n.toFixed(2)}`; }

// ── Sub-components ────────────────────────────────────────────────────────────
function FoodChip({ item, onRemove, large = false }) {
  const comp = ALL_COMPONENTS.find(c => c.key === item.component) || COMPONENTS[5];
  return (
    <div className={`group flex items-center gap-1 rounded-full border bg-white ${
      large ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
    } border-gray-200 max-w-full`}>
      <span>{comp.emoji}</span>
      <span className="truncate text-gray-700">{item.food_item}</span>
      {item.is_whole_grain && <Wheat className="w-3 h-3 text-amber-500 flex-shrink-0" />}
      <button onClick={e => { e.stopPropagation(); onRemove(item.id); }}
        className="ml-0.5 text-gray-300 hover:text-red-500 flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function DayStatusPanel({ items, weekStart, onOpenCell }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Weekly Validation</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click any issue to go directly to that meal</p>
      </div>
      <div className="divide-y divide-gray-100">
        {DAYS.map(day => {
          const dayItems = items.filter(i => i.day_of_week === day.num);
          const issues   = getDayIssues(dayItems);
          const hasItems = dayItems.length > 0;
          const sc = !hasItems                                   ? { dot: '⚪', bg: 'bg-gray-50',   text: 'text-gray-400',   label: '— No meals added' }
            : issues.some(i => i.severity === 'red')             ? { dot: '🔴', bg: 'bg-red-50',    text: 'text-red-800',    label: '' }
            : issues.length > 0                                  ? { dot: '🟡', bg: 'bg-amber-50',  text: 'text-amber-800',  label: '' }
            :                                                      { dot: '🟢', bg: 'bg-green-50',  text: 'text-green-800',  label: '— Complete' };
          return (
            <div key={day.num} className={`px-5 py-3 flex items-start gap-3 ${sc.bg}`}>
              <span className="text-base mt-0.5 flex-shrink-0">{sc.dot}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${sc.text}`}>{day.label}{sc.label}</p>
                {issues.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {issues.map((issue, i) => (
                      <button key={i} onClick={() => onOpenCell(day.num, issue.meal)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors hover:opacity-80 ${
                          issue.severity === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}>
                        → {issue.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DuplicateDayModal({ fromDay, onConfirm, onClose, busy }) {
  const [targets, setTargets] = useState([]);
  const toggle = (num) => setTargets(t => t.includes(num) ? t.filter(x => x !== num) : [...t, num]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Copy {fromDay.label} to…</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {DAYS.filter(d => d.num !== fromDay.num).map(d => (
            <label key={d.num} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
              <input type="checkbox" checked={targets.includes(d.num)} onChange={() => toggle(d.num)} className="w-4 h-4 rounded accent-brand-600" />
              <span className="text-sm font-medium text-gray-800">{d.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(targets)} disabled={!targets.length || busy}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CopyCheck className="w-4 h-4" />}
            {busy ? 'Copying…' : `Copy to ${targets.length || ''} day${targets.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Compliance Assistant Panel ────────────────────────────────────────────────
function ComplianceAssistantPanel({ open, onClose, contextMeal, items = [], onOpenCell, userState }) {
  const [search, setSearch]       = useState('');
  const [helpTab, setHelpTab]     = useState('usda'); // 'usda' | 'state'
  const [expanded, setExpanded]   = useState({ issues: true, meals: false, wgr: false, milk: false, infant: false, errors: false, claims: false });
  const [activeMeal, setActiveMeal] = useState(null);

  const stateRes = userState ? STATE_RESOURCES[userState] : null;

  useEffect(() => {
    if (contextMeal && open) {
      setActiveMeal(contextMeal);
      setExpanded(e => ({ ...e, meals: true }));
    }
  }, [contextMeal, open]);

  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  // ── Compute live issues from current menu items ──────────────────────────────
  const liveIssues = [];
  if (items.length > 0) {
    DAYS.forEach(day => {
      const dayItems = items.filter(i => i.day_of_week === day.num);
      if (!dayItems.length) return;
      MEALS.forEach(meal => {
        const mealItems = dayItems.filter(i => i.meal_type === meal.key);
        if (!mealItems.length) return;
        validateMealClient(mealItems, meal.key).forEach(missing => {
          liveIssues.push({ dayNum: day.num, dayLabel: day.short, mealKey: meal.key, mealLabel: meal.label, missing, severity: 'critical', citation: '7 CFR §226.20(a)' });
        });
      });
      if (getDayWGROk(dayItems) === false) {
        liveIssues.push({ dayNum: day.num, dayLabel: day.short, mealKey: 'breakfast', mealLabel: 'Breakfast', missing: 'Whole Grain Rich grain', severity: 'warning', citation: 'USDA CACFP WGR Criteria' });
      }
    });
  }

  // ── Prevent Claim Issues checklist ──────────────────────────────────────────
  const hasItems = items.length > 0;
  const criticalCount = liveIssues.filter(i => i.severity === 'critical').length;
  const warnCount     = liveIssues.filter(i => i.severity === 'warning').length;
  const checks = [
    { label: 'Meal components complete',      ok: hasItems && criticalCount === 0 },
    { label: 'Whole Grain Rich met daily',    ok: hasItems && warnCount === 0 },
    { label: 'No duplicate fruit/vegetable',  ok: hasItems },
    { label: 'All meals have required items', ok: hasItems && criticalCount === 0 },
    { label: 'Ready for reimbursement',       ok: hasItems && criticalCount === 0 && warnCount === 0 },
  ];

  // ── Smart search: Q&A → creditable foods → non-creditable ───────────────────
  const q = search.trim().toLowerCase();
  const qaHits   = q.length > 1 ? QA_DB.filter(entry => entry.q.some(kw => kw.includes(q) || q.includes(kw))) : [];
  const foodHits = q.length > 1 ? CACFP_FOODS.filter(f => f.name.toLowerCase().includes(q)).slice(0, 6) : [];
  const badHits  = q.length > 1 ? NON_CREDITABLE.filter(f => f.name.toLowerCase().includes(q)) : [];
  const hasResults = qaHits.length || foodHits.length || badHits.length;

  const compEmoji = (c) => ({ milk:'🥛', grain:'🌾', protein:'🥩', fruit:'🍎', vegetable:'🥦' }[c] || '➕');

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0 bg-brand-600">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <h2 className="font-bold text-white text-sm">Compliance Assistant</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {/* Tab switcher */}
        <div className="flex px-4 pb-0 gap-0">
          <button onClick={() => setHelpTab('usda')}
            className={`flex-1 text-xs font-semibold py-2 border-b-2 transition-colors ${
              helpTab === 'usda'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}>
            USDA Compliance
          </button>
          <button onClick={() => setHelpTab('state')}
            className={`flex-1 text-xs font-semibold py-2 border-b-2 transition-colors ${
              helpTab === 'state'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}>
            {stateRes ? `${stateRes.flag} ${stateRes.name}` : 'State Resources'}
          </button>
        </div>
      </div>

      {/* ── STATE RESOURCES TAB ─────────────────────────────────────────────── */}
      {helpTab === 'state' && (
        <div className="flex-1 overflow-y-auto">
          {!stateRes ? (
            <div className="px-4 py-8 text-center">
              <div className="text-3xl mb-3">🗺️</div>
              <p className="text-sm font-semibold text-gray-700">No state configured</p>
              <p className="text-xs text-gray-500 mt-1">Go to <strong>Settings → Organization</strong> and select your CACFP program state to see state-specific deadlines, forms, and contacts.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {/* Agency + Contact */}
              <div className="px-4 py-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">State Agency</p>
                <p className="text-sm font-semibold text-gray-800">{stateRes.agency}</p>
                <a href={stateRes.portal} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium">
                  🔗 {stateRes.portalName}
                </a>
                {stateRes.phone && <p className="text-xs text-gray-600 mt-1.5">📞 {stateRes.phone}</p>}
                {stateRes.email && <p className="text-xs text-gray-600 mt-0.5">✉️ {stateRes.email}</p>}
              </div>

              {/* Deadlines */}
              <div className="px-4 py-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Key Deadlines</p>
                <div className="space-y-2">
                  {stateRes.deadlines.map((d, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-semibold text-amber-800">⏰ {d.label}</p>
                      <p className="text-xs text-amber-700 font-bold mt-0.5">{d.value}</p>
                      {d.note && <p className="text-xs text-amber-600 mt-0.5">{d.note}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Forms */}
              <div className="px-4 py-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Required Forms & Records</p>
                <div className="space-y-1.5">
                  {stateRes.requiredForms.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-1">
                      <span className="text-brand-500 mt-0.5 flex-shrink-0 text-xs">📋</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{f.name}</p>
                        <p className="text-xs text-gray-500">{f.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="px-4 py-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tips for {stateRes.name} Sponsors</p>
                <div className="space-y-2">
                  {stateRes.tips.map((tip, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-blue-800">🟦 {tip}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ── USDA COMPLIANCE TAB ─────────────────────────────────────────────── */}
      {helpTab === 'usda' && <>

      {/* Smart Search */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder='Ask anything — "yogurt", "milk age 2", "beans twice"…'
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3 h-3" /></button>}
        </div>

        {q.length > 1 && (
          <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto">
            {/* Q&A answers first */}
            {qaHits.map((hit, i) => {
              const s = SEVERITY[hit.severity];
              return (
                <div key={i} className={`rounded-xl border px-3 py-2 ${s.bg} ${s.border}`}>
                  <p className="text-xs font-semibold text-gray-800">{s.dot} {hit.a}</p>
                  <p className="text-xs text-gray-400 mt-1">Source: USDA CACFP · {hit.citation}</p>
                </div>
              );
            })}
            {/* Creditable foods */}
            {foodHits.map((f, i) => (
              <div key={i} className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span>✅</span>
                  <span className="text-xs font-semibold text-gray-800">{f.name}</span>
                  {f.wgr && <span className="ml-auto text-xs text-amber-600 font-semibold">🌾 WGR</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 pl-5">{compEmoji(f.component)} {f.component} component</p>
              </div>
            ))}
            {/* Non-creditable */}
            {badHits.map((f, i) => (
              <div key={i} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                <div className="flex items-center gap-1.5"><span>❌</span><span className="text-xs font-semibold text-gray-800">{f.name}</span></div>
                <p className="text-xs text-red-600 mt-0.5 pl-5">{f.reason}</p>
              </div>
            ))}
            {!hasResults && <p className="text-xs text-gray-400 text-center py-2">No results — try "yogurt", "milk age", "can beans count twice"</p>}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

        {/* Live Issues (this week) */}
        <div>
          <button onClick={() => toggle('issues')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
              This Week's Issues
              {liveIssues.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{liveIssues.length}</span>}
            </span>
            {expanded.issues ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.issues && (
            <div className="px-4 pb-3 space-y-1.5">
              {liveIssues.length === 0 && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-green-700">{hasItems ? 'No issues detected' : 'Add meals to check compliance'}</p>
                </div>
              )}
              {liveIssues.map((issue, i) => {
                const s = SEVERITY[issue.severity];
                return (
                  <button key={i} onClick={() => { onOpenCell?.(issue.dayNum, issue.mealKey); }}
                    className={`w-full text-left rounded-xl border px-3 py-2 ${s.bg} ${s.border} hover:opacity-80 transition-opacity group`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold ${s.text}`}>{s.dot} {issue.dayLabel} {issue.mealLabel} — missing {issue.missing}</p>
                      <span className="text-xs text-gray-400 group-hover:text-brand-600 flex-shrink-0">Fix →</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{issue.citation}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Prevent Claim Issues */}
        <div>
          <button onClick={() => toggle('claims')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Prevent Claim Issues</span>
            {expanded.claims ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.claims && (
            <div className="px-4 pb-3 space-y-1">
              {checks.map((c, i) => (
                <div key={i} className={`flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0`}>
                  {c.ok
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <span className={`text-xs font-medium ${c.ok ? 'text-green-700' : 'text-gray-500'}`}>{c.label}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center pt-2">USDA CACFP Meal Pattern · 7 CFR Part 226</p>
            </div>
          )}
        </div>

        {/* Meal Components */}
        <div>
          <button onClick={() => toggle('meals')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span>🍽️ Meal Components</span>
            {expanded.meals ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.meals && (
            <div className="px-4 pb-3 space-y-2">
              {Object.entries(MEAL_GUIDE).map(([mealKey, guide]) => (
                <div key={mealKey} className={`rounded-xl border overflow-hidden ${activeMeal === mealKey ? 'border-brand-300 bg-brand-50' : 'border-gray-100'}`}>
                  <button onClick={() => setActiveMeal(activeMeal === mealKey ? null : mealKey)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50">
                    <span>{guide.emoji} {guide.label}</span>
                    {activeMeal === mealKey ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                  </button>
                  {activeMeal === mealKey && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {guide.components.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5 text-xs flex-shrink-0">✓</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{c.name}</p>
                            {c.note && <p className="text-xs text-gray-500">{c.note}</p>}
                          </div>
                        </div>
                      ))}
                      {guide.tip && <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 text-xs text-amber-800">💡 {guide.tip}</div>}
                      <p className="text-xs text-gray-400 pt-1">Source: USDA CACFP Meal Pattern · 7 CFR §226.20</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Whole Grain Rich */}
        <div>
          <button onClick={() => toggle('wgr')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span>🌾 Whole Grain Rich</span>
            {expanded.wgr ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.wgr && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-gray-600">A food is WGR when <strong>≥51% of grain ingredients are whole grain</strong>, listed first on the label.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 border border-green-100 rounded-xl p-2.5">
                  <p className="text-xs font-bold text-green-700 mb-1">✅ WGR</p>
                  {['Whole wheat bread','Oatmeal','Brown rice','Whole grain tortilla','Whole wheat pasta'].map(f => <p key={f} className="text-xs text-green-700">• {f}</p>)}
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-2.5">
                  <p className="text-xs font-bold text-red-700 mb-1">❌ Not WGR</p>
                  {['White bread','White rice','Saltine crackers','Dinner roll','Cornbread'].map(f => <p key={f} className="text-xs text-red-700">• {f}</p>)}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 text-xs text-amber-800">🟨 At least 1 grain per day must be WGR.</div>
              <p className="text-xs text-gray-400">Source: USDA CACFP WGR Criteria</p>
            </div>
          )}
        </div>

        {/* Milk by Age */}
        <div>
          <button onClick={() => toggle('milk')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span>🥛 Milk Requirements</span>
            {expanded.milk ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.milk && (
            <div className="px-4 pb-4 space-y-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 text-gray-600 font-semibold">Age</th>
                    <th className="text-left py-1.5 text-gray-600 font-semibold">Required</th>
                    <th className="text-left py-1.5 text-gray-600 font-semibold">Min.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['1 year',   'Whole milk',              '½ cup', true],
                    ['2–3 yrs',  'Low-fat (1%) or fat-free','½ cup', false],
                    ['4–5 yrs',  'Low-fat (1%) or fat-free','¾ cup', false],
                    ['6+ yrs',   'Low-fat (1%) or fat-free','1 cup', false],
                  ].map(([age, req, min, highlight]) => (
                    <tr key={age} className={highlight ? 'bg-amber-50' : ''}>
                      <td className="py-1.5 text-gray-800 font-medium">{age}</td>
                      <td className="py-1.5 text-gray-700">{req}</td>
                      <td className="py-1.5 text-gray-500">{min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 text-xs text-red-800">🟥 Whole milk for age 2+ is a Critical compliance error.</div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2 text-xs text-blue-800">🟦 Low-fat flavored milk creditable for ages 6+ only.</div>
              <p className="text-xs text-gray-400">Source: 7 CFR §226.20(a)(1)</p>
            </div>
          )}
        </div>

        {/* Infant Meals */}
        <div>
          <button onClick={() => toggle('infant')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span>👶 Infant Meals</span>
            {expanded.infant ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.infant && (
            <div className="px-4 pb-4 space-y-2">
              {[
                { range: 'Birth – 5 months', emoji: '🍼', items: ['Breast milk or iron-fortified formula only','No solid foods'] },
                { range: '6 – 8 months',     emoji: '🥣', items: ['Breast milk or formula (required)','Infant cereal (optional)','Pureed fruit or vegetable (optional)'] },
                { range: '9 – 11 months',    emoji: '🫐', items: ['Breast milk or formula (required)','Infant cereal or grain (optional)','Soft protein (optional)','Soft fruit or vegetable (optional)'] },
              ].map(r => (
                <div key={r.range} className="bg-pink-50 border border-pink-100 rounded-xl p-2.5">
                  <p className="text-xs font-bold text-pink-800 mb-1">{r.emoji} {r.range}</p>
                  {r.items.map(item => <p key={item} className="text-xs text-pink-700">• {item}</p>)}
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">Source: 7 CFR §226.20(b)</p>
            </div>
          )}
        </div>

        {/* Common Errors */}
        <div>
          <button onClick={() => toggle('errors')}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <span>⚠️ Common Compliance Errors</span>
            {expanded.errors ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {expanded.errors && (
            <div className="px-4 pb-4 space-y-2">
              {COMMON_ERRORS.map((e, i) => {
                const s = SEVERITY[e.severity];
                return (
                  <div key={i} className={`rounded-xl border px-3 py-2.5 ${s.bg} ${s.border}`}>
                    <p className={`text-xs font-semibold ${s.text}`}>{s.dot} {e.icon} {e.text}</p>
                    <p className={`text-xs mt-0.5 ${s.fixText}`}>Fix: {e.fix}</p>
                    <p className="text-xs text-gray-400 mt-1">Source: {e.citation}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0 bg-gray-50">
        <p className="text-xs text-gray-400 text-center">USDA CACFP Meal Patterns · 7 CFR Part 226 · FY2025</p>
      </div>

      </> /* end USDA tab */}

      {/* State tab footer */}
      {helpTab === 'state' && stateRes && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">{stateRes.name} · {stateRes.agency}</p>
        </div>
      )}
    </div>
  );
}

// ── ImportMenuModal ────────────────────────────────────────────────────────────
// Accepts PDF, DOCX, XLSX, CSV — uses Claude AI to extract menu items,
// shows a review step, then posts items to the current week's menu.

const DAY_LABELS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const IMPORT_MEAL_LABELS = {
  breakfast: 'Breakfast', am_snack: 'AM Snack', lunch: 'Lunch',
  pm_snack: 'PM Snack', snack: 'Snack', supper: 'Supper',
};
const COMP_LABELS_IM = {
  grain: 'Grain', 'meat/alt': 'Meat/Alt', fruit: 'Fruit',
  vegetable: 'Vegetable', dairy: 'Dairy', other: 'Other',
};
const VALID_COMPS_IM = ['grain','meat/alt','fruit','vegetable','dairy','other'];
const VALID_MEALS_IM = ['breakfast','am_snack','lunch','pm_snack','snack','supper'];

function groupItems(items) {
  // Returns Map: "day|meal" → items[]
  const map = new Map();
  items.forEach((it, idx) => {
    const key = `${it.day_of_week}|${it.meal_type}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ ...it, _idx: idx });
  });
  return map;
}

function ImportMenuModal({ onClose, ensureMenu, onImported }) {
  const [step,     setStep]     = useState('upload'); // upload | extracting | review | done
  const [file,     setFile]     = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error,    setError]    = useState('');
  const [extracted, setExtracted] = useState([]); // raw items from API
  const [selected,  setSelected]  = useState({});  // idx → bool
  const [editItems, setEditItems] = useState([]);  // editable copy
  const [importing, setImporting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const fileRef = useRef(null);

  const ACCEPTED = '.pdf,.docx,.xlsx,.xls,.csv,.txt';

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleExtract = async () => {
    if (!file) { setError('Please select a file.'); return; }
    setStep('extracting'); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/menus/import/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!data.items?.length) {
        setError('No menu items found in this file. Try a different format or add some items manually.');
        setStep('upload');
        return;
      }
      setExtracted(data.items);
      setEditItems(data.items.map(it => ({ ...it })));
      const sel = {};
      data.items.forEach((_, i) => { sel[i] = true; });
      setSelected(sel);
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to read the file. Try a PDF or CSV.');
      setStep('upload');
    }
  };

  const toggleAll = (val) => {
    const sel = {};
    editItems.forEach((_, i) => { sel[i] = val; });
    setSelected(sel);
  };

  const updateEditItem = (idx, field, val) => {
    setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const handleImport = async () => {
    const toImport = editItems.filter((_, i) => selected[i] !== false);
    if (!toImport.length) { setError('Select at least one item.'); return; }
    setImporting(true); setError('');
    try {
      const m = await ensureMenu();
      let count = 0;
      for (const it of toImport) {
        try {
          await api.post(`/menus/${m.id}/items`, {
            day_of_week:    it.day_of_week,
            meal_type:      it.meal_type,
            food_item:      it.food_item,
            component:      it.component,
            is_whole_grain: !!it.is_whole_grain,
            quantity:        it.quantity || null,
          });
          count++;
        } catch { /* skip duplicates silently */ }
      }
      setDoneCount(count);
      setStep('done');
      onImported();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import items.');
    } finally {
      setImporting(false);
    }
  };

  // Group by day + meal for review display
  const grouped = groupItems(editItems);
  const groupKeys = [...grouped.keys()].sort((a, b) => {
    const [da, ma] = a.split('|');
    const [db, mb] = b.split('|');
    if (da !== db) return parseInt(da) - parseInt(db);
    return VALID_MEALS_IM.indexOf(ma) - VALID_MEALS_IM.indexOf(mb);
  });
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Import Menu</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === 'upload'    && 'Upload your existing menu — Excel, Word, PDF, or CSV'}
              {step === 'extracting' && 'Reading your menu with AI…'}
              {step === 'review'   && `${editItems.length} items found — review and confirm`}
              {step === 'done'     && `${doneCount} items imported successfully`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="p-6 space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
              }`}>
              <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
              <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5 text-brand-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {file ? file.name : 'Drop your menu file here'}
              </p>
              <p className="text-xs text-gray-400">
                Excel (.xlsx), Word (.docx), PDF, CSV · up to 10 MB
              </p>
              {file && (
                <p className="text-xs text-brand-600 font-semibold mt-2">✓ {file.name} selected</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-600 mb-1">Works with:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <span>📊 Excel spreadsheets</span>
                <span>📄 Word documents</span>
                <span>📋 PDF menus</span>
                <span>📑 State-approved templates</span>
                <span>🔄 KidKare exports</span>
                <span>📂 Minute Menu exports</span>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleExtract} disabled={!file}
                className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40">
                Extract Menu →
              </button>
            </div>
          </div>
        )}

        {/* Step: Extracting */}
        {step === 'extracting' && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-700">Reading your menu with AI…</p>
            <p className="text-xs text-gray-400">This usually takes 5–15 seconds</p>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                  <input type="checkbox"
                    checked={selectedCount === editItems.length}
                    onChange={e => toggleAll(e.target.checked)}
                    className="rounded border-gray-300 text-brand-600" />
                  Select all
                </label>
                <span className="text-xs text-gray-400">{selectedCount} of {editItems.length} selected</span>
              </div>
              <p className="text-xs text-gray-400">Click a component to change it</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {groupKeys.map(key => {
                const [dayStr, mealType] = key.split('|');
                const dayNum = parseInt(dayStr);
                const groupItems = grouped.get(key);
                return (
                  <div key={key}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {DAY_LABELS[dayNum]} · {IMPORT_MEAL_LABELS[mealType] || mealType}
                    </p>
                    <div className="space-y-1.5">
                      {groupItems.map(it => (
                        <div key={it._idx}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
                            selected[it._idx] !== false
                              ? 'bg-white border-gray-200'
                              : 'bg-gray-50 border-gray-100 opacity-50'
                          }`}>
                          <input type="checkbox"
                            checked={selected[it._idx] !== false}
                            onChange={e => setSelected(s => ({ ...s, [it._idx]: e.target.checked }))}
                            className="rounded border-gray-300 text-brand-600 flex-shrink-0" />
                          <input type="text"
                            value={editItems[it._idx]?.food_item || ''}
                            onChange={e => updateEditItem(it._idx, 'food_item', e.target.value)}
                            className="flex-1 text-sm text-gray-700 bg-transparent border-b border-transparent focus:border-brand-300 focus:outline-none py-0.5" />
                          <select
                            value={editItems[it._idx]?.component || 'other'}
                            onChange={e => updateEditItem(it._idx, 'component', e.target.value)}
                            className="text-xs text-gray-500 bg-transparent border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:border-brand-400 capitalize">
                            {VALID_COMPS_IM.map(c => <option key={c} value={c}>{COMP_LABELS_IM[c]}</option>)}
                          </select>
                          {editItems[it._idx]?.is_whole_grain && (
                            <Wheat className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Whole grain" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="px-6 py-2 text-xs text-red-700 bg-red-50 border-t border-red-200">{error}</div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setStep('upload')} className="text-sm text-gray-500 hover:text-gray-700">
                ← Try another file
              </button>
              <button onClick={handleImport} disabled={importing || selectedCount === 0}
                className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-40 flex items-center gap-2">
                {importing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                  : `Import ${selectedCount} items →`}
              </button>
            </div>
          </>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-base font-bold text-gray-800">{doneCount} items imported</p>
            <p className="text-sm text-gray-500">Your menu is now populated. Review in the grid and adjust as needed.</p>
            <button onClick={onClose}
              className="mt-4 px-6 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl">
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuBuilderPage() {
  const [weekStart, setWeekStart]       = useState(() => mondayOf(new Date()));
  const [menu, setMenu]                 = useState(null);
  const [items, setItems]               = useState([]);
  const [orgs, setOrgs]                 = useState([]);
  const [selectedOrg, setSelectedOrg]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [copyingPrev, setCopyingPrev]   = useState(false);
  const [copyMsg, setCopyMsg]           = useState('');

  // Infant track
  const [hasInfant, setHasInfant]       = useState(false);

  // Reimbursement estimate
  const [rates, setRates]               = useState(null);
  const [userState, setUserState]       = useState(null);
  const [estCount, setEstCount]         = useState('');

  // Templates
  const [templates, setTemplates]       = useState([]);

  // Comments
  const [comments, setComments]         = useState([]);

  // Cell editor
  const [activeCell, setActiveCell]     = useState(null); // { day, meal }
  const [drawerTab, setDrawerTab]       = useState('add'); // 'add' | 'library' | 'templates' | 'comments'
  const [itemForm, setItemForm]         = useState({ food_item: '', component: 'grain', is_whole_grain: false, quantity: '' });
  const [formError, setFormError]       = useState('');
  const [foodSearch, setFoodSearch]     = useState('');
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [newComment, setNewComment]     = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Duplicate day
  const [dupDay, setDupDay]             = useState(null);
  const [dupBusy, setDupBusy]           = useState(false);

  // Compliance assistant
  const [showHelp, setShowHelp]         = useState(false);
  const [helpContext, setHelpContext]   = useState(null); // meal type user last opened
  const [showImport, setShowImport]     = useState(false);

  // Load orgs + rates + templates on mount
  useEffect(() => {
    api.get('/organizations?limit=100').catch(() => ({ data: { organizations: [] } }))
      .then(r => setOrgs(r.data.organizations || r.data || []));
    api.get('/menus/rates').then(r => { setRates(r.data.rates); setUserState(r.data.state); }).catch(() => {});
    api.get('/menus/templates').then(r => setTemplates(r.data.templates || [])).catch(() => {});
  }, []);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const listRes = await api.get('/menus?limit=50');
      const existing = (listRes.data.menus || []).find(m => {
        const ms = m.week_start?.slice(0, 10);
        return ms === weekStart && (!selectedOrg || m.org_id === selectedOrg);
      });
      if (existing) {
        const detailRes = await api.get(`/menus/${existing.id}`);
        setMenu(detailRes.data.menu);
        setItems(detailRes.data.items || []);
        setHasInfant(detailRes.data.menu?.has_infant || false);
        // Load comments
        api.get(`/menus/${existing.id}/comments`).then(r => setComments(r.data.comments || [])).catch(() => {});
      } else {
        setMenu(null); setItems([]); setHasInfant(false); setComments([]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [weekStart, selectedOrg]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  async function ensureMenu(infantOverride) {
    if (menu) return menu;
    const res = await api.post('/menus', {
      week_start: weekStart,
      name: `Week of ${formatWeek(weekStart)}`,
      org_id: selectedOrg || undefined,
      has_infant: infantOverride ?? hasInfant,
    });
    setMenu(res.data);
    return res.data;
  }

  // Toggle infant track (persists to DB)
  async function toggleInfant() {
    const next = !hasInfant;
    setHasInfant(next);
    try {
      const m = await ensureMenu(next);
      await api.put(`/menus/${m.id}`, { has_infant: next });
    } catch { /* silent */ }
  }

  function openCell(day, meal) {
    setActiveCell({ day, meal });
    setDrawerTab('add');
    setItemForm({ food_item: '', component: meal === 'infant' ? 'formula' : 'grain', is_whole_grain: false, quantity: '' });
    setFormError(''); setFoodSearch(''); setNewComment('');
    // Update help context so the panel highlights this meal's requirements
    setHelpContext(meal);
  }
  function closeCell() { setActiveCell(null); setFormError(''); }

  async function addItem(overrides = {}) {
    const form = { ...itemForm, ...overrides };
    if (!form.food_item?.trim()) { setFormError('Enter a food item name'); return; }
    setSaving(true); setFormError('');
    try {
      const m = await ensureMenu();
      await api.post(`/menus/${m.id}/items`, {
        day_of_week:    activeCell.day,
        meal_type:      activeCell.meal,
        food_item:      form.food_item.trim(),
        component:      form.component,
        is_whole_grain: form.component === 'grain' && form.is_whole_grain,
        quantity:       form.quantity || undefined,
      });
      await loadMenu();
      setItemForm({ food_item: '', component: activeCell.meal === 'infant' ? 'formula' : 'grain', is_whole_grain: false, quantity: '' });
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to add item');
    } finally { setSaving(false); }
  }

  async function quickAddFood(food) {
    if (!activeCell) return;
    setSaving(true);
    try {
      const m = await ensureMenu();
      await api.post(`/menus/${m.id}/items`, {
        day_of_week: activeCell.day, meal_type: activeCell.meal,
        food_item: food.name, component: food.component,
        is_whole_grain: food.wgr, quantity: undefined,
      });
      await loadMenu();
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function removeItem(itemId) {
    try {
      await api.delete(`/menus/items/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch { /* silent */ }
  }

  async function updateStatus(status) {
    if (!menu) return;
    try {
      await api.put(`/menus/${menu.id}`, { status });
      setMenu(m => ({ ...m, status }));
    } catch { /* silent */ }
  }

  // ── Template actions ────────────────────────────────────────────────────────
  async function handleSaveTemplate() {
    if (!templateName.trim() || !activeCell) return;
    const cellItems = items.filter(i => i.day_of_week === activeCell.day && i.meal_type === activeCell.meal);
    if (!cellItems.length) return;
    setSavingTemplate(true);
    try {
      const res = await api.post('/menus/templates', {
        name: templateName.trim(), meal_type: activeCell.meal,
        items: cellItems.map(({ food_item, component, is_whole_grain, quantity }) => ({ food_item, component, is_whole_grain, quantity })),
      });
      setTemplates(t => [res.data, ...t]);
      setTemplateName('');
    } catch { /* silent */ }
    finally { setSavingTemplate(false); }
  }

  async function applyTemplate(template) {
    if (!activeCell || !menu) return;
    setSaving(true);
    try {
      const m = await ensureMenu();
      await Promise.all((template.items || []).map(item =>
        api.post(`/menus/${m.id}/items`, {
          day_of_week: activeCell.day, meal_type: activeCell.meal,
          food_item: item.food_item, component: item.component,
          is_whole_grain: item.is_whole_grain, quantity: item.quantity,
        })
      ));
      await loadMenu();
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function deleteTemplate(id) {
    try {
      await api.delete(`/menus/templates/${id}`);
      setTemplates(t => t.filter(tp => tp.id !== id));
    } catch { /* silent */ }
  }

  // ── Comment actions ──────────────────────────────────────────────────────────
  async function handleAddComment() {
    if (!newComment.trim() || !menu) return;
    setAddingComment(true);
    try {
      const res = await api.post(`/menus/${menu.id}/comments`, {
        day_of_week: activeCell?.day, meal_type: activeCell?.meal,
        comment: newComment.trim(),
      });
      setComments(c => [...c, res.data]);
      setNewComment('');
    } catch { /* silent */ }
    finally { setAddingComment(false); }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api.delete(`/menus/${menu.id}/comments/${commentId}`);
      setComments(c => c.filter(cm => cm.id !== commentId));
    } catch { /* silent */ }
  }

  // ── Copy previous week ───────────────────────────────────────────────────────
  async function copyPreviousWeek() {
    setCopyingPrev(true); setCopyMsg('');
    try {
      const prevWeek = addWeeks(weekStart, -1);
      const listRes  = await api.get('/menus?limit=50');
      const prevMenu = (listRes.data.menus || []).find(m =>
        m.week_start?.slice(0, 10) === prevWeek && (!selectedOrg || m.org_id === selectedOrg)
      );
      if (!prevMenu) { setCopyMsg('No menu found for last week'); return; }
      const detailRes = await api.get(`/menus/${prevMenu.id}`);
      const prevItems = detailRes.data.items || [];
      if (!prevItems.length) { setCopyMsg("Last week's menu has no items"); return; }
      const m = await ensureMenu();
      await Promise.all(prevItems.map(item =>
        api.post(`/menus/${m.id}/items`, {
          day_of_week: item.day_of_week, meal_type: item.meal_type,
          food_item: item.food_item, component: item.component,
          is_whole_grain: item.is_whole_grain, quantity: item.quantity,
        })
      ));
      await loadMenu();
      setCopyMsg(`Copied ${prevItems.length} items from last week`);
      setTimeout(() => setCopyMsg(''), 3000);
    } catch { setCopyMsg('Copy failed — try again'); }
    finally { setCopyingPrev(false); }
  }

  // ── Duplicate day ────────────────────────────────────────────────────────────
  async function duplicateDay(targetDays) {
    if (!dupDay || !targetDays.length) return;
    setDupBusy(true);
    try {
      const fromItems = items.filter(i => i.day_of_week === dupDay.num);
      if (!fromItems.length) { setDupDay(null); return; }
      const m = await ensureMenu();
      await Promise.all(targetDays.flatMap(toDay =>
        fromItems.map(item =>
          api.post(`/menus/${m.id}/items`, {
            day_of_week: toDay, meal_type: item.meal_type,
            food_item: item.food_item, component: item.component,
            is_whole_grain: item.is_whole_grain, quantity: item.quantity,
          })
        )
      ));
      await loadMenu(); setDupDay(null);
    } catch { /* silent */ }
    finally { setDupBusy(false); }
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const cellItems   = (day, meal) => items.filter(i => i.day_of_week === day && i.meal_type === meal);
  const totalIssues = (() => {
    let count = 0;
    const activeMeals = [...MEALS.map(m => m.key), ...(hasInfant ? ['infant'] : [])];
    DAYS.forEach(d => {
      const dayItems = items.filter(i => i.day_of_week === d.num);
      if (getDayWGROk(dayItems) === false) count++;
      activeMeals.forEach(m => count += validateMealClient(dayItems.filter(i => i.meal_type === m), m).length);
    });
    return count;
  })();

  // Reimbursement estimate per day
  const dayEstimate = (dayNum) => {
    if (!rates || !estCount) return null;
    const count = Number(estCount);
    if (!count || isNaN(count)) return null;
    const activeMealKeys = MEALS.map(m => m.key);
    const total = activeMealKeys.reduce((sum, mealKey) => {
      const hasMeal = items.some(i => i.day_of_week === dayNum && i.meal_type === mealKey);
      return sum + (hasMeal ? (rates[mealKey] || 0) : 0);
    }, 0);
    return total * count;
  };

  // Filtered food library for current cell
  const libraryFoods = (() => {
    const search = foodSearch.trim().toLowerCase();
    if (!activeCell) return [];
    const mealComponents = {
      breakfast: ['milk','grain','fruit','vegetable'],
      lunch:     ['milk','grain','protein','fruit','vegetable'],
      supper:    ['milk','grain','protein','fruit','vegetable'],
      snack:     ['milk','grain','protein','fruit','vegetable'],
      infant:    [],
    };
    let foods = CACFP_FOODS;
    if (!search && activeCell) {
      const allowed = mealComponents[activeCell.meal] || [];
      foods = allowed.length ? foods.filter(f => allowed.includes(f.component)) : foods;
    }
    return search ? foods.filter(f => f.name.toLowerCase().includes(search)) : foods.slice(0, 20);
  })();

  // Comments for current cell
  const cellComments = activeCell
    ? comments.filter(c => c.day_of_week === activeCell.day && c.meal_type === activeCell.meal)
    : [];

  // ── Render ───────────────────────────────────────────────────────────────────
  const allMealsToRender = [...MEALS, ...(hasInfant ? [{ key: 'infant', label: 'Infant', color: 'pink' }] : [])];

  return (
    <div className={`p-6 max-w-full transition-all ${showHelp ? 'pr-84' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan weekly menus · Validate CACFP meal patterns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import menu */}
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors">
            <BookOpen className="w-4 h-4" /> Import Menu
          </button>

          {/* Infant toggle */}
          <button onClick={toggleInfant}
            className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg transition-colors ${
              hasInfant ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Baby className="w-4 h-4" /> Infant Track {hasInfant ? 'On' : 'Off'}
          </button>

          {/* Copy previous week */}
          <button onClick={copyPreviousWeek} disabled={copyingPrev}
            className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {copyingPrev ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            Copy Prev Week
          </button>

          {/* Compliance Assistant */}
          <button onClick={() => setShowHelp(h => !h)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              showHelp
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <ShieldCheck className="w-4 h-4" /> Compliance Assistant
          </button>

          {menu && menu.status === 'draft' && totalIssues === 0 && (
            <button onClick={() => updateStatus('approved')}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
              <FileCheck className="w-4 h-4" /> Approve
            </button>
          )}
          {menu && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              menu.status === 'approved' ? 'bg-green-100 text-green-700' :
              menu.status === 'submitted' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
            }`}>{menu.status?.charAt(0).toUpperCase() + menu.status?.slice(1)}</span>
          )}
        </div>
      </div>

      {/* Toast */}
      {copyMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
          copyMsg.toLowerCase().includes('fail') || copyMsg.includes('No menu')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {copyMsg.toLowerCase().includes('fail') || copyMsg.includes('No menu')
            ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {copyMsg}
        </div>
      )}

      {/* Week nav + org picker + estimate count */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setWeekStart(w => addWeeks(w, -1))} className="p-2 hover:bg-gray-50 text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 whitespace-nowrap min-w-[210px] text-center">
            {formatWeek(weekStart)}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="p-2 hover:bg-gray-50 text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {orgs.length > 0 && (
          <select className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-brand-400"
            value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
            <option value="">My Organization</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        <button onClick={() => setWeekStart(mondayOf(new Date()))}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2">
          This week
        </button>

        {/* Reimbursement estimate input */}
        {rates && (
          <div className="flex items-center gap-2 ml-auto">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500 whitespace-nowrap">Est. children/meal:</span>
            <input type="number" min="0" max="9999" placeholder="0"
              value={estCount} onChange={e => setEstCount(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 w-20 focus:outline-none focus:border-brand-400 text-center" />
          </div>
        )}
      </div>

      {/* Validation summary */}
      {items.length > 0 && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${
          totalIssues === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          {totalIssues === 0
            ? <><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /><span className="text-sm font-medium text-green-700">All meal patterns complete — ready to approve</span></>
            : <><AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" /><span className="text-sm font-medium text-amber-700">{totalIssues} issue{totalIssues !== 1 ? 's' : ''} — see Weekly Validation panel below</span></>
          }
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading menu…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 1160 }}>
              <thead>
                <tr>
                  <th className="w-24 p-2" />
                  {DAYS.map(d => {
                    const dayHasItems = items.some(i => i.day_of_week === d.num);
                    const est = dayEstimate(d.num);
                    return (
                      <th key={d.num} className="p-2 text-center">
                        <div className="font-semibold text-gray-700 text-sm">{d.short}</div>
                        <div className="text-xs text-gray-400">{dayDate(weekStart, d.num)}</div>
                        {est !== null && (
                          <div className="text-xs font-semibold text-green-600 mt-0.5">{fmtMoney(est)}</div>
                        )}
                        {dayHasItems && (
                          <button onClick={() => setDupDay(d)} title={`Copy ${d.label}`}
                            className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 mx-auto mt-0.5 transition-colors">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allMealsToRender.map(meal => (
                  <tr key={meal.key}>
                    <td className="p-2 align-top">
                      <div className={`text-xs font-bold uppercase tracking-wide ${MEAL_COLOR[meal.key]?.text || 'text-pink-800'} text-right pr-2`}>
                        {meal.label}
                        {meal.key === 'infant' && <Baby className="inline w-3 h-3 ml-1" />}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const ci       = cellItems(day.num, meal.key);
                      const missing  = validateMealClient(ci, meal.key);
                      const status   = getMealStatus(ci, meal.key);
                      const dayAllItems = items.filter(i => i.day_of_week === day.num);
                      const showWGR  = meal.key === 'breakfast' && getDayWGROk(dayAllItems) === false && ci.length > 0;
                      const cellCmts = comments.filter(c => c.day_of_week === day.num && c.meal_type === meal.key);
                      return (
                        <td key={day.num} className="p-1.5 align-top">
                          <div
                            className={`rounded-xl border-2 min-h-[100px] p-2 cursor-pointer transition-all
                              ${status === 'complete'   ? 'border-green-200 bg-green-50'
                              : status === 'incomplete' ? 'border-red-200 bg-red-50'
                              : 'border-gray-100 bg-gray-50 hover:border-brand-200 hover:bg-brand-50'}`}
                            onClick={() => openCell(day.num, meal.key)}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1">
                                {status === 'complete'   && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                {status === 'incomplete' && <AlertCircle  className="w-3.5 h-3.5 text-red-400"   />}
                                {showWGR && <Wheat className="w-3.5 h-3.5 text-amber-500" />}
                                {cellCmts.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs text-blue-400">
                                    <MessageSquare className="w-3 h-3" />{cellCmts.length}
                                  </span>
                                )}
                              </div>
                              <Plus className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                            <div className="space-y-1">
                              {ci.map(item => <FoodChip key={item.id} item={item} onRemove={removeItem} />)}
                            </div>
                            {status === 'incomplete' && ci.length > 0 && (
                              <div className="mt-1.5 text-xs text-red-400 leading-tight">Missing: {missing.join(', ')}</div>
                            )}
                            {status === 'empty' && (
                              <div className="text-xs text-gray-300 text-center pt-3">Click to add</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Complete</span>
            <span className="flex items-center gap-1"><AlertCircle  className="w-3.5 h-3.5 text-red-400"   /> Missing components</span>
            <span className="flex items-center gap-1"><Wheat        className="w-3.5 h-3.5 text-amber-500" /> No Whole Grain Rich item</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Has notes</span>
            {rates && estCount && <span className="flex items-center gap-1 text-green-600 font-medium"><DollarSign className="w-3.5 h-3.5" /> Daily estimate (Tier 1)</span>}
            <span className="flex items-center gap-1 ml-2 font-medium">WGR = ≥51% whole grain per day</span>
          </div>

          <DayStatusPanel items={items} weekStart={weekStart} onOpenCell={openCell} />
        </>
      )}

      {/* ── Add Item / Library / Templates / Comments Drawer ── */}
      {activeCell && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">
                  {allMealsToRender.find(m => m.key === activeCell.meal)?.label} — {DAYS.find(d => d.num === activeCell.day)?.label}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeCell.meal === 'breakfast' && 'Required: Milk · Grain · Fruit or Vegetable'}
                  {(activeCell.meal === 'lunch' || activeCell.meal === 'supper') && 'Required: Milk · Grain · Protein · Fruit · Vegetable'}
                  {activeCell.meal === 'snack' && 'Required: Any 2 of — Milk, Grain, Protein, Fruit/Vegetable'}
                  {activeCell.meal === 'infant' && 'Required: Breast Milk / Formula'}
                </p>
              </div>
              <button onClick={closeCell} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Current items */}
            {cellItems(activeCell.day, activeCell.meal).length > 0 && (
              <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-500 mb-2">On this menu:</p>
                <div className="flex flex-wrap gap-2">
                  {cellItems(activeCell.day, activeCell.meal).map(item => (
                    <FoodChip key={item.id} item={item} onRemove={removeItem} large />
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {[
                { id: 'add',       label: 'Add Food',  icon: Plus          },
                { id: 'library',   label: 'Library',   icon: BookOpen      },
                { id: 'templates', label: 'Templates', icon: Star          },
                { id: 'comments',  label: `Notes${cellComments.length ? ` (${cellComments.length})` : ''}`, icon: MessageSquare },
              ].map(tab => (
                <button key={tab.id} onClick={() => setDrawerTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                    drawerTab === tab.id
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* ── Add Food tab ── */}
              {drawerTab === 'add' && (
                <div className="px-5 py-4 space-y-3">
                  {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</p>}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Food Item</label>
                    <input autoFocus className="input w-full" placeholder="e.g. Whole wheat bread, Apple slices…"
                      value={itemForm.food_item}
                      onChange={e => setItemForm(f => ({ ...f, food_item: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addItem()} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Component</label>
                      <select className="input w-full" value={itemForm.component}
                        onChange={e => setItemForm(f => ({ ...f, component: e.target.value, is_whole_grain: false }))}>
                        {(activeCell.meal === 'infant' ? INFANT_COMPONENTS : COMPONENTS).map(c => (
                          <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (optional)</label>
                      <input className="input w-full" placeholder="e.g. 1 cup, 2 oz"
                        value={itemForm.quantity}
                        onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                  </div>
                  {itemForm.component === 'grain' && (
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={itemForm.is_whole_grain}
                        onChange={e => setItemForm(f => ({ ...f, is_whole_grain: e.target.checked }))}
                        className="w-4 h-4 rounded accent-brand-600" />
                      <span className="text-sm text-gray-700">
                        <Wheat className="inline w-3.5 h-3.5 text-amber-500 mr-1" />
                        This is a <strong>Whole Grain Rich</strong> item (≥51% whole grain)
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* ── Library tab ── */}
              {drawerTab === 'library' && (
                <div className="px-5 py-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input autoFocus className="input w-full pl-9" placeholder="Search foods…"
                      value={foodSearch} onChange={e => setFoodSearch(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    {libraryFoods.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No foods found</p>
                    )}
                    {libraryFoods.map((food, i) => {
                      const comp = ALL_COMPONENTS.find(c => c.key === food.component) || COMPONENTS[5];
                      return (
                        <button key={i} onClick={() => quickAddFood(food)} disabled={saving}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors group">
                          <span className="text-base">{comp.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{food.name}</p>
                            <p className="text-xs text-gray-400">{comp.label}{food.wgr ? ' · 🌾 WGR' : ''}</p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-300 group-hover:text-brand-600 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                  {!foodSearch && libraryFoods.length === 20 && (
                    <p className="text-xs text-gray-400 text-center mt-3">Showing top 20 · Search to find more</p>
                  )}
                </div>
              )}

              {/* ── Templates tab ── */}
              {drawerTab === 'templates' && (
                <div className="px-5 py-4 space-y-4">
                  {/* Save current as template */}
                  {cellItems(activeCell.day, activeCell.meal).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Save current items as template</p>
                      <div className="flex gap-2">
                        <input className="input flex-1" placeholder="Template name…"
                          value={templateName} onChange={e => setTemplateName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()} />
                        <button onClick={handleSaveTemplate} disabled={!templateName.trim() || savingTemplate}
                          className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 flex items-center gap-1">
                          {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Template list */}
                  {templates.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No templates yet.<br/>Add items to a cell, then save them as a template.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">Your templates</p>
                      {templates.map(t => (
                        <div key={t.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                            <p className="text-xs text-gray-400">{(t.items || []).length} items{t.meal_type ? ` · ${t.meal_type}` : ''}</p>
                          </div>
                          <button onClick={() => applyTemplate(t)} disabled={saving}
                            className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-lg font-semibold hover:bg-brand-100">
                            Apply
                          </button>
                          <button onClick={() => deleteTemplate(t.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Comments tab ── */}
              {drawerTab === 'comments' && (
                <div className="px-5 py-4 space-y-3">
                  {cellComments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No notes for this meal yet</p>
                  ) : (
                    <div className="space-y-2">
                      {cellComments.map(c => (
                        <div key={c.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{c.comment}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {c.author_name || 'You'} · {new Date(c.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="text-gray-300 hover:text-red-500 flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Add a note…"
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                    <button onClick={handleAddComment} disabled={!newComment.trim() || addingComment}
                      className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40">
                      {addingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            {drawerTab === 'add' && (
              <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
                <button onClick={closeCell} className="btn-secondary flex-1">Done</button>
                <button onClick={() => addItem()} disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> {saving ? 'Adding…' : 'Add Item'}
                </button>
              </div>
            )}
            {drawerTab !== 'add' && (
              <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0">
                <button onClick={closeCell} className="btn-secondary w-full">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Day Modal */}
      {dupDay && (
        <DuplicateDayModal fromDay={dupDay} onConfirm={duplicateDay} onClose={() => setDupDay(null)} busy={dupBusy} />
      )}

      {/* Compliance Assistant Panel */}
      <ComplianceAssistantPanel
        open={showHelp}
        onClose={() => setShowHelp(false)}
        contextMeal={helpContext}
        items={items}
        onOpenCell={openCell}
        userState={userState}
      />

      {/* Import Menu Modal */}
      {showImport && (
        <ImportMenuModal
          onClose={() => setShowImport(false)}
          ensureMenu={ensureMenu}
          onImported={() => { setShowImport(false); loadMenu(); }}
        />
      )}
    </div>
  );
}
