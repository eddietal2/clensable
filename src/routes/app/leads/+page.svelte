<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { greenGradient, grayGradient, buttonBase, goldText, blueGradient } from '$lib/styles';
  import { currentCampaign } from '$lib/stores/campaign';
  import { get } from 'svelte/store';
  import LeadCard from '$lib/components/dashboard/LeadCard.svelte';
  import { searchTerm } from '$lib/search-term';
  import { FileText, X } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
    import { goto } from '$app/navigation';

  // Show Info Card "What is a Lead?"
  let showIntroCard = true;

  type Campaign = {
    id: string;
    name: string;
    targetZip: string;
    radius: number;
    category: string;
  };

  type Lead = {
    name: string;
    address?: string;
    phone?: string;
    score?: number;
    status: string;
    photoUrls?: string[];
    currentPhotoIndex?: number;
    websiteUri?: string;
    generativeSummary?: {
      disclosureText: { text: string; languageCode: string };
      overview: { text: string; languageCode: string };
      overviewFlagContentUri: string;
    };
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

  async function fetchCampaigns() {
    const res = await fetch('/api/campaigns');
    campaigns = await res.json();

    const storeCampaign = get(currentCampaign);
    if (storeCampaign) {
      const c = campaigns.find(c => c.id === storeCampaign.id);
      if (c) fetchLeads(c);
    }
  }

  async function fetchLeads(campaign: Campaign) {
    selectedCampaign = campaign;
    currentPage = 1;
    leads = [];
    loading = true;

    await new Promise(r => setTimeout(r, 500));

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textQuery: `${campaign.category} near ${campaign.targetZip} within ${campaign.radius} miles`,
        maxResults: 60
      })
    });

    const data = await res.json();

    leads = data.allPlaces.map((p: any) => ({
      name: p.displayName?.text ?? 'Unknown',
      address: p.formattedAddress ?? '',
      phone: p.nationalPhoneNumber,
      websiteUri: p.websiteUri,
      generativeSummary: p.generativeSummary,
      status: 'New',
      score: Math.floor(Math.random() * 30),
      photoUrls: p.photoUrls,
      currentPhotoIndex: 0
    }));

    loading = false;
    scrollToTop();
  }

  // ----------------------------
  // Reactive search & pagination
  // ----------------------------
  // Filtered leads based on searchTerm store
  $: filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes($searchTerm.toLowerCase())
  );

  // Recalculate pagination when filteredLeads or currentPage changes
  $: {
    totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
    paginatedLeads = filteredLeads.slice(
      (currentPage - 1) * leadsPerPage,
      currentPage * leadsPerPage
    );

    // Update visible pages for pagination
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

  // Reset to first page if searchTerm changes
  $: if ($searchTerm) currentPage = 1;

  // ----------------------------
  // Update currentCampaign dynamically
  // ----------------------------
  $: if (selectedCampaign) {
    currentCampaign.set({
      id: selectedCampaign.id,
      name: selectedCampaign.name,
      targetZip: selectedCampaign.targetZip,
      leadCount: filteredLeads.length
    });
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      scrollToTop();
    }
  }
  function nextPage() { goToPage(currentPage + 1); }
  function prevPage() { goToPage(currentPage - 1); }
  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function moveToOutreach(lead: Lead) {
    alert(`Lead ${lead.name} added to Outreach for ${selectedCampaign?.name}`);
  }

  function goToCampaign() {
    if (selectedCampaign) {
      goto(`/app/campaigns/${selectedCampaign.id}`);
    }
  }

  const unsubscribe = currentCampaign.subscribe(storeCampaign => {
    if (!storeCampaign) return;
    const c = campaigns.find(c => c.id === storeCampaign.id);
    if (c && (!selectedCampaign || c.id !== selectedCampaign.id)) fetchLeads(c);
  });

  onMount(fetchCampaigns);
  onDestroy(() => unsubscribe());
</script>

<main class="flex flex-col gap-6">
  {#if showIntroCard}
  <div class="relative shadow mt-14 bg-gradient-to-b from-[#FACC1510] to-[#B59F0020] p-4 max-w-4xl rounded-lg border-l-4 border-yellow-500"
       transition:fly={{ x: 20, duration: 150 }}>
    <!-- Close button -->
    <button 
      class="absolute top-2 right-2 p-1 rounded hover:bg-yellow-100 transition"
      on:click={() => (showIntroCard = false)}
      aria-label="Close"
    >
      <X class="h-5 w-5 text-gray-600" />
    </button>
  
    <h2 class="text-2xl font-bold mb-2 jura">What is a Lead?</h2>
    <p class="text-gray-700">
      A campaign is a targeted outreach effort to potential clients for your cleaning services. 
      It allows you to define the market segment, geographic area, and messaging for your outreach. 
      Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
      on the most promising prospects.
    </p>
  </div>
  {/if}
  {#if !selectedCampaign}
    <div class="flex flex-col gap-4 w-4xl mx-auto text-center transition-200 {showIntroCard ? 'mt-4' : 'mt-14'}">
      <h1 class={`${goldText} font-bold text-3xl`}>Select a Campaign</h1>
      {#if campaigns.length === 0}
        <p class="text-gray-600">You have no campaigns yet. Create one first to enable searching for Leads.</p>
        <a href="/app/campaigns/create" class={`${greenGradient} ${buttonBase} mt-4 w-30 mx-auto`}>Create Campaign</a>
      {:else}
        <div class="flex flex-col gap-4 mt-1">
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
    <!-- Leads header, pagination, list, and skeletons remain unchanged -->
    <div class="w-full max-w-4xl mx-auto flex flex-col gap-6 {showIntroCard ? 'mt-4' : 'mt-14'}">
      <!-- Header + pagination top -->
      {#if !loading && paginatedLeads.length > 0}
        <div class="flex justify-between items-center mt-4 flex-wrap gap-2">
          <!-- Left Section: Test Button -->
          <div class="flex flex-wrap justify-start items-center gap-2">
            <button on:click={() => {goToCampaign()}} class={`${blueGradient} ${buttonBase}`}>
              <FileText class="w-5 h-5" />
              <span>View Campaign</span>
            </button>
          </div>

    <!-- Right Section: Pagination Buttons -->
    <div class="flex flex-wrap justify-end items-center gap-2">
      <button
        class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
              on:click={prevPage}
              disabled={currentPage === 1}
      >
        Previous
      </button>

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

      <button
        class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
        on:click={nextPage}
        disabled={currentPage === totalPages}
      >
        Next
            </button>
          </div>
        </div>
      {/if}

      <!-- Leads List -->
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
            <LeadCard {lead} {moveToOutreach} />
          {/each}
        {/if}
      </div>

      <!-- Pagination bottom -->
      {#if !loading && paginatedLeads.length > 0}
        <div class="flex flex-wrap justify-center items-center gap-2 mt-4">
          <button
            class={`${grayGradient} text-white px-3 py-1.5 rounded-md text-sm w-20 disabled:opacity-50 disabled:cursor-not-allowed`}
            on:click={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>

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
