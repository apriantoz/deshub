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
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Deshub: Jadwal Ruang</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          Masuk admin
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={href(geserTanggal(tanggal, -1))}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
        >
          ← Sebelumnya
        </Link>
        <Link
          href={href(hariIni())}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
        >
          Hari ini
        </Link>
        <Link
          href={href(geserTanggal(tanggal, 1))}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
        >
          Berikutnya →
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <label className="space-y-1">
          <span>Tanggal</span>
          <input
            type="date"
            name="tanggal"
            defaultValue={tanggal}
            className="block rounded-md border px-3 py-2"
          />
        </label>
        <label className="space-y-1">
          <span>Jenis ruang</span>
          <select
            name="jenis"
            defaultValue={filter}
            className="block rounded-md border px-3 py-2"
          >
            <option value="">Semua ruang</option>
            <option value="UMUM">Ruang umum &amp; teleconference</option>
            <option value="LAB">Lab komputer</option>
          </select>
        </label>
        <button className="rounded-md border px-3 py-2 hover:bg-gray-100">
          Tampilkan
        </button>
      </form>

      <h2 className="text-lg font-medium">{labelTanggal(tanggal)}</h2>

      {!aktif && (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Tanggal ini berada di luar periode akademik, jadi tidak ada jadwal kuliah
          reguler dan hanya peminjaman yang ditampilkan.
        </p>
      )}
      {aktif && hari === null && (
        <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-700">
          Hari Minggu tidak ada jadwal kuliah reguler.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ruang.map((r) => {
          const daftar = (pakai.get(r.id) ?? []).sort(
            (a, b) => a.jamMulai - b.jamMulai,
          );
          return (
            <section key={r.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  <Link href={`/ruang/${r.id}`} className="hover:underline">
                    {r.nama}
                  </Link>
                </h3>
                <span className="text-xs text-gray-500">
                  {r.lantai !== null ? `Lantai ${r.lantai}` : ""}
                  {r.kapasitas !== null ? ` · ${r.kapasitas} orang` : ""}
                </span>
              </div>

              {daftar.length === 0 ? (
                <p className="mt-2 text-sm text-green-700">
                  Tidak ada penggunaan pada hari ini.
                </p>
              ) : (
                <ul className="mt-1 divide-y">
                  {daftar.map((p, i) => (
                    <BarisPenggunaan key={i} p={p} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
