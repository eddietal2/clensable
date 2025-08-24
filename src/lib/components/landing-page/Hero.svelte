<script lang="ts">
    import { onMount } from 'svelte';
    onMount(() => {
        // Add intersection observer for scroll animations
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
        document.querySelectorAll('.hero-fade-in').forEach(el => {
            observer.observe(el);
        });
    });
</script>
<main>
    <div class="relative min-h-screen bg-gradient-to-br from-[#00CF68] via-[#187967] to-[#00CF68] overflow-hidden">
        <!-- Animated background elements -->
        <div class="absolute inset-0 opacity-10">
            <div class="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div class="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2s"></div>
            <div class="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4s"></div>
        </div>
        
        <!-- Content -->
        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            <div class="text-center">
                <!-- Badge -->
                <div class="inline-flex items-center px-4 py-2 rounded-full bg-white-500/20 border border-white backdrop-blur-sm mb-8 hero-fade-in">
                    <svg class="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span class="text-blue-100 text-sm font-medium">AI-Powered Lead Generation</span>
                </div>
                
                <!-- Main headline -->
                <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight hero-fade-in" style="animation-delay: 0.2s;">
                    Turn Local Businesses Into
                    <span class="bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-900 bg-clip-text text-transparent block mt-2">
                        Cleaning Clients
                    </span>
                </h1>
                
                <!-- Subheadline -->
                <p class="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed hero-fade-in" style="animation-delay: 0.4s;">
                    Clensable finds local businesses in your area, crafts personalized AI outreach emails, 
                    and automates your lead generation so you can focus on what you do best.
                </p>
                
                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12 hero-fade-in" style="animation-delay: 0.8s;">
                    <button id="primaryCTA" class="group relative px-8 py-4 bg-gradient-to-r from-yellow-700 via-yellow-700 to-yellow-800 text-white font-semibold rounded-xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300">
                        <span class="relative z-10 flex items-center justify-center">
                            Start Finding Clients Today
                            <svg class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </span>
                        <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    
                    <button id="secondaryCTA" class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                        Watch Demo
                    </button>
                </div>
            </div>
        </div>
    </div>
</main>
<style>
    .animation-delay-2s {
            animation-delay: 2s;
        }
        
        .animation-delay-4s {
            animation-delay: 4s;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        .hero-fade-in {
            opacity: 0;
            transform: translateY(30px);
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
</style>