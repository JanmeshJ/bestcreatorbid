import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function CancelledPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <div className="flex justify-center">
        <Logo />
      </div>
      <h1 className="mt-8 text-4xl font-black tracking-tight">Payment cancelled.</h1>
      <p className="mt-3 text-muted">Nothing was charged. The board did not change.</p>
      <Button asChild className="mt-8">
        <Link href="/#bid">Try again</Link>
      </Button>
    </main>
  );
}
