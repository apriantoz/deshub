import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  tambahMataKuliah,
  ubahMataKuliah,
  hapusMataKuliah,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Prodi = { id: string; nama: string; singkatan: string | null };

function PilihanProdi({
  prodi,
  defaultValue,
}: {
  prodi: Prodi[];
  defaultValue?: string;
}) {
  return (
    <select
      name="prodi_id"
      defaultValue={defaultValue}
      required
      className="block rounded-md border px-3 py-2"
    >
      {!defaultValue && <option value="">Pilih prodi...</option>}
      {prodi.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nama}
        </option>
      ))}
    </select>
  );
}

function PilihanSemester({ defaultValue }: { defaultValue?: number }) {
  return (
    <select
      name="semester"
      defaultValue={defaultValue ?? 1}
      className="block rounded-md border px-3 py-2"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <option key={n} value={n}>
          Semester {n}
        </option>
      ))}
    </select>
  );
}

export default async function MataKuliahPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prodi?: string }>;
}) {
  const { error, prodi: filterProdi } = await searchParams;

  const supabase = await createClient();

  const { data: daftarProdi } = await supabase
    .from("prodi")
    .select("id, nama, singkatan")
    .order("nama");
  const prodi: Prodi[] = daftarProdi ?? [];

  let query = supabase
    .from("mata_kuliah")
    .select("id, nama, semester, prodi_id, prodi(nama, singkatan)")
    .order("semester")
    .order("nama");
  if (filterProdi) query = query.eq("prodi_id", filterProdi);

  const { data: mataKuliah, error: errBaca } = await query;

  return (
<main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Mata Kuliah
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola kurikulum mata kuliah, program studi terkait, dan alokasi semester.
        </p>
      </div>

      {/* Alert Error */}
      {(error || errBaca) && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <span>⚠️ {error ?? "Gagal membaca data mata kuliah."}</span>
        </div>
      )}

      {/* Alert jika prodi belum ada / Form Tambah Mata Kuliah */}
      {prodi.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-sm">
          <span>
            ⚠️ Belum ada prodi. Tambahkan prodi dulu di{" "}
            <Link
              href="/admin/prodi"
              className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              halaman Prodi
            </Link>
            .
          </span>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Tambah Mata Kuliah Baru
          </h2>
          <form action={tambahMataKuliah} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-1.5 text-sm">
              <label htmlFor="nama-matkul" className="block font-medium text-slate-700">
                Nama mata kuliah
              </label>
              <Input
                id="nama-matkul"
                name="nama"
                required
                minLength={3}
                maxLength={100}
                placeholder="Contoh: Pemrograman Web Lanjut"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5"
              />
            </div>

            <div className="space-y-1.5 text-sm">
              <label className="block font-medium text-slate-700">Prodi</label>
              <PilihanProdi prodi={prodi} />
            </div>

            <div className="space-y-1.5 text-sm">
              <label className="block font-medium text-slate-700">Semester</label>
              <PilihanSemester />
            </div>

            <Button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              Tambah Matkul
            </Button>
          </form>
        </section>
      )}

      {/* Filter per Prodi */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
        <div className="text-xs font-medium text-slate-500">
          Filter Tampilan
        </div>
        <form method="get" className="flex items-center gap-2 text-sm">
          <label htmlFor="filter-prodi" className="font-medium text-slate-700">
            Prodi:
          </label>
          <select
            id="filter-prodi"
            name="prodi"
            defaultValue={filterProdi ?? ""}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/5"
          >
            <option value="">Semua Prodi</option>
            {prodi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            variant="outline"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
          >
            Terapkan
          </Button>
        </form>
      </section>

      {/* Daftar Mata Kuliah */}
      <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-700">
            Daftar Mata Kuliah Terdaftar
          </h2>
        </div>

        {mataKuliah?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada mata kuliah yang sesuai filter.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mataKuliah?.map((m) => {
              // Relasi many-to-one: objek tunggal (jaga-jaga kalau berbentuk array)
              const p = Array.isArray(m.prodi) ? m.prodi[0] : m.prodi;
              return (
                <li
                  key={m.id}
                  className="p-4 transition hover:bg-slate-50/60 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-bold text-slate-900">
                        {m.nama}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {p?.singkatan ?? p?.nama ?? "-"}
                      </span>
                      <span className="text-xs text-slate-500">
                        Semester {m.semester}
                      </span>
                    </div>

                    <form action={hapusMataKuliah}>
                      <input type="hidden" name="id" value={m.id} />
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
                      <span>✏️ Ubah data mata kuliah ini</span>
                      <span className="transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-3 pt-3 border-t border-slate-200/60 bg-white p-3 rounded-lg">
                      <form
                        action={ubahMataKuliah}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <input type="hidden" name="id" value={m.id} />
                        <div className="min-w-48 flex-1 space-y-1 text-xs">
                          <label className="font-medium text-slate-600">
                            Nama mata kuliah
                          </label>
                          <Input
                            name="nama"
                            defaultValue={m.nama}
                            required
                            minLength={3}
                            maxLength={100}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-slate-600">Prodi</label>
                          <PilihanProdi prodi={prodi} defaultValue={m.prodi_id} />
                        </div>
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-slate-600">
                            Semester
                          </label>
                          <PilihanSemester defaultValue={m.semester} />
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
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
