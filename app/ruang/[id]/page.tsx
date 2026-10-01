import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BarisPenggunaan,
  type Penggunaan,
} from "@/components/baris-penggunaan";
import { HARI, LABEL_HARI, hariIni, labelTanggal } from "@/lib/waktu";

const satu = <T,>(x: T | T[] | null | undefined): T | undefined =>
  Array.isArray(x) ? x[0] : (x ?? undefined);

export default async function RuangPublikPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ruang } = await supabase
    .from("ruang")
    .select("id, nama, jenis, lantai, kapasitas")
    .eq("id", id)
    .maybeSingle();
  if (!ruang) notFound();

  const { data: aktif } = await supabase
    .from("periode_akademik")
    .select("id, tahun_ajaran, jenis")
    .eq("aktif", true)
    .maybeSingle();

  // Jadwal mingguan (periode aktif), dikelompokkan per hari
  const perHari = new Map<string, Penggunaan[]>();
  if (aktif) {
    const { data: jadwal } = await supabase
      .from("jadwal")
      .select("hari, jam_mulai, jam_selesai, mata_kuliah(nama, prodi(nama, singkatan))")
      .eq("periode_id", aktif.id)
      .eq("ruang_id", id);

    for (const j of jadwal ?? []) {
      const mk = satu(j.mata_kuliah);
      const pr = satu(mk?.prodi);
      const arr = perHari.get(j.hari) ?? [];
      arr.push({
        jamMulai: j.jam_mulai,
        jamSelesai: j.jam_selesai,
        judul: mk?.nama ?? "Kuliah",
        keterangan: `Prodi ${pr?.singkatan ?? pr?.nama ?? "-"}`,
        tipe: "KULIAH",
      });
      perHari.set(j.hari, arr);
    }
  }

  // Peminjaman mendatang yang sudah disetujui
  const { data: pinjam } = await supabase
    .from("peminjaman")
    .select("tanggal, jam_mulai, jam_selesai, peminjam, keperluan")
    .eq("ruang_id", id)
    .eq("status", "DISETUJUI")
    .gte("tanggal", hariIni())
    .order("tanggal")
    .order("jam_mulai")
    .limit(50);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← Semua ruang
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">{ruang.nama}</h1>
        <p className="text-sm text-gray-500">
          {ruang.lantai !== null ? `Lantai ${ruang.lantai}` : ""}
          {ruang.kapasitas !== null ? ` · ${ruang.kapasitas} orang` : ""}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          Jadwal kuliah mingguan
          {aktif && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {aktif.tahun_ajaran} {aktif.jenis === "GASAL" ? "Gasal" : "Genap"}
            </span>
          )}
        </h2>

        {!aktif && (
          <p className="text-sm text-gray-500">Belum ada periode akademik aktif.</p>
        )}

        {aktif &&
          HARI.map((h) => {
            const daftar = (perHari.get(h) ?? []).sort(
              (a, b) => a.jamMulai - b.jamMulai,
            );
            return (
              <div key={h} className="rounded-xl border bg-white p-3">
                <h3 className="text-sm font-semibold">{LABEL_HARI[h]}</h3>
                {daftar.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-400">Tidak ada jadwal.</p>
                ) : (
                  <ul className="divide-y">
                    {daftar.map((p, i) => (
                      <BarisPenggunaan key={i} p={p} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Peminjaman mendatang</h2>
        {pinjam?.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada peminjaman mendatang.</p>
        )}
        <div className="space-y-3">
          {pinjam?.map((p, i) => (
            <div key={i} className="rounded-xl border bg-white p-3">
              <h3 className="text-sm font-semibold">{labelTanggal(p.tanggal)}</h3>
              <ul>
                <BarisPenggunaan
                  p={{
                    jamMulai: p.jam_mulai,
                    jamSelesai: p.jam_selesai,
                    judul: p.keperluan,
                    keterangan: `Dipinjam: ${p.peminjam}`,
                    tipe: "PINJAM",
                  }}
                />
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
