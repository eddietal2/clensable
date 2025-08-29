<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { greenGradient, grayGradient, buttonBase } from '$lib/styles';
  import { currentCampaign } from '$lib/stores/campaign';
  import { get } from 'svelte/store';

  type Campaign = {
    id: string;
    name: string;
    targetZip: string;
    radius: number;
    category: string;
  };

  type Lead = {
    name: string;
    address: string;
    phone?: string;
    score?: number;
    status: string;
    photoUrl?: string;
  };

  let campaigns: Campaign[] = [];
  let selectedCampaign: Campaign | null = null;

  let leads: Lead[] = [];
  let currentPage = 1;
  const leadsPerPage = 10;

  let paginatedLeads: Lead[] = [];
  let totalPages = 1;
  let visiblePages: (number | string)[] = [];
  let loading = false;

  // Fetch campaigns
  async function fetchCampaigns() {
    const res = await fetch('/api/campaigns');
    campaigns = await res.json();

    // If store has a campaign, set selectedCampaign
    const storeCampaign = get(currentCampaign);
    if (storeCampaign) {
      const c = campaigns.find(c => c.id === storeCampaign.id);
      if (c) fetchLeads(c);
    }
  }

  // Fetch leads for a campaign
  async function fetchLeads(campaign: Campaign) {
    selectedCampaign = campaign;
    currentPage = 1;
    leads = [];
    loading = true;

    // Update store so layout dropdown stays in sync
    currentCampaign.set({ id: campaign.id, name: campaign.name });

    // simulate network delay
    await new Promise(r => setTimeout(r, 500));

    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textQuery: `${campaign.category} near ${campaign.targetZip} within ${campaign.radius} miles`
      })
    });

    const data = await res.json();
    leads = data.places.map((p: any) => ({
      name: p.displayName?.text ?? 'Unknown',
      address: p.formattedAddress ?? '',
      phone: p.nationalPhoneNumber,
      status: 'New',
      score: Math.floor(Math.random() * 30),
      photoUrl: p.photoUrls?.[0]
    }));

    updatePagination();
    loading = false;
    scrollToTop();
  }

  // Pagination
  function updatePagination() {
    totalPages = Math.ceil(leads.length / leadsPerPage);
    paginatedLeads = leads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

    const pages: (number | string)[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    if (totalPages >= 1) pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    visiblePages = pages;
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePagination();
      scrollToTop();
    }
  }

  function nextPage() { goToPage(currentPage + 1); }
  function prevPage() { goToPage(currentPage - 1); }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function moveToOutreach(lead: Lead) {
    alert(`Lead ${lead.name} added to Outreach for ${selectedCampaign?.name}`);
  }

  // Subscribe to currentCampaign store changes (layout dropdown)
  const unsubscribe = currentCampaign.subscribe(storeCampaign => {
    if (!storeCampaign) return;
    const c = campaigns.find(c => c.id === storeCampaign.id);
    if (c && (!selectedCampaign || c.id !== selectedCampaign.id)) {
      fetchLeads(c);
    }
  });

  onMount(fetchCampaigns);
  onDestroy(() => unsubscribe());
</script>


