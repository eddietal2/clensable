<!-- src/routes/campaigns/create/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { CheckCircle } from "lucide-svelte";

  let name = "";
  let description = "";
  let targetZip = "";
  let radius: number | null = null;
  let category = "";
  let customCategory = "";
  let errorMsg = "";
  let showSpinner = false;

  // Success state
  let success = false;
  let campaignName = "";

  async function handleSubmit() {
    errorMsg = "";

    // If "Other" is selected, replace category with custom input
    const finalCategory = category === "Other" ? customCategory : category;

    if (!name || !targetZip || !radius || !finalCategory) {
      errorMsg = "All fields are required.";
      return;
    }

    showSpinner = true;

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          targetZip,
          radius,
          category: finalCategory
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || "Failed to create campaign.";
        return;
      }

      // Show success message instead of redirecting
      campaignName = name;
      success = true;
    } catch (err) {
      console.error(err);
      errorMsg = "Unexpected error while creating campaign.";
    } finally {
      showSpinner = false;
    }
  }

  function goToCampaigns() {
    goto("/app/campaigns");
  }
</script>

<main>
    <div class="bg-gradient-to-r from-[#CFFFE030] to-[#B2F1D670] p-4 mt-14 max-w-2xl rounded-lg border-l-4 border-green-500">
      <h2 class="text-lg font-semibold mb-2">What is a Campaign?</h2>
      <p class="text-gray-700">
        A campaign is a targeted outreach effort to potential clients for your cleaning services. 
        It allows you to define the market segment, geographic area, and messaging for your outreach. 
        Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
        on the most promising prospects.
      </p>
    </div>

    <div class="max-w-2xl mx-auto p-6 space-y-6 mt-4 bg-white shadow rounded-lg">

  {#if success}
    <!-- Success Message -->
    <div class="bg-green-50 border border-green-300 text-green-800 p-6 rounded-lg text-center space-y-4">
      <CheckCircle class="w-10 h-10 mx-auto text-green-600" />
      <h2 class="text-xl font-semibold">Campaign Created Successfully!</h2>
      <p class="text-gray-700">
        Your campaign <strong>{campaignName}</strong> has been created.
      </p>
      <button 
        class="bg-gradient-to-r from-[#00CF68] to-[#187967] 
               text-white px-6 py-3 rounded-lg font-semibold 
               hover:from-[#00b55c] hover:to-[#145c55] transition"
        on:click={goToCampaigns}
      >
        Go to Campaigns
      </button>
    </div>
  {:else}
    <!-- Form -->
    <!-- <h1 class="text-2xl font-bold">Create a New Campaign</h1> -->

    {#if errorMsg}
      <p class="text-red-600">{errorMsg}</p>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- Campaign Name -->
      <div>
        <label class="block font-semibold mb-1">Campaign Name</label>
        <input
          type="text"
          bind:value={name}
          class="w-full border rounded px-3 py-2"
          placeholder="Enter campaign name"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="block font-semibold mb-1">Description (optional)</label>
        <textarea
          bind:value={description}
          class="w-full border rounded px-3 py-2"
          placeholder="Enter a short description"
        ></textarea>
      </div>

      <!-- Target Zip -->
      <div>
        <label class="block font-semibold mb-1">Target Zip Code</label>
        <input
          type="text"
          bind:value={targetZip}
          class="w-full border rounded px-3 py-2"
          placeholder="e.g., 90210"
          maxlength="5"
        />
      </div>

      <!-- Radius -->
      <div>
        <label class="block font-semibold mb-1">Radius (miles)</label>
        <input
          type="number"
          bind:value={radius}
          class="w-full border rounded px-3 py-2"
          placeholder="e.g., 10"
        />
      </div>

      <!-- Category Dropdown -->
      <div>
        <label class="block font-semibold mb-1">Category</label>
        <select
          bind:value={category}
          class="w-full border rounded px-3 py-2 bg-white"
        >
          <option value="" disabled selected>Select a category</option>
          <option value="Restaurants">Restaurants</option>
          <option value="Offices">Offices</option>
          <option value="Medical Facilities">Medical Facilities</option>
          <option value="Retail Stores">Retail Stores</option>
          <option value="Gyms & Fitness Centers">Gyms & Fitness Centers</option>
          <option value="Salons & Spas">Salons & Spas</option>
          <option value="Schools & Daycares">Schools & Daycares</option>
          <option value="Automotive Services">Automotive Services</option>
          <option value="Hospitality (Hotels, Motels)">Hospitality (Hotels, Motels)</option>
          <option value="Other">Other</option>
        </select>

        {#if category === "Other"}
          <input
            type="text"
            bind:value={customCategory}
            placeholder="Enter custom category"
            class="mt-2 w-full border rounded px-3 py-2"
          />
        {/if}

        <label class="block text-xs mt-1 text-gray-600">
          Select the primary market segment to target. Only one category can be chosen per campaign.
        </label>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="bg-gradient-to-r from-[#00CF68] to-[#187967] text-white px-4 py-2 rounded-lg font-semibold 
               hover:from-[#00b55c] hover:to-[#145c55] transition flex items-center justify-center"
        disabled={showSpinner}
      >
        {#if showSpinner}
          <!-- Spinner -->
          <svg
            class="animate-spin h-5 w-5 text-white mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          Creating...
        {:else}
          Create Campaign
        {/if}
      </button>
    </form>
  {/if}
    </div>
</main>


