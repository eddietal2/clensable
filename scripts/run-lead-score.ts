import { scoreLead } from '../src/lib/lead-scoring/scoring';
import type { Lead } from '../src/lib/lead-scoring/scoring';

const lead: Lead = {
  name: "Acme Co",
  employees: 30,
  foundedYear: 2021,
  industry: "Software",
  careersPageText: "We're hiring a software engineer"
};

const { score, reasons } = scoreLead(lead);

console.log('Lead:', lead);
console.log('Score:', score);
console.log('Reasons:', reasons);