<main class="flex flex-col gap-6">
  {#if !selectedCampaign}
    <!-- Campaign selection (same as before) -->
    <div class="flex flex-col gap-4 mt-20 max-w-4xl mx-auto text-center">
      <h1 class="text-2xl font-semibold">Select a Campaign</h1>
        
      {#if campaigns.length === 0}
        <p class="text-gray-600">You have no campaigns yet. Create one first.</p>
        <a href="/app/campaigns/create" class={`${greenGradient} ${buttonBase} mt-4`}>Create Campaign</a>
      {:else}
        <div class="flex flex-col gap-4 mt-4">
          {#each campaigns as c}
            <button 
              class="bg-white rounded-lg shadow hover:shadow-lg p-4 cursor-pointer transition flex items-center justify-between"
              type="button"
              on:click={() => fetchLeads(c)}
            >
              <div class="flex flex-col text-left">
                <h2 class="font-semibold text-lg truncate">{c.name}</h2>
                <p class="text-gray-500 truncate">Zip: {c.targetZip}</p>
                <p class="text-gray-500 text-sm">Category: {c.category}</p>
              </div>
              <span class={`${greenGradient} text-white text-sm px-3 py-1 rounded`}>
                Select
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

  {:else}
    <div class="mt-20 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
      <!-- Page Title -->
      <h1 class="text-md">
        <span class="font-bold">Campaign</span> - {selectedCampaign.name} @ Zip Code {selectedCampaign.targetZip}
      </h1>

      <!-- Pagination -->
      <div class="flex flex-wrap justify-center items-center gap-2">
        <!-- Previous button -->
        <button
          class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
          on:click={prevPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <!-- Page numbers -->
        <div class="flex flex-wrap gap-1 justify-center">
          {#each visiblePages as page}
            {#if page === '...'}
              <span class="px-2 py-1 text-gray-400 text-sm select-none">…</span>
            {:else}
              <button
                class={`px-2 py-1 text-sm rounded-md border transition-colors duration-200
                  ${currentPage === page
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400'}
                `}
                on:click={() => goToPage(Number(page))}
              >
                {page}
              </button>
            {/if}
          {/each}
        </div>

        <!-- Next button -->
        <button
          class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
          on:click={nextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>

      <!-- Leads List / Skeleton Loader -->
      <div class="flex flex-col gap-4">
        {#if loading}
          {#each Array(5) as _}
            <div class="bg-gray-200 animate-pulse rounded-lg p-4 flex w-[1000px] h-62">
                <div class="w-48 h-48 bg-gray-300 rounded-lg mr-6 flex-shrink-0"></div>
                <div class="flex-1 space-y-4 min-w-0">
                    <div class="h-6 bg-gray-300 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-300 rounded w-5/6"></div>
                    <div class="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div class="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div class="h-8 bg-gray-300 rounded w-32 mt-4"></div>
                </div>
            </div>
          {/each}
        {:else}
          {#each paginatedLeads as lead}
            <div class="bg-white rounded-lg shadow p-4 flex items-center hover:shadow-lg transition w-[1000px]">
                <img 
                    src={lead.photoUrl ?? `data:image/svg+xml;utf8,${encodeURIComponent(`
                      <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
                        <rect width="192" height="192" fill="#e2e8f0"/>
                        <text x="50%" y="50%" font-size="20" text-anchor="middle" fill="#94a3b8" dy=".3em">No Image</text>
                      </svg>
                    `)}`}
                    alt={lead.name} 
                    class="w-48 h-48 rounded-lg object-cover mr-6 flex-shrink-0"
                />
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-lg truncate">{lead.name}</h2>
                <p class="text-gray-600 truncate">{lead.address}</p>
                {#if lead.phone}<p class="text-gray-500 text-sm truncate">{lead.phone}</p>{/if}
                <p class="mt-1 font-medium">Score: {lead.score}</p>
                <!-- <span class="mt-2 inline-block px-3 py-1 rounded bg-gray-400 text-white text-sm">{lead.status}</span> -->
              </div>
              <button class={`${greenGradient} text-white px-4 py-2 rounded ml-6 flex-shrink-0`} on:click={()=>moveToOutreach(lead)}>Add to Outreach</button>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Pagination -->
      {#if !loading && paginatedLeads.length > 0}
        <div class="flex flex-wrap justify-center items-center gap-2 mt-4">
          <!-- Previous button -->
          <button
            class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
            on:click={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
      
          <!-- Page numbers -->
          <div class="flex flex-wrap gap-1 justify-center">
            {#each visiblePages as page}
              {#if page === '...'}
                <span class="px-2 py-1 text-gray-400 text-sm select-none">…</span>
              {:else}
                <button
                  class={`px-2 py-1 text-sm rounded-md border transition-colors duration-200
                    ${currentPage === page
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400'}
                  `}
                  on:click={() => goToPage(Number(page))}
                >
                  {page}
                </button>
              {/if}
            {/each}
          </div>
      
          <!-- Next button -->
          <button
            class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
            on:click={nextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

      {/if}
    </div>
  {/if}
</main>
