import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LeadData {
  name: string;
  address?: string;
  phone?: string;
  websiteUri?: string;
  careers?: string[];
  reviewMentions?: string[];
  expansionSignals?: string[];
  aiScore?: number;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').toLowerCase();
}

const careerKeywords = ['career', 'job', 'join our team', 'employment', 'vacancies', 'open positions', 'we are hiring'];
const expansionKeywords = ['opening a new location', 'we are hiring', 'now hiring', 'expanding our offices', 'relocating headquarters'];
const reviewKeywords = ['dirty office', 'unclean', 'cleaning', 'janitorial', 'facilities', 'maintenance', 'reviews'];

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    return data;
  } catch (err) {
    console.warn(`Failed to fetch ${url}:`, err);
    return null;
  }
}

async function extractCareersLinks($: cheerio.CheerioAPI, baseUrl: string): Promise<string[]> {
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text() || '';
    const normalizedText = normalizeText(text);
    const normalizedHref = normalizeText(href);

    // Match keywords in either the link text or URL
    if (careerKeywords.some(k => normalizedText.includes(k) || normalizedHref.includes(k))) {
      const url = new URL(href, baseUrl).toString();
      links.push(url);
    }
  });
  return Array.from(new Set(links)); // remove duplicates
}

export async function enrichLead(lead: any): Promise<any> {
  if (!lead.websiteUri) return lead;

  const careers: string[] = [];
  const reviewMentions: string[] = [];
  const expansionSignals: string[] = [];

  const homepageHtml = await fetchHtml(lead.websiteUri);
  if (!homepageHtml) return lead;

  const $ = cheerio.load(homepageHtml);
  const bodyText = normalizeText($('body').text());

  // Scan homepage for expansion signals & review mentions
  expansionKeywords.forEach(kw => { if (bodyText.includes(kw)) expansionSignals.push(kw); });
  reviewKeywords.forEach(kw => { if (bodyText.includes(kw)) reviewMentions.push(kw); });

  // Find potential careers pages and scrape them
  const careerLinks = await extractCareersLinks($, lead.websiteUri);
  for (const link of careerLinks) {
    const careerHtml = await fetchHtml(link);
    if (!careerHtml) continue;

    const $career = cheerio.load(careerHtml);
    $career('a, li, p, span, h1, h2, h3, h4').each((_, el) => {
      const text = normalizeText($career(el).text());
      if (careerKeywords.some(k => text.includes(k))) careers.push($career(el).text().trim());
    });
  }

  // Optional: parse JSON-LD structured data for jobs / hiring info
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      if (json['@type'] === 'JobPosting') {
        careers.push(json.title || 'Job Posting');
      }
    } catch {}
  });

  return {
    ...lead,
    careers: Array.from(new Set(careers)),
    reviewMentions: Array.from(new Set(reviewMentions)),
    expansionSignals: Array.from(new Set(expansionSignals)),
  };
}

/**
 * Optional: AI scoring function (placeholder)
 * You can replace this with a call to OpenAI / LLM
 */
export async function scoreLead(lead: LeadData): Promise<LeadData> {
  // Example: very simple scoring logic
  let score = 0;

  if (lead.careers?.length) score += 5;
  if (lead.reviewMentions?.length) score += 8;
  if (lead.expansionSignals?.length) score += 10;

  return { ...lead, aiScore: score };
}

/**
 * Enrich and score a list of leads
 */
export async function processLeads(leads: LeadData[]): Promise<LeadData[]> {
  const enriched = await Promise.all(leads.map(enrichLead));
  const scored = await Promise.all(enriched.map(scoreLead));
  return scored;
}

const testObject: any = [
   
]
import { pathToFileURL } from "url";

/**
 * Standalone runner (only executes when run directly with ts-node)
 * Run with 'node --loader ts-node/esm ./src/lib/web-scraper/web-scraper.ts'
 */
async function main() {
  console.log("Enriching leads...");
  const results = await enrichLead(testObject[12] as any);
  console.log("Results:", JSON.stringify(results, null, 2));
}

// ✅ ESM-safe check
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Error running scraper:", err);
    process.exit(1);
  });
}


