import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  tambahJadwal,
  ubahJadwal,
  hapusJadwal,
} from "./actions";
import FilterJadwal from "./FilterJadwal";

type Prodi = { id: string; nama: string; singkatan: string | null };

type MataKuliah = {
  id: string;
  nama: string;
  semester: number;
  prodi_id: string;
  prodi: Prodi | Prodi[] | null;
};

type Ruang = { id: string; nama: string };

type Bentrok = {
  jadwal_id?: string;
  bentrok_mata_kuliah: string;
  bentrok_jam_mulai: number;
  bentrok_jam_selesai: number;
};

type JadwalRaw = {
  id: string;
  hari: string;
  jam_mulai: number;
  jam_selesai: number;
  periode_id: string;
  ruang_id: string;
  mata_kuliah_id: string;
  ruang: Ruang | Ruang[] | null;
  mata_kuliah: MataKuliah | MataKuliah[] | null;
};

// Extractor helper untuk menangani relasi objek/array Supabase
function unwrapRelation<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] ?? null : data;
}

// Convert menit angka (480) ke HH:MM ("08:00")
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function PilihanMataKuliah({
  list,
  defaultValue,
}: {
  list: MataKuliah[];
  defaultValue?: string;
}) {
  return (
    <select
      name="mata_kuliah_id"
      defaultValue={defaultValue}
      required
      className="block rounded-md border px-3 py-2 text-sm"
    >
      {!defaultValue && <option value="">Pilih mata kuliah...</option>}
      {list.map((m) => {
        const p = unwrapRelation(m.prodi);
        return (
          <option key={m.id} value={m.id}>
            {m.nama} (Sem {m.semester}){p?.singkatan ? ` - ${p.singkatan}` : ""}
          </option>
        );
      })}
    </select>
  );
}

function PilihanRuang({
  list,
  defaultValue,
}: {
  list: Ruang[];
  defaultValue?: string;
}) {
  return (
    <select
      name="ruang_id"
      defaultValue={defaultValue}
      required
      className="block rounded-md border px-3 py-2 text-sm"
    >
      {!defaultValue && <option value="">Pilih ruang...</option>}
      {list.map((r) => (
        <option key={r.id} value={r.id}>
          {r.nama}
        </option>
      ))}
    </select>
  );
}

