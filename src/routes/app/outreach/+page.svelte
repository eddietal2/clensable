<script lang="ts">
  import { X, ChevronDown, ChevronUp, FileText, MessageCircle } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
    import { blueGradient, buttonBase, greenGradient, greenText } from '$lib/styles';

  let showIntroCard = true;

  type OutreachLead = {
    id: string;
    placeId: string;
    leadData: any;
    status: string;
    createdAt: string;
  };

  type OutreachGroup = {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    leads: OutreachLead[];
    open?: boolean;
  };

  type OutreachByCampaign = {
    campaignId: string;
    campaignName: string;
    outreachGroups: OutreachGroup[];
  };

  let outreachData: OutreachByCampaign[] = [];

  onMount(async () => {
    try {
      const res = await fetch('/api/outreach');
      if (!res.ok) throw new Error('Failed to fetch outreach data');
      const data: OutreachByCampaign[] = await res.json();

      // Add reactive `open` property to each outreach group
      outreachData = data.map(campaign => ({
        ...campaign,
        outreachGroups: campaign.outreachGroups.map(group => ({
          ...group,
          open: false
        }))
      }));
    } catch (err) {
      console.error(err);
    }
  });


  function toggleGroup(group: OutreachGroup) {
    group.open = !group.open;
    // Trigger Svelte reactivity
    outreachData = [...outreachData];
  }

</script>

<main class="p-6 mt-14 max-w-4xl space-y-6">

  {#if showIntroCard}
    <div class="relative mt-8 shadow bg-gradient-to-b from-yellow-100/10 to-yellow-200/10 p-4 rounded-lg border-l-4 border-yellow-500"
         transition:fly={{ x: 20, duration: 150 }}>
      <button 
        class="absolute top-2 right-2 p-1 rounded hover:bg-yellow-100 transition"
        on:click={() => (showIntroCard = false)}
        aria-label="Close"
      >
        <X class="h-5 w-5 text-gray-600" />
      </button>

      <h2 class="text-2xl font-bold mb-2 jura">What is Outreach?</h2>
      <p class="text-gray-700 text-sm">
        A campaign is a targeted outreach effort to potential clients for your cleaning services.
        It allows you to define the market segment, geographic area, and messaging for your outreach.
        Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus
        on the most promising prospects.
      </p>
    </div>
  {/if}

  {#each outreachData as campaign}
    <section class="bg-white rounded-lg shadow p-4 space-y-4">
      <div class="flex justify-between items-center">
        <div>
          <span class="text-xs text-gray-400">Campaign</span><br>
          <h2 class={`${greenText}`}>
            {campaign.campaignName}
          </h2>
        </div>
        <div class="flex space-x-2">
          <a href="/app/outreach"
             class={`${greenGradient} ${buttonBase}`}>
            <MessageCircle class="w-4 h-4 mr-1" />
            <span>View Outreach</span>
          </a>
          <a href="/app/outreach"
             class={`${blueGradient} ${buttonBase}`}>
            <FileText class="w-4 h-4 mr-1" />
            <span>View Campaign</span>
          </a>
        </div>
      </div>

      {#each campaign.outreachGroups as group}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <button 
            class="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition"
            on:click={() => toggleGroup(group)}
          >
            <div>
              <h3 class="font-semibold">{group.name}</h3>
              {#if group.description}
                <p class="text-sm text-gray-500">{group.description}</p>
              {/if}
            </div>
            {#if group.open}
              <ChevronUp class="w-5 h-5 text-gray-600" />
            {:else}
              <ChevronDown class="w-5 h-5 text-gray-600" />
            {/if}
          </button>

          {#if group.open}
            <ul class="p-3 space-y-1 text-gray-700 text-sm border-t border-gray-200">
              {#if group.leads.length > 0}
                {#each group.leads as lead}
                  <li class="flex justify-between items-center">
                    <span>{lead.leadData?.name ?? lead.placeId}</span>
                    <span class="text-xs font-medium text-gray-500">{lead.status}</span>
                  </li>
                {/each}
              {:else}
                <li class="italic text-gray-400">No leads yet</li>
              {/if}
            </ul>
          {/if}
        </div>
      {/each}
    </section>
  {/each}

</main>
