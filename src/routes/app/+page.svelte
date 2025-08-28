<script lang="ts">
  import { onMount } from 'svelte';

  interface TextBlock {
    text: string;
    languageCode: string;
  }

  interface GenerativeSummary {
    disclosureText?: TextBlock;
    overview?: TextBlock;
    overviewFlagContentUri?: string;
  }

  interface Place {
    displayName: { text: string };
    formattedAddress: string;
    nationalPhoneNumber?: string;
    generativeSummary?: GenerativeSummary;
    priceLevel?: number;
    photoUrls?: string[]; // new
  }

  let places: Place[] = [];
  let errorMsg = '';
  let loading = false;

  const zip = '48134';
  const radius = 30;
  const category = 'Office Cleaning';

  async function fetchPlaces() {
    loading = true;
    errorMsg = '';
    places = [];

    const textQuery = `${category} near ${zip} within ${radius} miles`;

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textQuery })
      });

      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || 'Failed to fetch places';
        return;
      }

      const data = await res.json();
      console.log('Fetched places data:', data);

      places = data.places ?? [];
    } catch (err) {
      console.error(err);
      errorMsg = 'Unexpected error while fetching places';
    } finally {
      loading = false;
    }
  }

  onMount(fetchPlaces);
</script>

<div class="space-y-4">
  {#if loading}
    <p>Loading places...</p>
  {:else if errorMsg}
    <p class="text-red-600">{errorMsg}</p>
  {:else if places.length === 0}
    <p>No places found.</p>
  {:else}
    <ul class="space-y-6 mt-20">
      {#each places as place}
        <li class="p-4 bg-white rounded shadow">
          <h3 class="font-semibold">{place.displayName?.text}</h3>
          {#if place.photoUrls?.length}
            <img
              src={place.photoUrls[0]}
              alt={place.displayName?.text}
              class="mt-2 rounded shadow w-64"
            />
          {/if}
          <p class="text-gray-500">{place.formattedAddress}</p>
          {#if place.nationalPhoneNumber}
            <p class="text-gray-500">{place.nationalPhoneNumber}</p>
          {/if}

          {#if place.generativeSummary?.overview}
            <p class="text-gray-700 italic">
              {place.generativeSummary.overview.text}
            </p>
          {/if}
          {#if place.generativeSummary?.disclosureText}
            <p class="text-xs text-gray-400">
              {place.generativeSummary.disclosureText.text}
            </p>
          {/if}

          {#if place.priceLevel !== undefined}
            <p>Price Level: {place.priceLevel}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
