<script lang="ts">
  import { buttonBase, grayGradient, greenGradient, greenText } from '$lib/styles';
  import { createEventDispatcher } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { addToast } from '$lib/stores/toast';

  export let lead: any;
  export let campaignId: string | undefined;
  export let campaignName: string | undefined;
  export let outreachGroups: string[] = ['OutreachGroup-A'];

  const dispatch = createEventDispatcher();

  let allGroups = [...outreachGroups];
  let selectedGroup = allGroups[0];
  $: lastGroup = allGroups[allGroups.length - 1];
  const MAX_GROUPS = 5;

  let showConfirm = false;

  $: maxGroupsReached = allGroups.length >= MAX_GROUPS;

  // Close modal
  function close() { dispatch('close'); }

  // Add/remove group
  function createNewGroup() {
    if (allGroups.length >= MAX_GROUPS) return;
    const nextLetter = String.fromCharCode(65 + allGroups.length);
    const newGroupName = `OutreachGroup-${nextLetter}`;
    allGroups = [...allGroups, newGroupName];
    selectedGroup = newGroupName;

    dispatch('updateGroups', { campaignId, groups: allGroups });
    addToast(`Created ${newGroupName}`, 'success');
  }

  function requestRemoveLastGroup() { if (allGroups.length <= 1) return showConfirm = true; }
  function confirmRemove() {
    const removed = allGroups.pop();
    allGroups = [...allGroups];
    if (selectedGroup === removed) selectedGroup = allGroups[allGroups.length - 1];
    
    dispatch('updateGroups', { campaignId, groups: allGroups });
    showConfirm = false;
    addToast(`${removed} removed`, 'error');
  }
  function cancelRemove() { showConfirm = false; }

  function addLeadToGroup() {
    try {
      dispatch('add', { lead, groupName: selectedGroup });
      dispatch('removeFromCampaign', { leadId: lead.id, campaignId });
      dispatch('blacklist', { leadId: lead.id });
      addToast(`Lead "${lead.name}" added to ${selectedGroup}`, 'success');
      close();
    } catch (err) {
      console.error(err);
      addToast('Failed to add lead to outreach group', 'error');
    }
  }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
  <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6 relative">
    <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700" on:click={close} aria-label="Close modal">✕</button>

    <h2 class={`${greenText}`}>Add Lead to Outreach Group</h2>
    <p class="mb-2 text-black/60 text-sm">
      An outreach group is a collection of leads organized for targeted communication.
    </p>
    <p><span class="font-semibold">Campaign:</span> {campaignName}</p>
    <p class="mb-4 pb-4 border-b border-gray-200"><span class="font-semibold">Lead:</span> {lead.name}</p>

    <fieldset class="mb-4">
      <h2 class="jura font-bold text-lg text-black/60">Select Outreach Group</h2>
      <p class="mb-4 text-xs">Only create as many groups as you need.</p>

      {#each allGroups as group}
        <label class="flex items-center gap-2 mb-1">
          <input type="radio" bind:group={selectedGroup} value={group} />
          {group}
        </label>
      {/each}
    </fieldset>

    <div class="flex gap-2 mb-10">
      {#if !maxGroupsReached}
        <button class="flex items-center px-3 shadow bg-gray-200 text-xs text-black/80 rounded hover:bg-gray-300" on:click={createNewGroup}>
          <span class="text-green-600 text-3xl mr-1 relative bottom-1">+</span> Create New OutreachGroup
        </button>
      {/if}
      {#if allGroups.length > 1}
        <button class="flex items-center px-3 shadow bg-gray-200 text-xs text-black/80 rounded hover:bg-gray-300" on:click={requestRemoveLastGroup}>
          <span class="text-red-600 text-4xl mr-1 relative bottom-1">-</span> Remove Last OutreachGroup
        </button>
      {/if}
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
      <button class={`${grayGradient} ${buttonBase} w-30`} on:click={close}>Cancel</button>
      <button class={`${greenGradient} ${buttonBase} w-30`} on:click={addLeadToGroup}>Add to Outreach</button>
    </div>
  </div>
</div>

{#if showConfirm}
  <ConfirmModal
    message={`Are you sure you want to remove <strong>${lastGroup}</strong>?`}
    confirmText="Remove"
    cancelText="Cancel"
    on:confirm={confirmRemove}
    on:cancel={cancelRemove}
  />
{/if}
