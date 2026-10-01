import { createClient } from "@/lib/supabase/server";
import { tambahProdi, ubahProdi, hapusProdi } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ProdiPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: prodi, error: errBaca } = await supabase
    .from("prodi")
    .select("id, nama, singkatan")
    .order("nama");

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Program Studi</h1>

      {(error || errBaca) && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error ?? "Gagal membaca data prodi."}
        </p>
      )}

      <form
        action={tambahProdi}
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
      >
        <label className="min-w-64 flex-1 space-y-1 text-sm">
          <span>Nama prodi</span>
          <Input
            name="nama"
            required
            minLength={3}
            maxLength={100}
            className="block w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Singkatan (opsional)</span>
          <Input
            name="singkatan"
            maxLength={10}
            className="block w-32 rounded-md border px-3 py-2"
          />
        </label>

        <Button type="submit">
          Tambah
        </Button>
      </form>

      <div className="rounded-xl border bg-white">
        {prodi?.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Belum ada prodi. Tambahkan yang pertama di atas.
          </p>
        )}

        <ul className="divide-y">
          {prodi?.map((p) => (
            <li key={p.id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{p.nama}</span>
                  {p.singkatan && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      {p.singkatan}
                    </span>
                  )}
                </div>

                <form action={hapusProdi}>
                  <Input type="hidden" name="id" value={p.id} />
                  <Button variant="destructive">
                    Hapus
                  </Button>
                </form>
              </div>

              {/* Ubah: dibuka dengan <details>, tanpa JavaScript */}
              <details className="mt-2">
                <summary className="cursor-pointer text-gray-600 hover:underline">
                  Ubah
                </summary>
                <form
                  action={ubahProdi}
                  className="mt-2 flex flex-wrap items-end gap-3"
                >
                  <Input type="hidden" name="id" value={p.id} />
                  <Input
                    name="nama"
                    defaultValue={p.nama}
                    required
                    minLength={3}
                    maxLength={100}
                    className="min-w-64 flex-1 rounded-md border px-3 py-2"
                  />
                  <Input
                    name="singkatan"
                    defaultValue={p.singkatan ?? ""}
                    maxLength={10}
                    placeholder="Singkatan"
                    className="w-32 rounded-md border px-3 py-2"
                  />
                  <Button type="submit">
                    Simpan
                  </Button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
