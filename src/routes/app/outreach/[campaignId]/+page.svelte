<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { backButton, buttonBase, greenGradient, greenText } from '$lib/styles';

  type OutreachLead = {
    id: string;
    placeId: string;
    leadData: any;
    status: string;
  };

  type OutreachGroup = {
    id: string;
    name: string;
    description?: string;
    leads: OutreachLead[];
  };

  let campaign: { id: string; name: string; outreach: OutreachGroup[] } | null = null;
  $: campaignId = $page.params.campaignId;
  let activeGroup: OutreachGroup | null = null;

  onMount(async () => {
    const res = await fetch(`/api/outreach/campaign/${campaignId}`);
    if (!res.ok) return console.error('Failed to load campaign outreach');
    campaign = await res.json();

    if (campaign && campaign.outreach.length > 0) {
      activeGroup = campaign.outreach[0];
    }

  });

  function viewLead(leadId: string) {
    goto(`/app/outreach/${campaignId}/${leadId}`);
  }

  function selectGroup(group: OutreachGroup) {
    activeGroup = group;
  }
</script>

<main class="p-6 space-y-6 w-4xl">
  {#if campaign}
    <div class="mt-8">
        <a 
          href="/app/outreach"
          class={`${backButton}`}
        >
          <!-- Optional left arrow icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
    </div>
    <header class="flex justify-between items-center">
      <div>
        <p class="text-xs text-gray-500">Campaign</p>
        <h1 class={`${greenText}`}>{campaign.name}</h1>
      </div>
      <!-- <a href="/app/outreach/create-group"
         class={`${greenGradient} ${buttonBase}`}>
        + New Outreach Group
      </a> -->
    </header>

    <!-- Tabs -->
    <div class="border-b border-gray-200 flex space-x-6 mt-4">
      {#each campaign.outreach as group}
        <button
          on:click={() => selectGroup(group)}
          class="pb-2 text-sm font-medium transition relative
                 {activeGroup?.id === group.id
                   ? 'text-yellow-600 border-b-2 border-yellow-600'
                   : 'text-gray-500 hover:text-gray-700'}">
          {group.name}
        </button>
      {/each}
    </div>

    <!-- Tab content -->
    {#if activeGroup}
      <div class="mt-4 bg-white border border-gray-400 rounded-lg shadow p-4">
        {#if activeGroup.description}
          <p class="text-sm text-gray-600 mb-3">{activeGroup.description}</p>
        {/if}

        {#if activeGroup.leads.length > 0}
          <ul class="divide-y divide-gray-200">
            {#each activeGroup.leads as lead}
              <li
                class="cursor-pointer hover:bg-gray-50 p-2 rounded flex justify-between items-center"
                on:click={() => viewLead(lead.id)}>
                <span>{lead.leadData.name ?? lead.placeId}</span>
                <span class="text-xs text-gray-500">{lead.status}</span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="italic text-gray-400">No leads in this group yet</p>
        {/if}
      </div>
    {/if}
  {:else}
    <p>Loading campaign outreach...</p>
  {/if}
</main>
