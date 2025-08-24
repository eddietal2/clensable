<script lang="ts">
  let email = '';
  let success = false;

  const handleSubmit = async () => {
    // TODO: Hook this up to your auth system (Lucia, Supabase, etc.)
    console.log("Reset link sent to:", email);
    success = true;
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-200 px-4">
  <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
    <h1 class="text-2xl font-bold text-gray-800 text-center mb-2">Forgot Password</h1>
    <p class="text-gray-500 text-sm text-center mb-6">
      Enter your email and we’ll send you a password reset link.
    </p>

    {#if !success}
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            required
            placeholder="you@example.com"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
        >
          Send Reset Link
        </button>
      </form>
    {:else}
      <div class="text-center space-y-4">
        <p class="text-green-600 font-medium">✅ Reset link sent!</p>
        <p class="text-sm text-gray-500">Check your inbox and follow the instructions to reset your password.</p>
      </div>
    {/if}

    <div class="mt-6 text-center">
      <a href="/login" class="text-sm text-green-600 hover:text-green-700">
        ← Back to Login
      </a>
    </div>
  </div>
</div>
<style>
  /* Add any additional styles if needed */     
</style>