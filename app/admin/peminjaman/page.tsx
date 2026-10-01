import { createClient } from "@/lib/supabase/server";
import {
  tambahPeminjaman,
  ubahPeminjaman,
  setujuiPeminjaman,
  tolakPeminjaman,
  hapusPeminjaman,
} from "./actions";
import { labelTanggal, menitKeInput, menitKeJam } from "@/lib/waktu";

const satu = <T,>(x: T | T[] | null | undefined): T | undefined =>
  Array.isArray(x) ? x[0] : (x ?? undefined);

const STATUS = {
  MENUNGGU: { label: "Menunggu", kelas: "bg-yellow-100 text-yellow-800" },
  DISETUJUI: { label: "Disetujui", kelas: "bg-green-100 text-green-800" },
  DITOLAK: { label: "Ditolak", kelas: "bg-gray-200 text-gray-700" },
} as const;

type OpsiRuang = { id: string; nama: string };
type Nilai = {
  ruang_id: string;
  tanggal: string;
  jam_mulai: number;
  jam_selesai: number;
  peminjam: string;
  keperluan: string;
  kontak: string | null;
};

function FormPeminjaman({
  aksi,
  ruang,
  tombol,
  id,
  nilai,
}: {
  aksi: (formData: FormData) => Promise<void>;
  ruang: OpsiRuang[];
  tombol: string;
  id?: string;
  nilai?: Nilai;
}) {
  const kelas = "block rounded-md border px-3 py-2";
  return (
    <form action={aksi} className="flex flex-wrap items-end gap-3">
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

      <label className="space-y-1 text-sm">
        <span>Tanggal</span>
        <input
          name="tanggal"
          type="date"
          required
          defaultValue={nilai?.tanggal ?? ""}
          className={kelas}
        />
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

      <label className="min-w-40 flex-1 space-y-1 text-sm">
        <span>Peminjam (nama / unit)</span>
        <input
          name="peminjam"
          required
          minLength={2}
          maxLength={100}
          defaultValue={nilai?.peminjam ?? ""}
          className={`${kelas} w-full`}
        />
      </label>

      <label className="min-w-48 flex-1 space-y-1 text-sm">
        <span>Keperluan</span>
        <input
          name="keperluan"
          required
          minLength={3}
          maxLength={200}
          defaultValue={nilai?.keperluan ?? ""}
          className={`${kelas} w-full`}
        />
      </label>

      <label className="min-w-40 space-y-1 text-sm">
        <span>Kontak (opsional, tidak tampil publik)</span>
        <input
          name="kontak"
          maxLength={100}
          defaultValue={nilai?.kontak ?? ""}
          className={`${kelas} w-full`}
        />
      </label>

      <button className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
        {tombol}
      </button>
    </form>
  );
}