function PilihanHari({ defaultValue }: { defaultValue?: string }) {
  const HARI = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  return (
    <select
      name="hari"
      defaultValue={defaultValue ?? "SENIN"}
      className="block rounded-md border px-3 py-2 text-sm"
    >
      {HARI.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prodi?: string; q?: string }>;
}) {
  const { error, prodi: filterProdi, q: searchQuery } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch Master Data (Periode, Ruang, Prodi, & Mata Kuliah)
  const [{ data: periodeList }, { data: daftarRuang }, { data: daftarProdi }] =
    await Promise.all([
      supabase
        .from("periode_akademik")
        .select("id, tahun_ajaran, jenis, aktif")
        .order("created_at", { ascending: false }),
      supabase.from("ruang").select("id, nama").order("nama"),
      supabase.from("prodi").select("id, nama, singkatan").order("nama"),
    ]);

  const periodeAktif = periodeList?.find((p) => p.aktif) || periodeList?.[0];
  const ruang: Ruang[] = daftarRuang ?? [];

  // Query Mata Kuliah untuk Form
  let mkQuery = supabase
    .from("mata_kuliah")
    .select("id, nama, semester, prodi_id, prodi(nama, singkatan)")
    .order("nama");
  if (filterProdi) mkQuery = mkQuery.eq("prodi_id", filterProdi);

  const { data: daftarMK } = await mkQuery;
  const mataKuliah: MataKuliah[] = (daftarMK as unknown as MataKuliah[]) ?? [];

  // 2. Query Jadwal & Bentrok secara Terpisah
  let rawJadwal: JadwalRaw[] = [];
  let bentrokMap: Record<string, Bentrok[]> = {};
  let errBacaMessage: string | null = null;

  if (periodeAktif) {
    const [resJadwal, resBentrok] = await Promise.all([
      supabase
        .from("jadwal")
        .select(`
          id,
          hari,
          jam_mulai,
          jam_selesai,
          periode_id,
          ruang_id,
          mata_kuliah_id,
          ruang:ruang_id ( nama ),
          mata_kuliah:mata_kuliah_id (
            nama,
            semester,
            prodi_id,
            prodi:prodi_id ( nama, singkatan )
          )
        `)
        .eq("periode_id", periodeAktif.id)
        .order("jam_mulai"),
      supabase
        .from("jadwal_bentrok")
        .select("jadwal_id, bentrok_mata_kuliah, bentrok_jam_mulai, bentrok_jam_selesai"),
    ]);

    if (resJadwal.error) {
      console.error("Error Reading Jadwal:", resJadwal.error);
      errBacaMessage = resJadwal.error.message;
    } else {
      rawJadwal = (resJadwal.data as unknown as JadwalRaw[]) ?? [];
    }

    // Kelompokkan data bentrok berdasarkan jadwal_id
    if (resBentrok.data) {
      bentrokMap = resBentrok.data.reduce((acc, item) => {
        const key = item.jadwal_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, Bentrok[]>);
    }
  }

  // 3. Filter Jadwal di Server Side berdasarkan Search Query & Filter Prodi
  const jadwalFiltered = rawJadwal.filter((j) => {
    const mk = unwrapRelation(j.mata_kuliah);
    const r = unwrapRelation(j.ruang);
    const p = unwrapRelation(mk?.prodi);

    // Filter Prodi
    if (filterProdi && mk?.prodi_id !== filterProdi) {
      return false;
    }

    // Filter Search Query (Pencarian Teks)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchMK = mk?.nama.toLowerCase().includes(q);
      const matchRuang = r?.nama.toLowerCase().includes(q);
      const matchHari = j.hari.toLowerCase().includes(q);
      const matchProdi =
        p?.nama.toLowerCase().includes(q) ||
        p?.singkatan?.toLowerCase().includes(q);

      return matchMK || matchRuang || matchHari || matchProdi;
    }

    return true;
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jadwal Kuliah</h1>
        {periodeAktif && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
            Periode: {periodeAktif.tahun_ajaran} ({periodeAktif.jenis})
          </span>
        )}
      </div>

      {(error || errBacaMessage) && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error ?? errBacaMessage ?? "Gagal membaca data jadwal."}
        </p>
      )}

      {!periodeAktif ? (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Belum ada periode akademik. Tambahkan periode dulu di{" "}
          <Link href="/admin/periode" className="underline">
            halaman Periode
          </Link>
          .
        </p>
      ) : mataKuliah.length === 0 || ruang.length === 0 ? (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Pastikan data{" "}
          <Link href="/admin/mata-kuliah" className="underline">
            Mata Kuliah
          </Link>{" "}
          dan{" "}
          <Link href="/admin/ruang" className="underline">
            Ruang
          </Link>{" "}
          sudah diisi terlebih dahulu.
        </p>
      ) : (
        <form
          action={tambahJadwal}
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 text-sm shadow-sm"
        >
          <input type="hidden" name="periode_id" value={periodeAktif.id} />

          <label className="min-w-48 flex-1 space-y-1">
            <span>Mata Kuliah</span>
            <PilihanMataKuliah list={mataKuliah} />
          </label>

          <label className="space-y-1">
            <span>Ruang</span>
            <PilihanRuang list={ruang} />
          </label>

          <label className="space-y-1">
            <span>Hari</span>
            <PilihanHari />
          </label>

          <label className="space-y-1">
            <span>Jam Mulai</span>
            <input
              type="time"
              name="jam_mulai"
              required
              defaultValue="08:00"
              className="block rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span>Jam Selesai</span>
            <input
              type="time"
              name="jam_selesai"
              required
              defaultValue="09:40"
              className="block rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <button className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 transition">
            Tambah
          </button>
        </form>
      )}

      {/* Komponen Filter Client Otomatis */}
      <FilterJadwal daftarProdi={(daftarProdi as Prodi[]) ?? []} />

      {/* Daftar Jadwal */}
      <div className="rounded-xl border bg-white shadow-sm">
        {jadwalFiltered.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            {searchQuery || filterProdi
              ? "Tidak ada jadwal yang cocok dengan kata kunci/filter."
              : "Belum ada jadwal kuliah."}
          </p>
        )}

        <ul className="divide-y">
          {jadwalFiltered.map((j) => {
            const mk = unwrapRelation(j.mata_kuliah);
            const r = unwrapRelation(j.ruang);
            const p = unwrapRelation(mk?.prodi);
            const bentrokList = bentrokMap[j.id] ?? [];
            const isBentrok = bentrokList.length > 0;

            return (
              <li key={j.id} className="p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{j.hari}</span>
                      <span className="text-gray-500">
                        ({minutesToTime(j.jam_mulai)} - {minutesToTime(j.jam_selesai)})
                      </span>
                      {isBentrok ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          ⚠️ Bentrok ({bentrokList.length})
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          ✓ Aman
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{mk?.nama ?? "-"}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {r?.nama ?? "-"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {p?.singkatan ?? p?.nama ?? "-"} (Sem {mk?.semester ?? "-"})
                      </span>
                    </div>

                    {isBentrok && (
                      <div className="mt-1 text-xs text-red-600 space-y-0.5">
                        {bentrokList.map((b, idx) => (
                          <div key={idx}>
                            • Bentrok dengan {b.bentrok_mata_kuliah} (
                            {minutesToTime(b.bentrok_jam_mulai)}-
                            {minutesToTime(b.bentrok_jam_selesai)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form action={hapusJadwal}>
                    <input type="hidden" name="id" value={j.id} />
                    <button className="rounded-md border px-2 py-1 text-red-700 hover:bg-red-50 text-xs">
                      Hapus
                    </button>
                  </form>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600 hover:underline">
                    Ubah Data
                  </summary>
                  <form
                    action={ubahJadwal}
                    className="mt-2 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <input type="hidden" name="id" value={j.id} />
                    <input type="hidden" name="periode_id" value={j.periode_id} />

                    <label className="min-w-48 flex-1 space-y-1">
                      <span className="text-xs">Mata Kuliah</span>
                      <PilihanMataKuliah
                        list={mataKuliah}
                        defaultValue={j.mata_kuliah_id}
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs">Ruang</span>
                      <PilihanRuang list={ruang} defaultValue={j.ruang_id} />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs">Hari</span>
                      <PilihanHari defaultValue={j.hari} />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs">Jam Mulai</span>
                      <input
                        type="time"
                        name="jam_mulai"
                        required
                        defaultValue={minutesToTime(j.jam_mulai)}
                        className="block rounded-md border px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs">Jam Selesai</span>
                      <input
                        type="time"
                        name="jam_selesai"
                        required
                        defaultValue={minutesToTime(j.jam_selesai)}
                        className="block rounded-md border px-3 py-2 text-sm"
                      />
                    </label>

                    <button className="rounded-md bg-black px-3 py-2 text-xs text-white hover:bg-gray-800">
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