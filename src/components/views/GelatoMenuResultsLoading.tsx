const MENU_SKELETON_CARDS = [0, 1, 2, 3, 4, 5] as const;

export function GelatoMenuResultsLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando sabores"
      className="mx-auto max-w-6xl px-6 py-12"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-serif text-3xl text-royal-blue">
            Sabores disponibles
          </h2>
          <p className="mt-2 max-w-xl text-sm text-oxford-black/70">
            Cargando el menu de sabores.
          </p>
        </div>
        <p className="text-sm text-ochre">Preparando resultados</p>
      </div>

      <div className="mt-8 rounded-3xl border border-ochre/20 bg-white/70 p-5">
        <div className="h-3 w-32 rounded-full bg-ochre/20" />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-12 w-full rounded-full bg-cream-white" />
          <div className="h-10 min-w-[118px] rounded-full border border-royal-blue/20 bg-royal-blue/5" />
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MENU_SKELETON_CARDS.map((card) => (
          <article
            className="overflow-hidden rounded-3xl border border-ochre/20 bg-white"
            key={card}
          >
            <div className="h-52 bg-gradient-to-br from-ochre/15 to-terracotta/15 md:h-56" />
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="h-3 w-24 rounded-full bg-ochre/20" />
                  <div className="h-7 w-36 rounded-full bg-royal-blue/10" />
                </div>
                <div className="h-8 w-20 rounded-full border border-royal-blue/10 bg-royal-blue/5" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-cream-white" />
                <div className="h-3 w-4/5 rounded-full bg-cream-white" />
              </div>
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded-full bg-cream-white" />
                <div className="h-7 w-20 rounded-full bg-cream-white" />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 pt-2">
                <div className="h-11 rounded-full border border-royal-blue/10 bg-royal-blue/5" />
                <div className="h-11 w-32 rounded-full bg-royal-blue/10" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
