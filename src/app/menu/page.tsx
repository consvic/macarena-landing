import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GelatoMenuResults } from "@/components/views/GelatoMenuResults";
import { GelatoMenuResultsLoading } from "@/components/views/GelatoMenuResultsLoading";
import { GelatoMenuShell } from "@/components/views/GelatoMenuShell";
import { getFlavors } from "@/lib/flavors/getFlavors";
import type { Flavor } from "@/lib/types";

export const dynamic = "force-dynamic";

type MenuFlavorResultsProps = {
  flavorsPromise: Promise<Flavor[]>;
};

async function MenuFlavorResults({ flavorsPromise }: MenuFlavorResultsProps) {
  const flavors = await flavorsPromise;

  return <GelatoMenuResults flavors={flavors} />;
}

export default function Page() {
  const MENU_ENABLED = process.env.MENU_ENABLED === "true";
  if (!MENU_ENABLED) {
    redirect("/");
  }

  const flavorsPromise = getFlavors();

  return (
    <GelatoMenuShell>
      <Suspense fallback={<GelatoMenuResultsLoading />}>
        <MenuFlavorResults flavorsPromise={flavorsPromise} />
      </Suspense>
    </GelatoMenuShell>
  );
}
