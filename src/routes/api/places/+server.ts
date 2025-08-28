import type { RequestHandler } from './$types';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

function buildPhotoUrl(photoName: string, maxWidth = 400) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { textQuery } = await request.json();

    if (!textQuery) {
      return new Response(JSON.stringify({ error: 'textQuery is required' }), {
        status: 400
      });
    }

    // Call Google Places API
    const response = await fetch(GOOGLE_PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.priceLevel,places.nationalPhoneNumber,places.generativeSummary,places.location,places.photos'
      },
      body: JSON.stringify({ textQuery })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: 'Google API error', details: errorText }),
        { status: 500 }
      );
    }

    const data = await response.json();

    // Attach photoUrls for convenience
    const enhanced = {
      places: data.places?.map((p: any) => ({
        ...p,
        photoUrls: p.photos?.map((ph: any) => buildPhotoUrl(ph.name)) ?? []
      }))
    };

    return new Response(JSON.stringify(enhanced), { status: 200 });
  } catch (err) {
    console.error('Unexpected error in /api/places:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error' }),
      { status: 500 }
    );
  }
};
