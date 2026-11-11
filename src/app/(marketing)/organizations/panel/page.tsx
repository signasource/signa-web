import { redirect } from "next/navigation";

/** Old entry point of the organization panel; the panel now lives at /dashboard. */
export default function OrgPanelPage() {
  redirect("/dashboard");
}
