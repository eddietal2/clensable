<script lang="ts">
  import { greenGradient, yellowGradient, buttonBase } from '$lib/styles';
  let hasCampaigns = false;
</script>

{#if !hasCampaigns}
  <div class="empty-state">
    <!-- Icon -->
    <svg xmlns="http://www.w3.org/2000/svg" height="100" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FACC15" />
          <stop offset="100%" stop-color="#B59F00" />
        </linearGradient>
      </defs>
      <path 
        stroke="url(#yellowGradient)"
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        fill="none"
        d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h3l2-2 2 2h3a2 2 0 012 2v12a2 2 0 01-2 2z"
      />
    </svg>

    <h1 class="jura">No Campaigns Yet</h1>
    <p>To start adding leads, create your first campaign.</p>
    <a href="/app/campaigns/create" class={`${greenGradient} ${buttonBase}`}>
      Create Your First Campaign
    </a>
  </div>
{:else}
  <!-- Leads table will go here once we implement the populated state -->
  <div>
    <h1>Your Leads</h1>
    <p>Leads table coming soon...</p>
  </div>
{/if}

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 100px;
    text-align: center;
    color: #333;
  }

  .empty-state h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .empty-state p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
</style>
