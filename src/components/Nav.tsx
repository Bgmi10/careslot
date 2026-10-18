import Link from "next/link";
import { getUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const user = await getUser();
  return (
    <header className="border-b border-ink/10 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">CareSlot</Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/">Services</Link>
          {user ? (
            <>
              <Link href="/bookings">My bookings</Link>
              {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="btn-primary">Create account</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
