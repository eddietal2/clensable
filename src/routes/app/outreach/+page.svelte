<script>
    import { X } from 'lucide-svelte';
    import { fly } from 'svelte/transition';

    // Show Info Card "What is Outreach?"
    let showIntroCard = true;
</script>

<main>
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
  
    <h2 class="text-2xl font-bold mb-2 jura">What is Outreach?</h2>
    <p class="text-gray-700">
      A campaign is a targeted outreach effort to potential clients for your cleaning services. 
      It allows you to define the market segment, geographic area, and messaging for your outreach. 
      Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
      on the most promising prospects.
    </p>
    </div>
    {/if}
</main>