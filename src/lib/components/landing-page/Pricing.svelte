<script lang="ts">
    import { onMount } from 'svelte';
    
    onMount(() => {
        // Small delay to ensure DOM is fully rendered
        setTimeout(() => {
            // Intersection Observer for fade-in animations
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, observerOptions);

            // Observe all fade-in elements
            const elements = document.querySelectorAll('.fade-in-up');
            elements.forEach(el => {
                observer.observe(el);
            });

            // Cleanup function
            return () => {
                elements.forEach(el => {
                    observer.unobserve(el);
                });
            };
        }, 100);
    });
</script>

<main>
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Section Header -->
            <div class="text-center mb-16 fade-in-up">
                
                <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    One Price.
                    <span class="bg-gradient-to-b from-[#00CF68] to-[#187967] bg-clip-text text-transparent">
                        Everything Included.
                    </span>
                </h2>
                
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    No hidden fees. Just one simple price that gives you 
                    everything you need to grow your cleaning business.
                </p>
            </div>
            
            <!-- Pricing Card -->
            <div class="max-w-lg mx-auto">
                <div class="price-card bg-white rounded-3xl p-8 border-2 border-blue-200 shadow-xl relative  fade-in-up delay-200">
                    <!-- Popular Badge -->
                    <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div class="bg-gradient-to-b from-yellow-700 via-yellow-700 to-yellow-800 text-white px-6 py-2 rounded-full text-sm font-semibold pulse-glow">
                            Free Trail
                        </div>
                    </div>
                    
                    <!-- Price -->
                    <div class="text-center mb-8">
                        <div class="flex items-center justify-center mb-2">
                            <span class="text-6xl font-bold text-gray-900">$75</span>
                            <span class="text-gray-600 text-xl ml-2">/month</span>
                        </div>
                        <p class="text-gray-500">Billed monthly, cancel anytime</p>
                    </div>
                    
                    <!-- Features List -->
                    <div class="space-y-4 mb-8">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <span class="text-gray-700">Unlimited lead discovery</span>
                        </div>
                        
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <span class="text-gray-700">AI-powered email generation</span>
                        </div>
                        
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <span class="text-gray-700">Automated email campaigns</span>
                        </div>
                        
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <span class="text-gray-700">Real-time analytics & tracking</span>
                        </div>
                        
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <span class="text-gray-700">Gmail & Outlook integration</span>
                        </div>
                        
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <span class="text-gray-700">Priority support</span>
                        </div>
                    </div>
                    
                    <!-- CTA Button -->
                    <a href="/sign-up">
                        <button id="pricingCTA" class="w-full bg-gradient-to-b from-[#00CF68] to-[#187967] text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 mb-4">
                        Get Started Today
                    </button>
                    </a>
                </div>
            </div>
            
            <!-- Value Proposition -->
            <div class="text-center mt-16 fade-in-up delay-400 bg-green-900/20 p-10 rounded-2xl">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div class="text-white/90 bg-black/60 backdrop-blur-md rounded-2xl text-center p-2">
                        <div class="text-3xl font-bold text-blue-300 mb-2">$2.50</div>
                        <div class="text-white font-bold">Cost per day</div>
                        <div class="text-sm text-white mt-1">Less than a coffee!</div>
                    </div>
                    
                    <div class="text-white/90 bg-black/60 backdrop-blur-md rounded-2xl text-center p-2">
                        <div class="text-3xl font-bold text-green-300 mb-2">10x</div>
                        <div class="text-white font-bold">ROI potential</div>
                        <div class="text-sm text-white mt-1">Just one new client pays for months of Clensable</div>
                    </div>
                    
                    <div class="text-white/90 bg-black/60 backdrop-blur-md rounded-2xl text-center p-2">
                        <div class="text-3xl font-bold text-purple-300 mb-2">20+</div>
                        <div class="text-white font-bold">Hours saved per week</div>
                        <div class="text-sm text-white mt-1">Focus on cleaning, not prospecting</div>
                    </div>
                </div>
            </div>
            
            <!-- FAQ -->
            <div class="mt-16 fade-in-up delay-600">
                <!-- Logo -->
                <div class="text-center px-4 py-2 mb-8 hero-fade-in">
                   <img src="logos/Complete_Logo_Green.png" class="h-12 mx-auto" alt="White Clensable Logo">
                </div>
                <h3 class="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="font-semibold text-green-900 mb-2">Can I cancel anytime?</h4>
                        <p class="text-gray-600 text-sm">Yes! Cancel your subscription anytime with no cancellation fees or penalties.</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="font-semibold text-green-900 mb-2">Is there a free trial?</h4>
                        <p class="text-gray-600 text-sm">We offer a 14-day free trail, so you can try Clensable risk-free. On day 15 you will be billed.</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="font-semibold text-green-900 mb-2">How many emails can I send?</h4>
                        <p class="text-gray-600 text-sm">Unlimited! Send as many personalized outreach emails as you need to grow your business.</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="font-semibold text-green-900 mb-2">Do you offer support?</h4>
                        <p class="text-gray-600 text-sm">Yes! All subscribers get priority email support and access to our knowledge base.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<style>
    :global(.fade-in-up) {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    :global(.fade-in-up.animate-in) {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Delay classes */
    :global(.fade-in-up.delay-200.animate-in) {
        transition-delay: 0.2s;
    }
    
    :global(.fade-in-up.delay-400.animate-in) {
        transition-delay: 0.4s;
    }
    
    :global(.fade-in-up.delay-600.animate-in) {
        transition-delay: 0.6s;
    }
    
    .price-card {
        transform: scale(1);
        transition: all 0.3s ease;
    }
    
    .price-card:hover {
        transform: scale(1.02);
    }
    
    .pulse-glow {
        animation: pulse-glow 2s infinite;
    }
    
    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(180, 165, 1, 0.4);
        }
        50% {
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
        }
    }
</style>