<script lang="ts">
  import { goto } from '$app/navigation'; // optional if you want to navigate after success

  let step = 1;

  // Step 1
  let orgName = '';
  let zip = '';
  let serviceType = '';
  let radius = 15;

  const serviceOptions = [
    'Office Cleaning',
    'Daycare Sanitization',
    'Gym Cleaning',
    'Post-Construction'
  ];

  // Step 2
  let cardNumber = '';
  let expiry = '';
  let cvc = '';

  // Step 3
  let saving = false; // for spinner if desired

  function handleNextStep() {
    step = 2;
  }

  function handleBackStep() {
    step = step > 1 ? step - 1 : 1;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (step === 1) {
      handleNextStep();
    } else if (step === 2) {
      // Save org + payment info to backend
      saving = true;
      try {
        const res = await fetch('/api/create-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgName, zip, serviceType, radius, cardNumber, expiry, cvc })
        });
        const data = await res.json();

        if (res.ok) {
          // Move to success slide
          step = 3;
        } else {
          alert(data.error || 'Failed to create organization.');
        }
      } catch (err) {
        console.error(err);
        alert('Unexpected error.');
      } finally {
        saving = false;
      }
    }
  }
</script>

<main>
  <h1 class="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 bg-clip-text text-transparent text-2xl font-bold mb-6">Create Your Organization</h1>

  <div class="slider">
    <!-- Step Indicator -->
    <div class="steps">
      <div class={step === 1 ? 'active' : ''}>Step 1: Org Info</div>
      <div class={step === 2 ? 'active' : ''}>Step 2: Payment</div>
      <div class={step === 3 ? 'active' : ''}>Success</div>
    </div>

    {#if step < 3}
      <form on:submit|preventDefault={handleSubmit} class="org-form">
        {#if step === 1}
          <!-- Step 1: Org Info -->
          <label>
            Organization Name
            <input type="text" bind:value={orgName} required placeholder="e.g. Sparkle Cleaners" />
          </label>

          <label>
            Zip Code
            <input type="text" bind:value={zip} required maxlength="5" placeholder="e.g. 90210" />
          </label>

          <label>
            Service Type
            <select bind:value={serviceType} required>
              <option value="" disabled selected>Select service</option>
              {#each serviceOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>

          <label>
            Lead Radius (miles)
            <input type="number" bind:value={radius} min="1" max="50" required />
          </label>

          <button type="submit" class="bg-gradient-to-br from-[#00CF68] to-[#187967]">
            Next: Payment
          </button>
        {:else if step === 2}
          <!-- Step 2: Payment Info -->
          <label>
            Card Number
            <input
              type="text"
              bind:value={cardNumber}
              required
              placeholder="1234 1234 1234 1234"
              maxlength="19"
              on:input={(e) => {
                let raw = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                cardNumber = raw.replace(/(.{4})/g, '$1 ').trim();
              }}
            />
          </label>

          <label>
            Expiry
            <input
              type="text"
              bind:value={expiry}
              required
              placeholder="MM/YY"
              maxlength="5"
              on:input={(e) => {
                let raw = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                expiry = raw.length > 2 ? raw.slice(0,2)+'/'+raw.slice(2,4) : raw;
              }}
            />
          </label>

          <label>
            CVC
            <input type="text" bind:value={cvc} required placeholder="123" maxlength="3" />
          </label>

          <div class="buttons">
            <button type="button" on:click={handleBackStep} class="bg-gray-300 text-black">
              Back
            </button>
            <button type="submit" class="bg-gradient-to-br from-[#00CF68] to-[#187967]" disabled={saving}>
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        {/if}
      </form>
    {:else}
      <!-- Step 3: Success -->
      <div class="success-slide text-center py-12">
        <svg class="h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <h2 class="text-2xl font-bold mb-2">Organization Created!</h2>
        <p class="text-gray-700 mb-6">Your organization has been successfully created and is ready to use.</p>
        <button class="bg-gradient-to-br from-[#00CF68] to-[#187967]" on:click={() => goto('/')}>Go to Dashboard</button>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 400px;
    margin: 3.2rem auto 0 auto;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .steps { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
  .steps div { flex: 1; text-align: center; padding: 0.5rem; border-bottom: 2px solid #ddd; font-weight: 500; transition: border-color 0.3s; }
  .steps .active { border-bottom: 2px solid #10b981; font-weight: 600; color: #10b981; }

  .org-form label { display: block; margin-bottom: 1rem; font-weight: 500; }
  .org-form input, .org-form select { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }

  button { width: 100%; padding: 0.75rem; background: linear-gradient(to bottom, #00CF68, #187967); color: #fff; border: none; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }
  button:hover { background: linear-gradient(to bottom, #00b85c, #0f6f5a); }

  .buttons { display: flex; gap: 0.5rem; }
  .buttons button { flex: 1; }
  .buttons button.bg-gray-300 { background: #ddd; color: #333; }
  .buttons button.bg-gray-300:hover { background: #bbb; }

  .success-slide svg { margin-bottom: 1rem; }
</style>
