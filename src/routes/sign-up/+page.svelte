<script lang="ts">
  let firstName = '';
  let lastName = '';
  let email = '';
  let message = '';
  let messageError = false;
  let signupSuccess = false; // show success UI
  let showSpinner = false;   // show spinner for 2 seconds

  async function handleSignup() {
    try {
      const res = await fetch('/api/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName })
      });

      const data = await res.json();

      if (res.ok) {
        messageError = false;
        showSpinner = true;

        // Wait 2 seconds before showing success UI
        setTimeout(() => {
          showSpinner = false;
          signupSuccess = true;
        }, 2000);
      } else {
        message = data.error || 'Something went wrong';
        messageError = true;
        signupSuccess = false;
      }
    } catch (err) {
      console.error(err);
      message = 'Unexpected error';
      messageError = true;
      signupSuccess = false;
    }
  }
</script>

<main class="min-h-screen flex items-center justify-center bg-gray-200 py-24">
  <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">

    {#if !signupSuccess}
      <!-- Sign Up Form -->
      <h2 class="bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-700 bg-clip-text text-transparent text-2xl font-bold mb-6 text-center">
        Create Your Account
      </h2>

      <form class="space-y-6" on:submit|preventDefault={handleSignup}>
        <!-- First Name -->
        <div>
          <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            id="firstName"
            bind:value={firstName}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <!-- Last Name -->
        <div>
          <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            id="lastName"
            bind:value={lastName}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 px-4 bg-gradient-to-b from-[#00CF68] to-[#187967] text-white font-semibold rounded-lg shadow-md hover:from-[#00b85c] hover:to-[#0f6f5a] transition"
          disabled={showSpinner}
        >
          Send Magic Link
        </button>
      </form>

      <!-- Spinner -->
      {#if showSpinner}
        <div class="mt-6 flex justify-center">
          <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      {/if}

      <!-- Message -->
      {#if message && !signupSuccess}
        <p class="mt-4 text-center {messageError ? 'text-red-700' : 'text-green-700'} font-medium">{message}</p>
      {/if}

    {:else}
      <!-- Success Message UI -->
      <div class="text-center py-12">
        <svg class="h-16 mx-auto" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" fill="white" fill-opacity="0.01"/>
          <path d="M24 4L29.2533 7.83204L35.7557 7.81966L37.7533 14.0077L43.0211 17.8197L41 24L43.0211 30.1803L37.7533 33.9923L35.7557 40.1803L29.2533 40.168L24 44L18.7467 40.168L12.2443 40.1803L10.2467 33.9923L4.97887 30.1803L7 24L4.97887 17.8197L10.2467 14.0077L12.2443 7.81966L18.7467 7.83204L24 4Z" fill="#A2CC86" stroke="#53A654" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 24L22 29L32 19" stroke="#F0BA7D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 class="bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-700 bg-clip-text text-transparent mb-4 text-2xl font-bold">Sign Up Successful!</h2>
        <p class="text-gray-700 mb-6">You can now login in. An email has been sent to <span class="font-bold text-green-700">{email}</span> with a link for you to log in.</p>
      </div>
    {/if}

  </div>
</main>
