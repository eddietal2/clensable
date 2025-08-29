<script lang="ts">
  export let lead: any;
  export let moveToOutreach: (lead: any) => void;

  let currentPhotoIndex = lead.currentPhotoIndex ?? 0;

  function prevPhoto() {
    if (!lead.photoUrls || lead.photoUrls.length === 0) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + lead.photoUrls.length) % lead.photoUrls.length;
  }

  function nextPhoto() {
    if (!lead.photoUrls || lead.photoUrls.length === 0) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % lead.photoUrls.length;
  }
</script>

<div class="bg-white rounded-lg shadow hover:shadow-lg transition w-[1000px] flex flex-col overflow-hidden">
  <div class="p-4 flex gap-4">
    <!-- Photo carousel -->
    <div class="w-48 h-48 relative flex-shrink-0 rounded-lg overflow-hidden">
      {#if lead.photoUrls && lead.photoUrls.length > 0}
        <img
          src={lead.photoUrls[currentPhotoIndex]}
          alt={lead.name}
          class="w-full h-full object-cover"
        />
        {#if lead.photoUrls.length > 1}
          <button
            class="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 text-white px-2 py-1 rounded"
            on:click={prevPhoto}
          >‹</button>
          <button
            class="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 text-white px-2 py-1 rounded"
            on:click={nextPhoto}
          >›</button>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/30 text-white text-xs px-2 py-0.5 rounded">
            {currentPhotoIndex + 1} / {lead.photoUrls.length}
          </div>
        {/if}
      {:else}
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(`
            <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
              <rect width="192" height="192" fill="#e2e8f0"/>
              <text x="50%" y="50%" font-size="20" text-anchor="middle" fill="#94a3b8" dy=".3em">No Image</text>
            </svg>
          `)}`}
          alt="No Image"
          class="w-full h-full object-cover"
        />
      {/if}
    </div>

    <!-- Lead info -->
    <div class="flex-1 flex flex-col justify-between min-w-0">
      <div>
        <h2 class="font-semibold text-lg truncate">{lead.name}</h2>
        <p class="text-gray-600 truncate">{lead.address}</p>
        {#if lead.websiteUri}
          <p class="text-blue-600 text-sm truncate">
            <a href={lead.websiteUri} target="_blank" rel="noopener noreferrer">{lead.websiteUri} 🔗</a>
          </p>
        {/if}
        {#if lead.phone}<p class="text-gray-500 text-sm truncate">{lead.phone}</p>{/if}
        <p class="mt-1 font-medium text-gray-700">Score: {lead.score}</p>

        {#if lead.generativeSummary}
          <p class="mt-2 text-gray-500 text-sm line-clamp-3">
            <span class="font-bold">Summary:</span> {lead.generativeSummary.overview.text}
          </p>
        {:else}
          <p class="mt-2 text-gray-500 text-sm italic">No summary available.</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Bottom toolbar -->
  <div class="border-t-2 border-[#99999920] p-4 flex justify-end">
    <button
      class="bg-green-500 text-white text-xs px-5 py-2 rounded-md hover:shadow-md transition"
      on:click={() => moveToOutreach(lead)}
    >
      Add to Outreach
    </button>
  </div>
</div>
