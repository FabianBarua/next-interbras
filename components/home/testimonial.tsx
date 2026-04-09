{/* 
    este codigo es un renderizado final, recrea el documento para que haga esto, lo que to se que usa es Testimonials With Carousel
The component displays testimonials in a responsive three-column grid layout. Navigation buttons allow users to cycle through pages of testimonials. Each page transition uses Motion's AnimatePresence for smooth fade and blur animations.

Testimonials enter with a staggered delay, creating a cascading reveal effect. The exit animation mirrors the entrance with opacity fade, vertical movement, and blur filter. Pagination wraps around, so clicking next on the last page returns to the first.

Each testimonial card includes the quote text, user avatar, name, and optional designation. Cards use subtle shadow and ring styling with proper dark mode support. The layout is fully responsive, stacking on mobile and expanding to three columns on larger screens.

Good for SaaS landing pages, product pages, agency websites, and any design where you want to showcase customer feedback with elegant navigation.

    <section>
   <div class="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <p class="neutral-500 font-mono text-lg dark:text-neutral-400">Testimonials</p>
      <div class="mt-4 flex items-center justify-between gap-4">
         <h2 class="text-2xl font-medium tracking-tight text-black md:text-4xl lg:text-5xl dark:text-white">People love us, you know.</h2>
         <div class="flex items-center gap-2">
            <button type="button" aria-label="Previous testimonials" class="flex size-10 items-center justify-center rounded-full border border-black/15 text-black transition duration-200 hover:bg-black/5 active:scale-98 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
               <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
               </svg>
            </button>
            <button type="button" aria-label="Next testimonials" class="flex size-10 items-center justify-center rounded-full border border-black/15 text-black transition duration-200 hover:bg-black/5 active:scale-98 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
               <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"></path>
               </svg>
            </button>
         </div>
      </div>
      <div class="mt-8 grid gap-4 md:mt-12 md:grid-cols-3">
         <div class="flex h-full flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 shadow-black/10 ring-black/10 md:p-6 dark:bg-neutral-900 dark:shadow-white/10 dark:ring-white/5" style="opacity: 1; filter: blur(0px); transform: none;">
            <p class="text-base text-neutral-700 sm:text-2xl dark:text-neutral-300">The efficiency it brings is unmatched. It's a vital tool that has helped us cut costs significantly.</p>
            <div class="mt-14 flex items-center gap-3">
               <img alt="Eva Green" width="40" height="40" class="size-8 shrink-0 rounded-full object-cover" src="https://assets.aceternity.com/avatars/7.webp">
               <div class="flex flex-col"><span class="text-sm font-medium text-black dark:text-white">Eva Green</span><span class="text-xs text-neutral-500 dark:text-neutral-400">Operations Director</span></div>
            </div>
         </div>
         <div class="flex h-full flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 shadow-black/10 ring-black/10 md:p-6 dark:bg-neutral-900 dark:shadow-white/10 dark:ring-white/5" style="opacity: 1; filter: blur(0px); transform: none;">
            <p class="text-base text-neutral-700 sm:text-2xl dark:text-neutral-300">A robust solution that fits perfectly into our workflow. It has enhanced our team's capabilities greatly.</p>
            <div class="mt-14 flex items-center gap-3">
               <img alt="Frank Moore" width="40" height="40" class="size-8 shrink-0 rounded-full object-cover" src="https://assets.aceternity.com/avatars/8.webp">
               <div class="flex flex-col"><span class="text-sm font-medium text-black dark:text-white">Frank Moore</span><span class="text-xs text-neutral-500 dark:text-neutral-400">Project Manager</span></div>
            </div>
         </div>
         <div class="flex h-full flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 shadow-black/10 ring-black/10 md:p-6 dark:bg-neutral-900 dark:shadow-white/10 dark:ring-white/5" style="opacity: 1; filter: blur(0px); transform: none;">
            <p class="text-base text-neutral-700 sm:text-2xl dark:text-neutral-300">It's incredibly intuitive and easy to use. Even non-technical users can leverage its power effectively.</p>
            <div class="mt-14 flex items-center gap-3">
               <img alt="Grace Hall" width="40" height="40" class="size-8 shrink-0 rounded-full object-cover" src="https://assets.aceternity.com/avatars/9.webp">
               <div class="flex flex-col"><span class="text-sm font-medium text-black dark:text-white">Grace Hall</span><span class="text-xs text-neutral-500 dark:text-neutral-400">Marketing Specialist</span></div>
            </div>
         </div>
      </div>
   </div>
</section> */}