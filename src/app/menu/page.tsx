import { redirect } from "next/navigation";
import GelatoMenuPage from "@/components/views/GelatoMenuPage";

export default function Page() {
  const MENU_ENABLED = process.env.MENU_ENABLED === "true";
  if (!MENU_ENABLED) {
    redirect("/");
  }

  return <GelatoMenuPage />;
}
