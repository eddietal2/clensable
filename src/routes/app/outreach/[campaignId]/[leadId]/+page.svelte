<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { X, ChevronLeft } from 'lucide-svelte';
  import { buttonBase, greenGradient, blueGradient, greenText } from '$lib/styles';
  import { fly } from 'svelte/transition';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let showIntroCard = true;

  type LeadData = {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  };

  type OutreachLead = {
    id: string;
    placeId: string;
    leadData: LeadData;
    status: string;
    createdAt: string;
  };

  let campaignId = $page.params.campaignId;
  let leadId = $page.params.leadId;

  let lead: OutreachLead | null = null;
  let loading = true;
  let error: string | null = null;

  let messageDraft = '';
  let generating = false;
  let sending = false;
  let cancelGeneration = false;
  let showConfirmModal = false;
  let textareaEl: HTMLTextAreaElement | null = null;

  onMount(async () => {
    try {
      const res = await fetch(`/api/outreach/campaign/${campaignId}/${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch lead data');
      lead = await res.json();
    } catch (err: any) {
      console.error(err);
      error = err.message;
    } finally {
      loading = false;
    }
  });

  function goBack() {
    goto(`/app/outreach/${campaignId}`);
  }

  async function generateMessage() {
    if (!lead) return;
    generating = true;
    cancelGeneration = false;
    messageDraft = '';

    try {
      const res = await fetch('/api/outreach/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.leadData.name,
          leadEmail: lead.leadData.email,
          campaignName: 'Cleaning Campaign'
        })
      });

      if (!res.ok) throw new Error('Failed to generate message');

      const data = await res.json();
      const candidate = data?.message?.[0];
      const fullText = candidate?.content?.parts?.[0].text;
      if (!fullText) throw new Error('No message generated');

      // Typewriter effect with auto-scroll
      let i = 0;
      const speed = 25;
      const interval = setInterval(() => {
        if (cancelGeneration) {
          clearInterval(interval);
          generating = false;
          return;
        }

        messageDraft += fullText[i];
        i++;

        if (textareaEl) textareaEl.scrollTop = textareaEl.scrollHeight;

        if (i >= fullText.length) {
          clearInterval(interval);
          generating = false;
        }
      }, speed);

    } catch (err: any) {
      console.error(err);
      alert(err.message);
      generating = false;
    }
  }

  function cancelMessageGeneration() {
    cancelGeneration = true;
  }

  function sendMessage() {
    if (!messageDraft.trim() || !lead) return;
    showConfirmModal = true;
  }

  async function confirmSend() {
    showConfirmModal = false;
    sending = true;

    // Simulate sending message (replace with real API)
    setTimeout(() => {
      sending = false;
      messageDraft = '';
      alert('Message sent (mock)');
    }, 1000);
  }

  function markStatus(newStatus: string) {
    if (!lead) return;
    lead.status = newStatus;
  }
</script>


<main class="p-6 w-4xl mx-auto space-y-6">
  {#if showIntroCard}
    <div class="relative shadow mt-8 bg-gradient-to-b from-[#FACC1510] to-[#B59F0020] p-4 max-w-4xl rounded-lg border-l-4 border-yellow-500"
         transition:fly={{ x: 20, duration: 150 }}>
      <button class="absolute top-2 right-2 p-1 rounded hover:bg-yellow-100 transition"
              on:click={() => (showIntroCard = false)}
              aria-label="Close">
        <X class="h-5 w-5 text-gray-600" />
      </button>

      <h2 class="text-2xl font-bold mb-2 jura">AI Assistant Outreach & Tracking</h2>
      <p class="text-gray-700">
        A campaign is a targeted outreach effort to potential clients for your cleaning services. 
        Each campaign tracks leads, emails sent, replies, and overall effectiveness.
      </p>
    </div>
  {/if}

  <div class="h-4"></div>

  {#if loading}
    <p>Loading lead...</p>
  {:else if error}
    <p class="text-red-500">{error}</p>
  {:else if lead}
    <button class="flex items-center px-4 py-1 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 text-sm mb-4"
            on:click={goBack}>
      <ChevronLeft class="w-4 h-4 mr-1"/>
      Back to Campaign
    </button>

    <!-- Lead Info -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <h1 class={`${greenText}`}>{lead.leadData.name ?? lead.placeId}</h1>
      {#if lead.leadData.email}<p>Email: {lead.leadData.email}</p>{/if}
      {#if lead.leadData.phone}<p>Phone: {lead.leadData.phone}</p>{/if}
      {#if lead.leadData.address}<p>Address: {lead.leadData.address}</p>{/if}
      <p class="text-sm text-gray-500">Status: <strong>{lead.status}</strong></p>
    </section>

    <!-- AI Message Draft -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <div class="flex items-center gap-2">
        <h2 class="font-semibold">Send Message</h2>
        {#if generating}
          <div class="pulse"></div>
        {/if}
      </div>

      <textarea 
        bind:value={messageDraft}
        bind:this={textareaEl}
        class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-green-300 cursor"
        rows="15"
        placeholder="Compose an email or SMS using AI..."
      ></textarea>

      <div class="flex gap-2 mt-2">
        <button class={`${blueGradient} ${buttonBase} text-sm py-1`} on:click={generateMessage} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Message'}
        </button>

        {#if generating}
          <button class="bg-red-500 text-white px-3 py-1 rounded text-sm" on:click={cancelMessageGeneration}>
            Cancel
          </button>
        {/if}

        <button class={`${greenGradient} ${buttonBase} text-sm py-1`} on:click={sendMessage} disabled={sending}>
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </section>

    <!-- Activity / History -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <h2 class="font-semibold">Lead Activity</h2>
      <ul class="divide-y divide-gray-200 text-sm text-gray-700">
        <li class="py-1">Lead added: 3 days ago</li>
        <li class="py-1">Message sent: 2 days ago</li>
        <li class="py-1">Lead replied: 1 day ago</li>
      </ul>
    </section>
  {/if}

  {#if showConfirmModal}
    <ConfirmModal 
      message="Are you sure you want to send this message?" 
      confirmText="Send" 
      cancelText="Cancel" 
      on:confirm={confirmSend} 
      on:cancel={() => showConfirmModal = false} 
      loading={sending}
    />
  {/if}
</main>


<style>
  .cursor::after {
    content: '|';
    animation: blink 1s step-start infinite;
    color: gray;
    margin-left: 1px;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }

  /* Pulsating circle for generating indicator */
  .pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #10b981; /* green */
    animation: pulse 1s infinite;
    margin-left: 8px;
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.6; }
    100% { transform: scale(1); opacity: 1; }
  }
</style>