export default async function PeminjamanPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    error?: string;
    info?: string;
    peringatan?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Hanya ruang umum & teleconference yang bisa dipinjam
  const { data: dataRuang } = await supabase
    .from("ruang")
    .select("id, nama")
    .in("jenis", ["KULIAH_UMUM", "TELECONFERENCE"])
    .order("nama");
  const ruang: OpsiRuang[] = dataRuang ?? [];

  let query = supabase
    .from("peminjaman")
    .select(
      "id, ruang_id, tanggal, jam_mulai, jam_selesai, peminjam, keperluan, kontak, status, catatan_admin, ruang(nama)",
    )
    .order("tanggal", { ascending: false })
    .order("jam_mulai")
    .limit(200);
  if (sp.status && sp.status in STATUS) query = query.eq("status", sp.status);

  const { data: daftar, error: errBaca } = await query;

  // Bentrok: baca view, kelompokkan per peminjaman (difilter di JS)
  const { data: dataBentrok } = await supabase
    .from("peminjaman_bentrok")
    .select(
      "peminjaman_id, jenis_lawan, lawan_nama, lawan_detail, lawan_jam_mulai, lawan_jam_selesai",
    );
  const bentrokPer = new Map<string, NonNullable<typeof dataBentrok>>();
  for (const b of dataBentrok ?? []) {
    const arr = bentrokPer.get(b.peminjaman_id) ?? [];
    arr.push(b);
    bentrokPer.set(b.peminjaman_id, arr);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Peminjaman Ruang</h1>

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
          Gagal membaca data peminjaman.
        </p>
      )}

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium">Catat peminjaman baru</h2>
        <FormPeminjaman aksi={tambahPeminjaman} ruang={ruang} tombol="Catat" />
        <p className="mt-2 text-xs text-gray-500">
          Peminjaman baru berstatus Menunggu dan baru tampil di jadwal publik
          setelah disetujui.
        </p>
      </div>

      <form method="get" className="flex items-end gap-2 text-sm">
        <label className="space-y-1">
          <span>Tampilkan status</span>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="block rounded-md border px-3 py-2"
          >
            <option value="">Semua</option>
            <option value="MENUNGGU">Menunggu</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </label>
        <button className="rounded-md border px-3 py-2 hover:bg-gray-100">
          Terapkan
        </button>
      </form>

      <div className="rounded-xl border bg-white">
        {daftar?.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Belum ada peminjaman.
          </p>
        )}

        <ul className="divide-y">
          {daftar?.map((p) => {
            const st = STATUS[p.status as keyof typeof STATUS];
            const bentrok = bentrokPer.get(p.id) ?? [];

            return (
              <li key={p.id} className="p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.keperluan}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${st?.kelas ?? ""}`}
                      >
                        {st?.label ?? p.status}
                      </span>
                      {bentrok.length > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Bentrok · {bentrok.length}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {satu(p.ruang)?.nama ?? "-"} · {labelTanggal(p.tanggal)} ·{" "}
                      {menitKeJam(p.jam_mulai)}-{menitKeJam(p.jam_selesai)}
                    </div>
                    <div className="text-gray-500">
                      Peminjam: {p.peminjam}
                      {p.kontak ? ` · Kontak: ${p.kontak}` : ""}
                    </div>
                    {p.catatan_admin && (
                      <div className="text-gray-500">
                        Catatan admin: {p.catatan_admin}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {p.status !== "DISETUJUI" && (
                      <form action={setujuiPeminjaman}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded-md border border-green-600 px-2 py-1 text-green-700 hover:bg-green-50">
                          Setujui
                        </button>
                      </form>
                    )}
                    <form action={hapusPeminjaman}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-md border px-2 py-1 text-red-700 hover:bg-red-50">
                        Hapus
                      </button>
                    </form>
                  </div>
                </div>

                {bentrok.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-md bg-red-50 p-2 text-xs text-red-800">
                    {bentrok.map((b, i) => (
                      <li key={i}>
                        Bentrok dengan{" "}
                        {b.jenis_lawan === "JADWAL" ? "jadwal kuliah" : "peminjaman"}:{" "}
                        {b.lawan_nama} ({b.lawan_detail},{" "}
                        {menitKeJam(b.lawan_jam_mulai)}-{menitKeJam(b.lawan_jam_selesai)})
                      </li>
                    ))}
                  </ul>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600 hover:underline">
                    Ubah
                  </summary>
                  <div className="mt-2">
                    <FormPeminjaman
                      aksi={ubahPeminjaman}
                      ruang={ruang}
                      tombol="Simpan"
                      id={p.id}
                      nilai={{
                        ruang_id: p.ruang_id,
                        tanggal: p.tanggal,
                        jam_mulai: p.jam_mulai,
                        jam_selesai: p.jam_selesai,
                        peminjam: p.peminjam,
                        keperluan: p.keperluan,
                        kontak: p.kontak,
                      }}
                    />
                  </div>
                </details>

                {p.status !== "DITOLAK" && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-gray-600 hover:underline">
                      Tolak
                    </summary>
                    <form
                      action={tolakPeminjaman}
                      className="mt-2 flex flex-wrap items-end gap-3"
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="catatan_admin"
                        maxLength={200}
                        placeholder="Alasan penolakan (opsional)"
                        className="min-w-64 flex-1 rounded-md border px-3 py-2"
                      />
                      <button className="rounded-md border border-red-600 px-3 py-2 text-red-700 hover:bg-red-50">
                        Tolak peminjaman
                      </button>
                    </form>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
