"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-ink/70 hover:text-ink"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
