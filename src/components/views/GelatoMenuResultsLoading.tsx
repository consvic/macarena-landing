const MENU_SKELETON_CARDS = [0, 1, 2, 3, 4, 5] as const;

// Opacity-only pulse, matching the admin skeletons (see plans/008): it reads as
// "loading" rather than "broken", and stays on under prefers-reduced-motion.
function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse ${className}`} />;
}

export function GelatoMenuResultsLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando sabores"
      className="container mx-auto px-6 py-16"
    >
      <h2 className="font-serif text-3xl font-bold text-royal-blue md:text-4xl">
        Sabores disponibles
      </h2>
      <p className="mt-3 max-w-[52ch] leading-relaxed text-oxford-black/75">
        Cargando el menú de sabores…
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-28 rounded-full bg-royal-blue/10" />
          <SkeletonBlock className="mt-2 h-12 w-full rounded-full border border-ochre/25 bg-white" />
        </div>
        <SkeletonBlock className="h-10 w-32 shrink-0 rounded-full border border-royal-blue/20 bg-royal-blue/5 sm:mt-7" />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MENU_SKELETON_CARDS.map((card) => (
          <article
            className="overflow-hidden rounded-3xl border border-ochre/20 bg-white"
            key={card}
          >
            <SkeletonBlock className="h-52 bg-gradient-to-br from-ochre/15 to-terracotta/15 md:h-56" />
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <SkeletonBlock className="h-3 w-24 rounded-full bg-ochre/20" />
                  <SkeletonBlock className="h-7 w-36 rounded-full bg-royal-blue/10" />
                </div>
                <SkeletonBlock className="h-8 w-20 rounded-full border border-royal-blue/10 bg-royal-blue/5" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-full rounded-full bg-cream-white" />
                <SkeletonBlock className="h-3 w-4/5 rounded-full bg-cream-white" />
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-7 w-16 rounded-full bg-cream-white" />
                <SkeletonBlock className="h-7 w-20 rounded-full bg-cream-white" />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 pt-2">
                <SkeletonBlock className="h-11 rounded-full border border-royal-blue/10 bg-royal-blue/5" />
                <SkeletonBlock className="h-11 w-32 rounded-full bg-royal-blue/10" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
