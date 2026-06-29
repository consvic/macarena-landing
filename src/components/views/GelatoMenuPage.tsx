import { GelatoMenuResults } from "@/components/views/GelatoMenuResults";
import { GelatoMenuShell } from "@/components/views/GelatoMenuShell";
import type { Flavor } from "@/lib/types";

type GelatoMenuPageProps = {
  flavors: Flavor[];
};

export default function GelatoMenuPage({ flavors }: GelatoMenuPageProps) {
  return (
    <GelatoMenuShell>
      <GelatoMenuResults flavors={flavors} />
    </GelatoMenuShell>
  );
}
