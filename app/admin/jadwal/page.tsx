import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tambahJadwal, ubahJadwal, hapusJadwal } from "./actions";
import {
  HARI,
  LABEL_HARI,
  menitKeJam,
  menitKeInput,
} from "@/lib/waktu";

// Relasi many-to-one dari PostgREST berupa objek tunggal (jaga-jaga kalau array)
const satu = <T,>(x: T | T[] | null | undefined): T | undefined =>
  Array.isArray(x) ? x[0] : (x ?? undefined);

type OpsiRuang = { id: string; nama: string };
type GrupMk = { prodi: string; items: { id: string; label: string }[] };
type Nilai = {
  ruang_id: string;
  mata_kuliah_id: string;
  hari: string;
  jam_mulai: number;
  jam_selesai: number;
};

function FormJadwal({
  aksi,
  periodeId,
  ruang,
  grupMk,
  tombol,
  id,
  nilai,
}: {
  aksi: (formData: FormData) => Promise<void>;
  periodeId: string;
  ruang: OpsiRuang[];
  grupMk: GrupMk[];
  tombol: string;
  id?: string;
  nilai?: Nilai;
}) {
  const kelas = "block rounded-md border px-3 py-2";
  return (
    <form action={aksi} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="periode_id" value={periodeId} />
      {id && <input type="hidden" name="id" value={id} />}

      <label className="space-y-1 text-sm">
        <span>Ruang</span>
        <select
          name="ruang_id"
          required
          defaultValue={nilai?.ruang_id ?? ""}
          className={kelas}
        >
          <option value="" disabled>
            Pilih ruang...
          </option>
          {ruang.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama}
            </option>
          ))}
        </select>
      </label>

      <label className="min-w-56 flex-1 space-y-1 text-sm">
        <span>Mata kuliah</span>
        <select
          name="mata_kuliah_id"
          required
          defaultValue={nilai?.mata_kuliah_id ?? ""}
          className={`${kelas} w-full`}
        >
          <option value="" disabled>
            Pilih mata kuliah...
          </option>
          {grupMk.map((g) => (
            <optgroup key={g.prodi} label={g.prodi}>
              {g.items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>Hari</span>
        <select name="hari" defaultValue={nilai?.hari ?? "SENIN"} className={kelas}>
          {HARI.map((h) => (
            <option key={h} value={h}>
              {LABEL_HARI[h]}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>Mulai</span>
        <input
          name="jam_mulai"
          type="time"
          required
          defaultValue={nilai ? menitKeInput(nilai.jam_mulai) : ""}
          className={kelas}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span>Selesai</span>
        <input
          name="jam_selesai"
          type="time"
          required
          defaultValue={nilai ? menitKeInput(nilai.jam_selesai) : ""}
          className={kelas}
        />
      </label>

      <button className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
        {tombol}
      </button>
    </form>
  );
}

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: Promise<{
    periode?: string;
    ruang?: string;
    error?: string;
    info?: string;
    peringatan?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // ---- Periode: pakai yang dipilih, kalau tidak ada pakai yang aktif ----
  const { data: dataPeriode } = await supabase
    .from("periode_akademik")
    .select("id, tahun_ajaran, jenis, aktif")
    .order("tahun_ajaran", { ascending: false })
    .order("jenis");
  const daftarPeriode = dataPeriode ?? [];

  if (daftarPeriode.length === 0) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Jadwal</h1>
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Belum ada periode akademik. Tambahkan dulu di{" "}
          <Link href="/admin/periode" className="underline">
            halaman Periode Akademik
          </Link>
          .
        </p>
      </main>
    );
  }

  const periode =
    daftarPeriode.find((p) => p.id === sp.periode) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  // ---- Data pendukung form ----
  const { data: dataRuang } = await supabase
    .from("ruang")
    .select("id, nama")
    .order("nama");
  const ruang: OpsiRuang[] = dataRuang ?? [];

  const { data: dataMk } = await supabase
    .from("mata_kuliah")
    .select("id, nama, semester, prodi(nama, singkatan)");

  const peta = new Map<string, GrupMk>();
  const mkUrut = [...(dataMk ?? [])].sort((a, b) => {
    const pa = satu(a.prodi)?.nama ?? "";
    const pb = satu(b.prodi)?.nama ?? "";
    return (
      pa.localeCompare(pb) || a.semester - b.semester || a.nama.localeCompare(b.nama)
    );
  });
  for (const m of mkUrut) {
    const namaProdi = satu(m.prodi)?.nama ?? "-";
    if (!peta.has(namaProdi)) peta.set(namaProdi, { prodi: namaProdi, items: [] });
    peta.get(namaProdi)!.items.push({
      id: m.id,
      label: `${m.nama} (Sem ${m.semester})`,
    });
  }
  const grupMk = [...peta.values()];

  // ---- Jadwal pada periode terpilih ----
  let query = supabase
    .from("jadwal")
    .select(
      "id, hari, jam_mulai, jam_selesai, ruang_id, mata_kuliah_id, ruang(nama), mata_kuliah(nama, semester, prodi(nama, singkatan))",
    )
    .eq("periode_id", periode.id);
  if (sp.ruang) query = query.eq("ruang_id", sp.ruang);

  const { data: dataJadwal, error: errBaca } = await query;

  const jadwal = [...(dataJadwal ?? [])].sort((a, b) => {
    const ra = satu(a.ruang)?.nama ?? "";
    const rb = satu(b.ruang)?.nama ?? "";
    return (
      ra.localeCompare(rb) ||
      HARI.indexOf(a.hari) - HARI.indexOf(b.hari) ||
      a.jam_mulai - b.jam_mulai
    );
  });

  // ---- Bentrok: baca view, kelompokkan per jadwal (difilter di JS) ----
  const { data: dataBentrok } = await supabase
    .from("jadwal_bentrok")
    .select(
      "jadwal_id, bentrok_mata_kuliah, bentrok_prodi, bentrok_jam_mulai, bentrok_jam_selesai",
    );

  const idTampil = new Set(jadwal.map((j) => j.id));
  const bentrokPer = new Map<string, NonNullable<typeof dataBentrok>>();
  for (const b of dataBentrok ?? []) {
    if (!idTampil.has(b.jadwal_id)) continue;
    const arr = bentrokPer.get(b.jadwal_id) ?? [];
    arr.push(b);
    bentrokPer.set(b.jadwal_id, arr);
  }

  const bisaTambah = ruang.length > 0 && grupMk.length > 0;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Jadwal</h1>

      {sp.error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{sp.error}</p>
      )}
      {sp.info && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{sp.info}</p>
      )}
      {sp.peringatan && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          ⚠ {sp.peringatan}
        </p>
      )}
      {errBaca && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Gagal membaca data jadwal.
        </p>
      )}

      {/* Pilih periode dan filter ruang (form GET, tanpa JavaScript) */}
      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <label className="space-y-1">
          <span>Periode</span>
          <select
            name="periode"
            defaultValue={periode.id}
            className="block rounded-md border px-3 py-2"
          >
            {daftarPeriode.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tahun_ajaran} {p.jenis === "GASAL" ? "Gasal" : "Genap"}
                {p.aktif ? " (aktif)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span>Ruang</span>
          <select
            name="ruang"
            defaultValue={sp.ruang ?? ""}
            className="block rounded-md border px-3 py-2"
          >
            <option value="">Semua ruang</option>
            {ruang.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-md border px-3 py-2 hover:bg-gray-100">
          Terapkan
        </button>
      </form>

      {!periode.aktif && (
        <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-700">
          Kamu sedang melihat periode yang tidak aktif.
        </p>
      )}

      {bisaTambah ? (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-medium">
            Tambah jadwal ({periode.tahun_ajaran}{" "}
            {periode.jenis === "GASAL" ? "Gasal" : "Genap"})
          </h2>
          <FormJadwal
            aksi={tambahJadwal}
            periodeId={periode.id}
            ruang={ruang}
            grupMk={grupMk}
            tombol="Tambah"
          />
          <p className="mt-2 text-xs text-gray-500">
            Jadwal yang bentrok tetap bisa disimpan; bentroknya ditandai di daftar.
          </p>
        </div>
      ) : (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Untuk menambah jadwal, pastikan sudah ada ruang dan mata kuliah.
        </p>
      )}

      {bentrokPer.size > 0 && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {bentrokPer.size} jadwal bentrok pada tampilan ini.
        </p>
      )}

      <div className="rounded-xl border bg-white">
        {jadwal.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Belum ada jadwal pada tampilan ini.
          </p>
        )}

        <ul className="divide-y">
          {jadwal.map((j) => {
            const r = satu(j.ruang);
            const mk = satu(j.mata_kuliah);
            const pr = satu(mk?.prodi);
            const bentrok = bentrokPer.get(j.id) ?? [];

            return (
              <li key={j.id} className="p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{mk?.nama ?? "-"}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {pr?.singkatan ?? pr?.nama ?? "-"}
                      </span>
                      {bentrok.length > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Bentrok · {bentrok.length}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {r?.nama ?? "-"} · {LABEL_HARI[j.hari] ?? j.hari} ·{" "}
                      {menitKeJam(j.jam_mulai)}-{menitKeJam(j.jam_selesai)}
                    </div>
                  </div>

                  <form action={hapusJadwal}>
                    <input type="hidden" name="id" value={j.id} />
                    <input type="hidden" name="periode_id" value={periode.id} />
                    <button className="rounded-md border px-2 py-1 text-red-700 hover:bg-red-50">
                      Hapus
                    </button>
                  </form>
                </div>

                {bentrok.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-md bg-red-50 p-2 text-xs text-red-800">
                    {bentrok.map((b, i) => (
                      <li key={i}>
                        Bentrok dengan: {b.bentrok_mata_kuliah} ({b.bentrok_prodi},{" "}
                        {menitKeJam(b.bentrok_jam_mulai)}-
                        {menitKeJam(b.bentrok_jam_selesai)})
                      </li>
                    ))}
                  </ul>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600 hover:underline">
                    Ubah
                  </summary>
                  <div className="mt-2">
                    <FormJadwal
                      aksi={ubahJadwal}
                      periodeId={periode.id}
                      ruang={ruang}
                      grupMk={grupMk}
                      tombol="Simpan"
                      id={j.id}
                      nilai={{
                        ruang_id: j.ruang_id,
                        mata_kuliah_id: j.mata_kuliah_id,
                        hari: j.hari,
                        jam_mulai: j.jam_mulai,
                        jam_selesai: j.jam_selesai,
                      }}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
