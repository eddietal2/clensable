<script lang="ts">
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

  function handleSubmit(e: Event) {
    e.preventDefault();
    // TODO: Send data to backend or navigate to next step
    console.log({ orgName, zip, serviceType, radius });
  }
</script>

<main>
  <h1>Create Your Organization</h1>
  <form on:submit|preventDefault={handleSubmit} class="org-form">
    <label>
      Organization Name
      <input type="text" bind:value={orgName} required placeholder="e.g. Sparkle Cleaners" />
    </label>

    <label>
      Zip Code
      <input type="text" bind:value={zip} required maxlength="10" placeholder="e.g. 90210" />
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

    <button type="submit" class="bg-gradient-to-br from-green-400 to-emerald-500">Create Organization & Find Leads</button>
  </form>
</main>

<style>
  main {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    text-align: center;
  }
  .org-form label {
    display: block;
    margin-bottom: 1rem;
    font-weight: 500;
  }
  .org-form input,
  .org-form select {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.25rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  button {
    width: 100%;
    padding: 0.75rem;
    background: #0077ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }
  button:hover {
    background: #005fcc;
  }
</style>