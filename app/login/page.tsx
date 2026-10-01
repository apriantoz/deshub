import { login } from "./actions";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Deshub Admin</h1>

        {error && (
          <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
            Email atau password salah.
          </p>
        )}

        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </label>

        <Button
          type="submit"
          className="w-full"
        >
          Masuk
        </Button>
      </form>
    </main>
  );
}
