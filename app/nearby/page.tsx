import { redirect } from "next/navigation";

export default function NearbyRedirect() {
  redirect("/chat?tab=nearby");
}
