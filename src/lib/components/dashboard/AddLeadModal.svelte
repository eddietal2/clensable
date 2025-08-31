<script lang="ts">
  import { buttonBase, grayGradient, greenGradient, greenText } from '$lib/styles';
  import { createEventDispatcher } from 'svelte';

  export let lead: any;
  export let campaignId: string | undefined;
  export let campaignName: string | undefined;
  export let outreachGroups: string[] = ['OutreachGroup-A']; // initial group

  const dispatch = createEventDispatcher();

  // Track all available groups
  let allGroups = [...outreachGroups];

  // Track selected radio
  let selectedGroup = allGroups[0];

  const MAX_GROUPS = 5;

  function close() {
    dispatch('close');
  }

  function createNewGroup() {
    if (allGroups.length >= MAX_GROUPS) return;

    const nextLetter = String.fromCharCode(65 + allGroups.length); // B, C, D, E
    const newGroupName = `OutreachGroup-${nextLetter}`;
    allGroups = [...allGroups, newGroupName];
    selectedGroup = newGroupName;
  }

  function removeLastGroup() {
    if (allGroups.length <= 1) return; // never remove initial group

    const removed = allGroups.pop();
    allGroups = [...allGroups]; // reassign to trigger reactivity

    // If removed group was selected, fallback to previous
    if (selectedGroup === removed) {
      selectedGroup = allGroups[allGroups.length - 1];
    }
  }

  function addLeadToGroup() {
    try {
      dispatch('add', { lead, groupName: selectedGroup });
      dispatch('removeFromCampaign', { leadId: lead.id, campaignId });
      dispatch('blacklist', { leadId: lead.id });
      close();
    } catch (err) {
      console.error('Failed to add lead to group', err);
    }
  }

  $: maxGroupsReached = allGroups.length >= MAX_GROUPS;
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  role="dialog"
  aria-modal="true"
  on:keydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') close(); }}
  tabindex="0"
>
  <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6 relative">
    <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            on:click={close} aria-label="Close modal">✕</button>

    <h2 class={`${greenText}`}>Add Lead to Outreach Group</h2>
    <p class="mb-2 text-black/60 text-sm">
      An outreach group is a collection of leads organized for targeted communication. 
      Every lead must belong to an outreach group.
    </p>
    <p>Campaign: <span class="font-semibold">{campaignName}</span></p>
    <p class="mb-4 pb-4 border-b border-gray-200">Lead: <span class="font-semibold">{lead.name}</span></p>

    <fieldset class="mb-4">
      <h2 class="jura font-bold text-lg text-black/60">Select Outreach Group</h2>
      <p class="mb-4 text-xs">Only create as many groups as you need.</p>
      <p class="mb-4 text-xs">DEV - When an ORG is deleted, its Leads are removed from blacklist</p>

      {#each allGroups as group}
        <label class="flex items-center gap-2 mb-1">
          <input type="radio" bind:group={selectedGroup} value={group} />
          {group}
        </label>
      {/each}
    </fieldset>

    <div class="flex gap-2 mb-10">
      {#if !maxGroupsReached}
        <button class="flex items-center px-3 shadow bg-gray-200 text-xs text-black/80 rounded hover:bg-gray-300"
                on:click={createNewGroup}>
          <span class="text-green-600 text-3xl mr-1 relative bottom-1">+</span> 
          Create New OutreachGroup
        </button>
      {/if}
      {#if allGroups.length > 1}
        <button class="flex items-center px-3 shadow bg-gray-200 text-xs text-black/80 rounded hover:bg-gray-300"
                on:click={removeLastGroup}>
          <span class="text-red-600 text-4xl mr-1 relative bottom-1">-</span>
          Remove Last OutreachGroup
        </button>
      {/if}
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
      <button class={`${grayGradient} ${buttonBase} w-30`} on:click={close}>
        Cancel
      </button>
      <button class={`${greenGradient} ${buttonBase} w-30`} on:click={addLeadToGroup}>
        Add to Outreach
      </button>
    </div>
  </div>
</div>
