import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cariPeriode } from "@/lib/periode";
import {
  BarisPenggunaan,
  type Penggunaan,
} from "@/components/baris-penggunaan";
import {
  geserTanggal,
  hariDariTanggal,
  hariIni,
  labelTanggal,
  tanggalValid,
} from "@/lib/waktu";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logout } from "../login/actions";

const satu = <T,>(x: T | T[] | null | undefined): T | undefined =>
  Array.isArray(x) ? x[0] : (x ?? undefined);

export default async function Beranda({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string; jenis?: string }>;
}) {
  const sp = await searchParams;
  const tanggal = sp.tanggal && tanggalValid(sp.tanggal) ? sp.tanggal : hariIni();
  const filter = sp.jenis === "LAB" || sp.jenis === "UMUM" ? sp.jenis : "";
  const hari = hariDariTanggal(tanggal);

  const supabase = await createClient();

  const { data: dataRuang } = await supabase
    .from("ruang")
    .select("id, nama, jenis, lantai, kapasitas")
    .order("nama");
  const ruang = (dataRuang ?? []).filter((r) =>
    filter === "" ? true : filter === "LAB" ? r.jenis === "LAB" : r.jenis !== "LAB",
  );

  // Periode yang berlaku pada tanggal yang dipilih (null kalau di luar semua periode)
  const aktif = await cariPeriode(supabase, tanggal);

  const pakai = new Map<string, Penggunaan[]>();
  const tambah = (ruangId: string, p: Penggunaan) => {
    const arr = pakai.get(ruangId) ?? [];
    arr.push(p);
    pakai.set(ruangId, arr);
  };

  // Jadwal kuliah pada hari itu (periode aktif)
  if (aktif && hari) {
    const { data: jadwal } = await supabase
      .from("jadwal")
      .select("ruang_id, jam_mulai, jam_selesai, mata_kuliah(nama, prodi(nama, singkatan))")
      .eq("periode_id", aktif.id)
      .eq("hari", hari);

    for (const j of jadwal ?? []) {
      const mk = satu(j.mata_kuliah);
      const pr = satu(mk?.prodi);
      tambah(j.ruang_id, {
        jamMulai: j.jam_mulai,
        jamSelesai: j.jam_selesai,
        judul: mk?.nama ?? "Kuliah",
        keterangan: `Prodi ${pr?.singkatan ?? pr?.nama ?? "-"}`,
        tipe: "KULIAH",
      });
    }
  }

  // Peminjaman yang sudah disetujui pada tanggal itu
  const { data: pinjam } = await supabase
    .from("peminjaman")
    .select("ruang_id, jam_mulai, jam_selesai, peminjam, keperluan")
    .eq("status", "DISETUJUI")
    .eq("tanggal", tanggal);

  for (const p of pinjam ?? []) {
    tambah(p.ruang_id, {
      jamMulai: p.jam_mulai,
      jamSelesai: p.jam_selesai,
      judul: p.keperluan,
      keterangan: `Dipinjam: ${p.peminjam}`,
      tipe: "PINJAM",
    });
  }

  const href = (t: string) =>
    `/?tanggal=${t}${filter ? `&jenis=${filter}` : ""}`;

  return (
<main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header Utama */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Deshub: Jadwal Ruang
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring ketersediaan dan penggunaan ruang secara real-time
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          Masuk admin
        </Link>
              <form action={logout}>
        <button className="rounded-md border px-3 py-2 hover:bg-gray-100">
          Keluar
        </button>
      </form>
      </header>

      {/* Filter & Navigasi Tanggal */}
      <div className="sticky top-4 z-10 backdrop-blur">
        <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Navigasi Cepat */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={href(geserTanggal(tanggal, -1))}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              ← Sebelumnya
            </Link>
            <Link
              href={href(hariIni())}
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Hari ini
            </Link>
            <Link
              href={href(geserTanggal(tanggal, 1))}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Berikutnya →
            </Link>
          </div>

          {/* Form Filter */}
          <form
            method="get"
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="tanggal" className="font-medium text-slate-600">
                Tanggal:
              </label>
              <input
                id="tanggal"
                type="date"
                name="tanggal"
                defaultValue={tanggal}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="jenis" className="font-medium text-slate-600">
                Jenis:
              </label>
              <select
                id="jenis"
                name="jenis"
                defaultValue={filter}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none"
              >
                <option value="">Semua ruang</option>
                <option value="UMUM">Ruang umum &amp; teleconference</option>
                <option value="LAB">Lab komputer</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200 focus:outline-none"
            >
              Tampilkan
            </button>
          </form>
        </Card>
      </div>

      {/* Info Tanggal & Status Akademik */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          {labelTanggal(tanggal)}
        </h2>

        {!aktif && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            <span className="font-semibold">Info:</span> Tanggal ini berada di
            luar periode akademik, jadi tidak ada jadwal kuliah reguler dan
            hanya peminjaman yang ditampilkan.
          </div>
        )}
        {aktif && hari === null && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
            Hari Minggu tidak ada jadwal kuliah reguler.
          </div>
        )}
      </div>

      {/* Grid Ruangan */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {ruang.map((r) => {
          const daftar = (pakai.get(r.id) ?? []).sort(
            (a, b) => a.jamMulai - b.jamMulai,
          );
          return (
            <Card
              key={r.id}
              className="flex flex-col justify-between transition"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold ">
                    <Link
                      href={`/ruang/${r.id}`}
                      className="transition hover:text-blue-600 hover:underline"
                    >
                      {r.nama}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                    {r.lantai !== null && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                        Lantai {r.lantai}
                      </span>
                    )}
                    {r.kapasitas !== null && (
                      <span>Kap. {r.kapasitas} orang</span>
                    )}
                  </CardDescription>
                </div>

                <CardAction>
                  <Badge
                    variant={daftar.length === 0 ? "outline" : "default"}
                    className={
                      daftar.length === 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
                    }
                  >
                    {daftar.length === 0 ? "Kosong" : `${daftar.length} Sesi`}
                  </Badge>
                </CardAction>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="mb-3 border-t border-slate-100" />

                {/* Daftar Sesi / Kosong */}
                {daftar.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-xl bg-slate-50 text-center">
                    <p className="text-xs font-medium text-emerald-700">
                      Tidak ada penggunaan pada hari ini.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {daftar.map((p, i) => (
                      <BarisPenggunaan key={i} p={p} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
