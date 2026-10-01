import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  tambahMataKuliah,
  ubahMataKuliah,
  hapusMataKuliah,
} from "./actions";

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
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Mata Kuliah</h1>

      {(error || errBaca) && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error ?? "Gagal membaca data mata kuliah."}
        </p>
      )}

      {prodi.length === 0 ? (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Belum ada prodi. Tambahkan prodi dulu di{" "}
          <Link href="/admin/prodi" className="underline">
            halaman Prodi
          </Link>
          .
        </p>
      ) : (
        <form
          action={tambahMataKuliah}
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
        >
          <label className="min-w-48 flex-1 space-y-1 text-sm">
            <span>Nama mata kuliah</span>
            <input
              name="nama"
              required
              minLength={3}
              maxLength={100}
              className="block w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Prodi</span>
            <PilihanProdi prodi={prodi} />
          </label>
          <label className="space-y-1 text-sm">
            <span>Semester</span>
            <PilihanSemester />
          </label>
          <button className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
            Tambah
          </button>
        </form>
      )}

      {/* Filter per prodi: form GET biasa, tanpa JavaScript */}
      <form method="get" className="flex items-end gap-2 text-sm">
        <label className="space-y-1">
          <span>Tampilkan prodi</span>
          <select
            name="prodi"
            defaultValue={filterProdi ?? ""}
            className="block rounded-md border px-3 py-2"
          >
            <option value="">Semua</option>
            {prodi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-md border px-3 py-2 hover:bg-gray-100">
          Terapkan
        </button>
      </form>

      <div className="rounded-xl border bg-white">
        {mataKuliah?.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Belum ada mata kuliah.
          </p>
        )}

        <ul className="divide-y">
          {mataKuliah?.map((m) => {
            // Relasi many-to-one: objek tunggal (jaga-jaga kalau berbentuk array)
            const p = Array.isArray(m.prodi) ? m.prodi[0] : m.prodi;
            return (
              <li key={m.id} className="p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.nama}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      {p?.singkatan ?? p?.nama ?? "-"}
                    </span>
                    <span className="text-gray-500">Semester {m.semester}</span>
                  </div>

                  <form action={hapusMataKuliah}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="rounded-md border px-2 py-1 text-red-700 hover:bg-red-50">
                      Hapus
                    </button>
                  </form>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600 hover:underline">
                    Ubah
                  </summary>
                  <form
                    action={ubahMataKuliah}
                    className="mt-2 flex flex-wrap items-end gap-3"
                  >
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      name="nama"
                      defaultValue={m.nama}
                      required
                      minLength={3}
                      maxLength={100}
                      className="min-w-48 flex-1 rounded-md border px-3 py-2"
                    />
                    <PilihanProdi prodi={prodi} defaultValue={m.prodi_id} />
                    <PilihanSemester defaultValue={m.semester} />
                    <button className="rounded-md bg-black px-3 py-2 text-white hover:bg-gray-800">
                      Simpan
                    </button>
                  </form>
                </details>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
