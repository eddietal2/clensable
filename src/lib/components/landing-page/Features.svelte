<script>
    const integrations = [
       {
         name: "OpenAI",
         logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
         description: "AI-powered outreach that crafts personalized emails for you."
       },
       {
         name: "Google Places",
         logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
         description: "Verified local business data directly from Google."
       },
       {
         name: "Gmail",
         logo: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png",
         description: "Send emails directly from your inbox for higher deliverability."
       },
       {
         name: "Stripe",
         logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
         description: "Secure billing and subscriptions powered by Stripe."
       }
     ];
</script>
<main class="relative py-20 overflow-hidden">
    <!-- Background Video -->
    <div class="absolute inset-0 z-0 hidden md:block">
        <video 
            autoplay 
            muted 
            loop 
            playsinline
            class="w-full h-full object-cover"
        >
            <source src="videos/cleaning-video-01.mp4" type="video/mp4">
            <!-- Fallback background color if video fails to load -->
            Your browser does not support the video tag.
        </video>
        
        <!-- Video Overlay -->
        <div class="absolute inset-0 video-overlay backdrop-blur-[1px]"></div>
    </div>
    
    <!-- Content -->
    <div class="relative z-10">
            <!-- Features preview cards -->
            <div class="text-center mb-20">
                <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-800 bg-clip-text text-transparent mb-4">Features</h1>
                <p class="text-lg max-w-2xl mx-auto text-black md:text-white">
                    Powerful tools designed to grow your cleaning business
                </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0 max-w-6xl mx-auto">
                <div class="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hero-fade-in shadow-xl" style="animation-delay: 0.2s;">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg fill="#fff" class="w-8 h-8" viewBox="0 0 100 100" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <g>
                            <path d="M93.998,45.312c0-3.676-1.659-7.121-4.486-9.414c0.123-0.587,0.184-1.151,0.184-1.706c0-4.579-3.386-8.382-7.785-9.037   c0.101-0.526,0.149-1.042,0.149-1.556c0-4.875-3.842-8.858-8.655-9.111c-0.079-0.013-0.159-0.024-0.242-0.024   c-0.04,0-0.079,0.005-0.12,0.006c-0.04-0.001-0.079-0.006-0.12-0.006c-0.458,0-0.919,0.041-1.406,0.126   c-0.846-4.485-4.753-7.825-9.437-7.825c-5.311,0-9.632,4.321-9.632,9.633v65.918c0,6.723,5.469,12.191,12.191,12.191   c4.46,0,8.508-2.413,10.646-6.246c0.479,0.104,0.939,0.168,1.401,0.198c2.903,0.185,5.73-0.766,7.926-2.693   c2.196-1.927,3.51-4.594,3.7-7.51c0.079-1.215-0.057-2.434-0.403-3.638c3.796-2.691,6.027-6.952,6.027-11.621   c0-3.385-1.219-6.635-3.445-9.224C92.731,51.505,93.998,48.471,93.998,45.312z M90.938,62.999c0,3.484-1.582,6.68-4.295,8.819   c-2.008-3.196-5.57-5.237-9.427-5.237c-0.828,0-1.5,0.672-1.5,1.5s0.672,1.5,1.5,1.5c3.341,0,6.384,2.093,7.582,5.208   c0.41,1.088,0.592,2.189,0.521,3.274c-0.138,2.116-1.091,4.051-2.685,5.449c-1.594,1.399-3.641,2.094-5.752,1.954   c-0.594-0.039-1.208-0.167-1.933-0.402c-0.74-0.242-1.541,0.124-1.846,0.84c-1.445,3.404-4.768,5.604-8.465,5.604   c-5.068,0-9.191-4.123-9.191-9.191V16.399c0-3.657,2.975-6.633,6.632-6.633c3.398,0,6.194,2.562,6.558,5.908   c-2.751,1.576-4.612,4.535-4.612,7.926c0,0.829,0.672,1.5,1.5,1.5s1.5-0.671,1.5-1.5c0-3.343,2.689-6.065,6.016-6.13   c3.327,0.065,6.016,2.787,6.016,6.129c0,0.622-0.117,1.266-0.359,1.971c-0.057,0.166-0.084,0.34-0.081,0.515   c0.001,0.041,0.003,0.079,0.007,0.115c-0.006,0.021-0.01,0.035-0.01,0.035c-0.118,0.465-0.006,0.959,0.301,1.328   c0.307,0.369,0.765,0.569,1.251,0.538c0.104-0.007,0.208-0.02,0.392-0.046c3.383,0,6.136,2.753,6.136,6.136   c0,0.572-0.103,1.159-0.322,1.849c-0.203,0.635,0.038,1.328,0.591,1.7c2.434,1.639,3.909,4.329,4.014,7.242   c0,0.004-0.001,0.008-0.001,0.012c0,5.03-4.092,9.123-9.122,9.123s-9.123-4.093-9.123-9.123c0-0.829-0.672-1.5-1.5-1.5   s-1.5,0.671-1.5,1.5c0,6.685,5.438,12.123,12.123,12.123c2.228,0,4.31-0.615,6.106-1.668C89.88,57.539,90.938,60.212,90.938,62.999   z"/> 
                            <path d="M38.179,6.766c-4.684,0-8.59,3.34-9.435,7.825c-0.488-0.085-0.949-0.126-1.407-0.126c-0.04,0-0.079,0.005-0.12,0.006   c-0.04-0.001-0.079-0.006-0.12-0.006c-0.083,0-0.163,0.011-0.242,0.024c-4.813,0.253-8.654,4.236-8.654,9.111   c0,0.514,0.049,1.03,0.149,1.556c-4.399,0.655-7.785,4.458-7.785,9.037c0,0.554,0.061,1.118,0.184,1.706   c-2.827,2.293-4.486,5.738-4.486,9.414c0,3.159,1.266,6.193,3.505,8.463c-2.227,2.589-3.446,5.839-3.446,9.224   c0,4.669,2.231,8.929,6.027,11.621c-0.347,1.204-0.482,2.423-0.402,3.639c0.19,2.915,1.503,5.582,3.699,7.509   c2.196,1.928,5.015,2.879,7.926,2.693c0.455-0.03,0.919-0.096,1.4-0.199c2.138,3.834,6.186,6.247,10.646,6.247   c6.722,0,12.191-5.469,12.191-12.191V16.399C47.811,11.087,43.49,6.766,38.179,6.766z M44.811,82.317   c0,5.068-4.123,9.191-9.191,9.191c-3.697,0-7.02-2.2-8.464-5.604c-0.241-0.567-0.793-0.914-1.381-0.914   c-0.154,0-0.311,0.023-0.465,0.074c-0.724,0.235-1.338,0.363-1.933,0.402c-2.119,0.139-4.158-0.556-5.751-1.954   c-1.594-1.398-2.547-3.333-2.685-5.449c-0.076-1.16,0.125-2.336,0.598-3.495c0.007-0.017,0.005-0.036,0.011-0.053   c1.342-3.056,4.225-4.953,7.597-4.953c0.829,0,1.5-0.672,1.5-1.5s-0.671-1.5-1.5-1.5c-3.938,0-7.501,2.007-9.548,5.239   c-2.701-2.139-4.277-5.327-4.277-8.802c0-2.787,1.06-5.46,2.978-7.549c1.796,1.053,3.879,1.668,6.107,1.668   c6.685,0,12.123-5.438,12.123-12.123c0-0.829-0.671-1.5-1.5-1.5s-1.5,0.671-1.5,1.5c0,5.03-4.092,9.123-9.123,9.123   s-9.123-4.093-9.123-9.123c0-0.002-0.001-0.004-0.001-0.006c0.103-2.915,1.578-5.607,4.013-7.248   c0.553-0.372,0.793-1.064,0.591-1.699c-0.22-0.691-0.322-1.278-0.322-1.85c0-3.376,2.741-6.125,6.195-6.125   c0.007,0,0.015,0,0.022,0c0.103,0.014,0.206,0.027,0.311,0.034c0.485,0.03,0.948-0.171,1.254-0.542   c0.307-0.372,0.417-0.868,0.294-1.334c0-0.001-0.003-0.014-0.008-0.031c0.003-0.035,0.006-0.067,0.007-0.095   c0.005-0.18-0.022-0.359-0.081-0.529c-0.242-0.707-0.359-1.352-0.359-1.972c0-3.342,2.688-6.065,6.016-6.129   c3.328,0.065,6.016,2.787,6.016,6.13c0,0.829,0.671,1.5,1.5,1.5s1.5-0.671,1.5-1.5c0-3.391-1.861-6.35-4.612-7.926   c0.364-3.346,3.16-5.908,6.558-5.908c3.657,0,6.632,2.976,6.632,6.633V82.317z"/>
                            </g>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-3">Smart Discovery</h3>
                    <p class="text-white/90">Find local businesses by location, industry, and size. Our AI identifies the best prospects for your cleaning services.</p>
                </div>
                
                <div class="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hero-fade-in shadow-xl" style="animation-delay: 0.4s;">
                    <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg fill="#fff" class="w-8 h-8" viewBox="0 0 24 24">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-3">AI Outreach</h3>
                    <p class="text-white/90">Generate personalized emails that convert. Choose from friendly, professional, or direct tones for maximum impact.</p>
                </div>
                
                <div class="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hero-fade-in shadow-xl" style="animation-delay: 0.6s;">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg fill="#fff" class="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 13.75C20 13.3358 19.6642 13 19.25 13H16.25C15.8358 13 15.5 13.3358 15.5 13.75V20.5H14V4.25C14 3.52169 13.9984 3.05091 13.9518 2.70403C13.908 2.37872 13.8374 2.27676 13.7803 2.21967C13.7232 2.16258 13.6213 2.09197 13.296 2.04823C12.9491 2.00159 12.4783 2 11.75 2C11.0217 2 10.5509 2.00159 10.204 2.04823C9.87872 2.09197 9.77676 2.16258 9.71967 2.21967C9.66258 2.27676 9.59196 2.37872 9.54823 2.70403C9.50159 3.05091 9.5 3.52169 9.5 4.25V20.5H8V8.75C8 8.33579 7.66421 8 7.25 8H4.25C3.83579 8 3.5 8.33579 3.5 8.75V20.5H2H1.75C1.33579 20.5 1 20.8358 1 21.25C1 21.6642 1.33579 22 1.75 22H21.75C22.1642 22 22.5 21.6642 22.5 21.25C22.5 20.8358 22.1642 20.5 21.75 20.5H21.5H20V13.75Z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-3">Track Results</h3>
                    <p class="text-white/90">Monitor email opens, replies, and conversions. Optimize your campaigns with real-time analytics and insights.</p>
                </div>
            </div>

            <!-- Integrations -->
            <section class="py-12">
                <div class="max-w-6xl mx-auto px-6 text-center">
                    <h2 class="text-3xl font-bold mb-8 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-900 bg-clip-text text-transparent">Powered by Industry Leaders</h2>
                    <p class="text-lg max-w-2xl mx-auto my-4 text-black md:text-white">
                        Just some of the integrations we use in our software.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {#each integrations as item}
                        <div class="text-black/90 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm p-6 flex flex-col items-center hover:shadow-md transition">
                            <img src={item.logo} alt={item.name} class="h-12 mb-4 object-contain" />
                            <h3 class="font-semibold text-lg">{item.name}</h3>
                            <p class="text-sm mt-2">{item.description}</p>
                        </div>
                    {/each}
                    </div>
                </div>
            </section>
    </div>
</main>
<style>
  .hero-fade-in {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .video-overlay {
            background: linear-gradient(
                135deg,
                rgba(34, 197, 94, 0.15) 0%,
                rgba(21, 128, 61, 0.25) 50%,
                rgba(22, 163, 74, 0.2) 100%
            );
        }
</style>