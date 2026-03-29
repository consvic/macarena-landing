import { redirect } from "next/navigation";
import GelatoMenuPage from "@/components/views/GelatoMenuPage";
import { getFlavors } from "@/lib/flavors/getFlavors";

export const dynamic = "force-dynamic";

export default async function Page() {
  const MENU_ENABLED = process.env.MENU_ENABLED === "true";
  if (!MENU_ENABLED) {
    redirect("/");
  }

  const flavors = await getFlavors();

  return <GelatoMenuPage flavors={flavors} />;
}
