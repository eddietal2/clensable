// /src/routes/api/leads/+server.ts
import type { RequestHandler } from './$types';
import { scoreLead } from '$lib/lead-scoring/scoring';
import type { Lead } from '$lib/lead-scoring/scoring';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

interface PlacesResult {
  displayName: string;
  formattedAddress: string;
  // add more fields as needed from Google Places
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { zip, radius, category } = await request.json();

    // Basic validation
    if (!zip || !radius || !category) {
      return new Response(
        JSON.stringify({ error: 'zip, radius, and category are required' }),
        { status: 400 }
      );
    }

    // Call Google Places API
    const response = await fetch(GOOGLE_PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.priceLevel'
      },
      body: JSON.stringify({
        textQuery: `${category} near ${zip} within ${radius} miles`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: 'Google API error', details: errorText }),
        { status: 500 }
      );
    }

    const data = await response.json();
    const places: PlacesResult[] = data.places ?? [];

    // Transform Google Places data into your Lead type
    const leads: Lead[] = places.map((place) => ({
      name: place.displayName,
      employees: 20, // placeholder, ideally enrich with LinkedIn/APollo/etc.
      foundedYear: 2020, // placeholder, ideally enrich
      industry: category,
      careersPageText: '', // optional, could scrape the website
      justMoved: false,
      hiringSpike: false,
      reviews: [] // optional, enrich with reviews
    }));

    // Score leads
    const scoredLeads = leads.map((lead) => ({
      lead,
      ...scoreLead(lead)
    }));

    // Optional: sort descending by score
    scoredLeads.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify(scoredLeads), { status: 200 });

  } catch (err) {
    console.error('Unexpected error in /api/leads:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error' }),
      { status: 500 }
    );
  }
};
