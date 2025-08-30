import { log } from 'console';
import type { RequestHandler } from './$types';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

function buildPhotoUrl(photoName: string, maxWidth = 400) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}


export const POST: RequestHandler = async ({ request }) => {
  try {
    const { textQuery } = await request.json();
    if (!textQuery) return new Response(JSON.stringify({ error: 'textQuery is required' }), { status: 400 });

    const response = await fetch(GOOGLE_PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.photos,places.websiteUri'
      },
      body: JSON.stringify({ textQuery })
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    const enhanced = (data.places ?? []).map((p: any) => ({
      ...p,
      photoUrls: p.photos?.map((ph: any) => buildPhotoUrl(ph.name)) ?? []
    }));

    return new Response(JSON.stringify({ places: enhanced }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};

/**
 * Standalone runner (only executes when run directly with ts-node)
 * Run with 'node --loader ts-node/esm ./src/lib/web-scraper/web-scraper.ts'
 */
import { pathToFileURL } from "url";

async function main() {
  let allPlaces: any[] = [];
  let pageToken: string | undefined = undefined;
  const maxResults = 60;
  
  do {

      const body: any = { textQuery: 'offices near 48134 within 30 miles' };
      if (pageToken) {
        // ✅ Wait 2 seconds before using nextPageToken
        await new Promise(resolve => setTimeout(resolve, 2000));
        body.pageToken = pageToken;
      }
      
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': "AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.photos,places.websiteUri,nextPageToken'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    // const enhanced = (data.places ?? []).map((p: any) => ({
    //   ...p,
    //   photoUrls: p.photos?.map((ph: any) => buildPhotoUrl(ph.name)) ?? []
    // }));
    allPlaces.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
  
  } while (pageToken && allPlaces.length < maxResults);


  console.log(allPlaces);
  console.log('Total fetched:', allPlaces.length);
}

// ✅ ESM-safe check
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Error running server.ts:", err);
    process.exit(1);
  });
}

