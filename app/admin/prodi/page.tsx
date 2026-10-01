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
<main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Program Studi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola daftar program studi dan singkatannya.
        </p>
      </div>

      {/* Alert Error */}
      {(error || errBaca) && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <span>⚠️ {error ?? "Gagal membaca data prodi."}</span>
        </div>
      )}

      {/* Form Tambah Prodi */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Tambah Program Studi Baru
        </h2>
        <form action={tambahProdi} className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1 space-y-1.5 text-sm">
            <label htmlFor="nama-prodi" className="block font-medium text-slate-700">
              Nama prodi
            </label>
            <Input
              id="nama-prodi"
              name="nama"
              required
              minLength={3}
              maxLength={100}
              placeholder="Contoh: Desain Komunikasi Visual"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <div className="w-full sm:w-40 space-y-1.5 text-sm">
            <label htmlFor="singkatan-prodi" className="block font-medium text-slate-700">
              Singkatan <span className="text-xs font-normal text-slate-400">(opsional)</span>
            </label>
            <Input
              id="singkatan-prodi"
              name="singkatan"
              maxLength={10}
              placeholder="DKV"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <Button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          >
            Tambah Prodi
          </Button>
        </form>
      </section>

      {/* Daftar Prodi */}
      <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-700">
            Daftar Program Studi
          </h2>
        </div>

        {prodi?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada prodi. Tambahkan prodi pertama Anda di atas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {prodi?.map((p) => (
              <li
                key={p.id}
                className="p-4 transition hover:bg-slate-50/60 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-bold text-slate-900">
                      {p.nama}
                    </span>
                    {p.singkatan && (
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {p.singkatan}
                      </span>
                    )}
                  </div>

                  <form action={hapusProdi}>
                    <Input type="hidden" name="id" value={p.id} />
                    <Button
                      variant="destructive"
                      className="rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      Hapus
                    </Button>
                  </form>
                </div>

                {/* Section Accordion / Ubah Data */}
                <details className="group mt-4 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-600 transition hover:text-slate-900 select-none">
                    <span>✏️ Ubah data prodi ini</span>
                    <span className="transition group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 bg-white p-3 rounded-lg">
                    <form
                      action={ubahProdi}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <Input type="hidden" name="id" value={p.id} />
                      <div className="min-w-64 flex-1 space-y-1 text-xs">
                        <label className="font-medium text-slate-600">Nama prodi</label>
                        <Input
                          name="nama"
                          defaultValue={p.nama}
                          required
                          minLength={3}
                          maxLength={100}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div className="w-32 space-y-1 text-xs">
                        <label className="font-medium text-slate-600">Singkatan</label>
                        <Input
                          name="singkatan"
                          defaultValue={p.singkatan ?? ""}
                          maxLength={10}
                          placeholder="Singkatan"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        Simpan Perubahan
                      </Button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
