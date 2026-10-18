import AuthForm from "@/components/AuthForm";

export default function Page({ searchParams }: { searchParams: { token?: string } }) {
  if (!searchParams.token) return <p className="text-center">This reset link is incomplete. Request a new one from the sign-in page.</p>;
  return <AuthForm mode="reset" token={searchParams.token} />;
}
