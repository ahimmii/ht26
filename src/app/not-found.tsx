import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-serif mt-4 text-5xl">This door is closed</h1>
      <Link href="/" className="btn-blood mt-10">
        Return
      </Link>
    </main>
  );
}
