// app/fire/page.tsx
import { redirect } from "next/navigation";
import AdSlot from "@/components/AdSlot";

export default function FireRedirectPage() {
  redirect("/fire-calculator");
}

