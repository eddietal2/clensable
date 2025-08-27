<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import { loadStripe } from '@stripe/stripe-js';
  import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

  let step = 1;
  let saving = false;
  let loading = false;
  let errorMsg = '';

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

  // Step 2 - Stripe
  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let cardElement: StripeCardElement | null = null;

  onMount(async () => {
    stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
    if (!stripe) console.error('Stripe failed to load');
  });

  // Wait until step 2 is active and DOM is ready
  $: if (step === 2) {
    tick().then(() => {
      if (stripe && !elements) {
        elements = stripe.elements();
        cardElement = elements.create('card');
        cardElement.mount('#card-element');
      }
    });
  }

  function handleNextStep() {
    step = 2;
  }

  function handleBackStep() {
    step = step > 1 ? step - 1 : 1;
  }

  async function handlePayment() {
    if (!stripe || !cardElement) {
      console.error('Stripe or card element not initialized');
      return;
    }

    loading = true;
    errorMsg = '';

    const { error, token } = await stripe.createToken(cardElement);

    if (error) {
      errorMsg = error.message ?? 'Payment error';
      loading = false;
      return;
    }

    // Send token.id to backend along with org info
    try {
      const res = await fetch('/api/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          zip,
          serviceType,
          radius,
          stripeToken: token!.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || 'Payment failed';
      } else {
        step = 3; // success slide
      }
    } catch (err) {
      console.error(err);
      errorMsg = 'Unexpected error.';
    } finally {
      loading = false;
    }
  }
</script>

<main>
  <h1 class="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 bg-clip-text text-transparent text-2xl font-bold mb-6">
    Create Your Organization
  </h1>

  <div class="slider">
    <!-- Step Indicator -->
    <div class="steps">
      <div class={step === 1 ? 'active' : ''}>Step 1: Org Info</div>
      <div class={step === 2 ? 'active' : ''}>Step 2: Payment</div>
      <div class={step === 3 ? 'active' : ''}>Success</div>
    </div>

    {#if step === 1}
      <!-- Step 1: Org Info -->
      <form on:submit|preventDefault={handleNextStep} class="org-form">
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
      </form>
    {:else if step === 2}
      <!-- Step 2: Stripe Payment -->
      <div class="stripe-form">
        <div id="card-element" class="my-4"></div>
        {#if errorMsg}
          <p class="text-red-600">{errorMsg}</p>
        {/if}
        <div class="buttons">
          <button type="button" on:click={handleBackStep} class="bg-gray-300 text-black">Back</button>
          <button on:click={handlePayment} class="bg-gradient-to-br from-[#00CF68] to-[#187967]" disabled={loading}>
            {loading ? 'Processing...' : 'Submit Payment & Create Org'}
          </button>
        </div>
      </div>
    {:else}
      <!-- Step 3: Success -->
      <div class="success-slide text-center py-12">
        <svg class="h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <h2 class="text-2xl font-bold mb-2">Organization Created!</h2>
        <p class="text-gray-700 mb-6">Your organization has been successfully created and is ready to use.</p>
        <button class="bg-gradient-to-br from-[#00CF68] to-[#187967]" on:click={() => goto('/app')}>
          Go to Dashboard
        </button>
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
