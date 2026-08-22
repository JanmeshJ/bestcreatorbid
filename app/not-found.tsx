import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-4xl font-black tracking-tight">This creator isn&apos;t on the board.</h1>
      <p className="mt-3 text-muted">Either they never bid, or they were removed.</p>
      <Button asChild className="mt-8">
        <Link href="/#bid">Put someone on the board</Link>
      </Button>
    </main>
  );
}
