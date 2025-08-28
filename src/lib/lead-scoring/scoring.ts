// scoring.ts
import rawSchema from './schema.json';

export interface Lead {
  name: string;
  employees: number;
  foundedYear: number;
  industry: string;
  justMoved?: boolean;
  hiringSpike?: boolean;
  reviews?: string[];
  careersPageText?: string;
  [key: string]: any;
}

export interface ScoreResult {
  score: number;
  reasons: string[];
}

interface Rule {
  field: string;
  condition: 'lessThan' | 'greaterThan' | 'includes' | 'regex' | 'equals';
  value: any;
  points: number;
  reason: string;
}

interface ScoringSchema {
  rules: Rule[];
}

const scoringSchema: ScoringSchema = rawSchema as ScoringSchema;

/**
 * Calculates the lead score based on the scoring schema.
 */
export function scoreLead(lead: Lead): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  for (const rule of scoringSchema.rules) {
    const { field, condition, value, points, reason } = rule;
    const leadValue = lead[field];

    let match = false;

    switch (condition) {
      case 'lessThan':
        if (typeof leadValue === 'number' && typeof value === 'number') {
          match = leadValue < value;
        }
        break;
      case 'greaterThan':
        if (typeof leadValue === 'number' && typeof value === 'number') {
          match = leadValue > value;
        }
        break;
      case 'includes':
        if (Array.isArray(leadValue)) {
          match = leadValue.includes(value);
        }
        break;
      case 'regex':
        if (leadValue !== undefined && leadValue !== null) {
          match = new RegExp(String(value), 'i').test(String(leadValue));
        }
        break;
      case 'equals':
        match = leadValue === value;
        break;
      default:
        console.warn(`Unknown condition "${condition}" in scoring schema`);
    }

    if (match) {
      score += points;
      reasons.push(reason);
    }
  }

  return { score, reasons };
}
