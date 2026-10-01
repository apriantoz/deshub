import { createClient } from "@/lib/supabase/server";
import {
  tambahPeriode,
  ubahPeriode,
  aktifkanPeriode,
  hapusPeriode,
} from "./actions";
import { tanggalPendek } from "@/lib/waktu";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
<form
      action={aksi}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {id && <input type="hidden" name="id" value={id} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tahun Ajaran */}
        <div className="space-y-1.5 text-sm">
          <label
            htmlFor="tahun_ajaran"
            className="block font-medium text-slate-700"
          >
            Tahun ajaran
          </label>
          <input
            id="tahun_ajaran"
            name="tahun_ajaran"
            placeholder="2026/2027"
            required
            pattern="\d{4}/\d{4}"
            defaultValue={nilai?.tahun_ajaran ?? ""}
            className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5 ${kelas ?? ""}`}
          />
        </div>

        {/* Semester */}
        <div className="space-y-1.5 text-sm">
          <label htmlFor="jenis" className="block font-medium text-slate-700">
            Semester
          </label>
          <select
            id="jenis"
            name="jenis"
            defaultValue={nilai?.jenis ?? "GASAL"}
            className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5 ${kelas ?? ""}`}
          >
            <option value="GASAL">Gasal</option>
            <option value="GENAP">Genap</option>
          </select>
        </div>

        {/* Tanggal Mulai */}
        <div className="space-y-1.5 text-sm">
          <label
            htmlFor="tanggal_mulai"
            className="block font-medium text-slate-700"
          >
            Tanggal mulai
          </label>
          <input
            id="tanggal_mulai"
            name="tanggal_mulai"
            type="date"
            required
            defaultValue={nilai?.tanggal_mulai ?? ""}
            className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5 ${kelas ?? ""}`}
          />
        </div>

        {/* Tanggal Selesai */}
        <div className="space-y-1.5 text-sm">
          <label
            htmlFor="tanggal_selesai"
            className="block font-medium text-slate-700"
          >
            Tanggal selesai
          </label>
          <input
            id="tanggal_selesai"
            name="tanggal_selesai"
            type="date"
            required
            defaultValue={nilai?.tanggal_selesai ?? ""}
            className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5 ${kelas ?? ""}`}
          />
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          {tombol}
        </button>
      </div>
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
<main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Periode Akademik
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola tahun ajaran, semester, dan jadwal rentang waktu aktif.
        </p>
      </div>

      {/* Alert Error */}
      {(error || errBaca) && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <span>⚠️ {error ?? "Gagal membaca data periode."}</span>
        </div>
      )}

      {/* Form Tambah Periode */}
      <Card className="rounded-2xl border-slate-200/90 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Tambah Periode Baru
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            * Rentang tanggal dipakai pada tampilan publik dan pengecekan bentrok peminjaman. Tidak boleh tumpang tindih dengan periode lain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormPeriode aksi={tambahPeriode} tombol="Tambah Periode" />
        </CardContent>
      </Card>

      {/* Daftar Periode */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Daftar Periode Akademik
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {periode?.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                Belum ada periode. Tambahkan periode pertama Anda di atas.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {periode?.map((p) => (
                <li
                  key={p.id}
                  className="p-4 transition hover:bg-slate-50/60 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Informasi Periode */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-bold text-slate-900">
                          {p.tahun_ajaran} {p.jenis === "GASAL" ? "Gasal" : "Genap"}
                        </span>
                        {p.aktif ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700"
                          >
                            ● Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-100 text-slate-500"
                          >
                            Nonaktif
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-slate-500">
                        {p.tanggal_mulai && p.tanggal_selesai ? (
                          <span className="font-medium text-slate-600">
                            {tanggalPendek(p.tanggal_mulai)} —{" "}
                            {tanggalPendek(p.tanggal_selesai)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            ⚠️ Tanggal belum diatur (buka Ubah untuk mengisi)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {!p.aktif && (
                        <form action={aktifkanPeriode}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button
                            type="submit"
                            variant="outline"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950/10"
                          >
                            Aktifkan
                          </Button>
                        </form>
                      )}
                      <form action={hapusPeriode}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          className="rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          Hapus
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Section Accordion / Ubah Data */}
                  <details className="group mt-4 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-600 transition hover:text-slate-900 select-none">
                      <span>✏️ Ubah data periode ini</span>
                      <span className="transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-3 rounded-lg border border-slate-200/60 bg-white p-3 pt-3">
                      <FormPeriode
                        aksi={ubahPeriode}
                        tombol="Simpan Perubahan"
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
          )}
        </CardContent>
      </Card>
    </main>
  );
}
