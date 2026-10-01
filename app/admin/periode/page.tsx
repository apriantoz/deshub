import { createClient } from "@/lib/supabase/server";
import {
  tambahPeriode,
  ubahPeriode,
  aktifkanPeriode,
  hapusPeriode,
} from "./actions";
import { tanggalPendek } from "@/lib/waktu";

type Nilai = {
  tahun_ajaran: string;
  jenis: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
};

function FormPeriode({
  aksi,
  tombol,
  id,
  nilai,
}: {
  aksi: (formData: FormData) => Promise<void>;
  tombol: string;
  id?: string;
  nilai?: Nilai;
}) {
  const kelas = "block rounded-md border px-3 py-2";
  return (
    <form action={aksi} className="flex flex-wrap items-end gap-3">
      {id && <input type="hidden" name="id" value={id} />}

      <label className="space-y-1 text-sm">
        <span>Tahun ajaran</span>
        <input
          name="tahun_ajaran"
          placeholder="2026/2027"
          required
          pattern="\d{4}/\d{4}"
          defaultValue={nilai?.tahun_ajaran ?? ""}
          className={kelas}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span>Semester</span>
        <select name="jenis" defaultValue={nilai?.jenis ?? "GASAL"} className={kelas}>
          <option value="GASAL">Gasal</option>
          <option value="GENAP">Genap</option>
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>Tanggal mulai</span>
        <input
          name="tanggal_mulai"
          type="date"
          required
          defaultValue={nilai?.tanggal_mulai ?? ""}
          className={kelas}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span>Tanggal selesai</span>
        <input
          name="tanggal_selesai"
          type="date"
          required
          defaultValue={nilai?.tanggal_selesai ?? ""}
          className={kelas}
        />
      </label>

      <button className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
        {tombol}
      </button>
    </form>
  );
}

export default async function PeriodePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: periode, error: errBaca } = await supabase
    .from("periode_akademik")
    .select("id, tahun_ajaran, jenis, aktif, tanggal_mulai, tanggal_selesai")
    .order("tahun_ajaran", { ascending: false })
    .order("jenis");

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Periode Akademik</h1>

      {(error || errBaca) && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error ?? "Gagal membaca data periode."}
        </p>
      )}

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium">Tambah periode</h2>
        <FormPeriode aksi={tambahPeriode} tombol="Tambah" />
        <p className="mt-2 text-xs text-gray-500">
          Rentang tanggal dipakai tampilan publik dan pengecekan bentrok peminjaman,
          dan tidak boleh tumpang tindih dengan periode lain.
        </p>
      </div>

      <div className="rounded-xl border bg-white">
        {periode?.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Belum ada periode. Tambahkan yang pertama di atas.
          </p>
        )}

        <ul className="divide-y">
          {periode?.map((p) => (
            <li key={p.id} className="p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {p.tahun_ajaran} {p.jenis === "GASAL" ? "Gasal" : "Genap"}
                    </span>
                    {p.aktif ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-gray-400">Nonaktif</span>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {p.tanggal_mulai && p.tanggal_selesai ? (
                      <>
                        {tanggalPendek(p.tanggal_mulai)} -{" "}
                        {tanggalPendek(p.tanggal_selesai)}
                      </>
                    ) : (
                      <span className="text-amber-700">
                        Tanggal belum diatur (buka Ubah untuk mengisi)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!p.aktif && (
                    <form action={aktifkanPeriode}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-md border px-2 py-1 hover:bg-gray-100">
                        Aktifkan
                      </button>
                    </form>
                  )}
                  <form action={hapusPeriode}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="rounded-md border px-2 py-1 text-red-700 hover:bg-red-50">
                      Hapus
                    </button>
                  </form>
                </div>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-gray-600 hover:underline">
                  Ubah
                </summary>
                <div className="mt-2">
                  <FormPeriode
                    aksi={ubahPeriode}
                    tombol="Simpan"
                    id={p.id}
                    nilai={{
                      tahun_ajaran: p.tahun_ajaran,
                      jenis: p.jenis,
                      tanggal_mulai: p.tanggal_mulai,
                      tanggal_selesai: p.tanggal_selesai,
                    }}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
