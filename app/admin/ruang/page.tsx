import { createClient } from "@/lib/supabase/server";
import { tambahRuang, ubahRuang, hapusRuang } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LABEL_JENIS: Record<string, string> = {
  LAB: "Lab",
  KULIAH_UMUM: "Kuliah umum",
  TELECONFERENCE: "Teleconference",
};

function PilihanJenis({ defaultValue }: { defaultValue?: string }) {
  return (
    <select
      name="jenis"
      defaultValue={defaultValue ?? "LAB"}
      className="block rounded-md border px-3 py-2"
    >
      {Object.entries(LABEL_JENIS).map(([nilai, label]) => (
        <option key={nilai} value={nilai}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default async function RuangPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: ruang, error: errBaca } = await supabase
    .from("ruang")
    .select("id, nama, jenis, lantai, kapasitas")
    .order("nama");

  return (
<main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Ruang
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola daftar ruangan, jenis fasilitas, lokasi lantai, dan kapasitasnya.
        </p>
      </div>

      {/* Alert Error */}
      {(error || errBaca) && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <span>⚠️ {error ?? "Gagal membaca data ruang."}</span>
        </div>
      )}

      {/* Form Tambah Ruang */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Tambah Ruang Baru
        </h2>
        <form action={tambahRuang} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1 space-y-1.5 text-sm">
            <label htmlFor="nama-ruang" className="block font-medium text-slate-700">
              Nama ruang
            </label>
            <Input
              id="nama-ruang"
              name="nama"
              required
              minLength={2}
              maxLength={60}
              placeholder="Contoh: Lab Komputer 1"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <div className="space-y-1.5 text-sm">
            <label className="block font-medium text-slate-700">Jenis</label>
            <PilihanJenis />
          </div>

          <div className="w-24 space-y-1.5 text-sm">
            <label htmlFor="lantai-ruang" className="block font-medium text-slate-700">
              Lantai
            </label>
            <Input
              id="lantai-ruang"
              name="lantai"
              type="number"
              min={0}
              max={20}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <div className="w-28 space-y-1.5 text-sm">
            <label htmlFor="kapasitas-ruang" className="block font-medium text-slate-700">
              Kapasitas
            </label>
            <Input
              id="kapasitas-ruang"
              name="kapasitas"
              type="number"
              min={1}
              max={1000}
              placeholder="40"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <Button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          >
            Tambah Ruang
          </Button>
        </form>
      </section>

      {/* Daftar Ruang */}
      <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-700">
            Daftar Ruang Terdaftar
          </h2>
        </div>

        {ruang?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada ruang. Tambahkan ruang pertama Anda di atas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ruang?.map((r) => (
              <li
                key={r.id}
                className="p-4 transition hover:bg-slate-50/60 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-bold text-slate-900">
                      {r.nama}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {LABEL_JENIS[r.jenis] ?? r.jenis}
                    </span>
                    <span className="text-xs text-slate-500">
                      {r.lantai !== null ? `Lantai ${r.lantai}` : "Lantai -"}
                      {" · "}
                      {r.kapasitas !== null
                        ? `${r.kapasitas} orang`
                        : "Kapasitas -"}
                    </span>
                  </div>

                  <form action={hapusRuang}>
                    <input type="hidden" name="id" value={r.id} />
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
                    <span>✏️ Ubah data ruang ini</span>
                    <span className="transition group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 bg-white p-3 rounded-lg">
                    <form
                      action={ubahRuang}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <div className="min-w-48 flex-1 space-y-1 text-xs">
                        <label className="font-medium text-slate-600">Nama ruang</label>
                        <input
                          name="nama"
                          defaultValue={r.nama}
                          required
                          minLength={2}
                          maxLength={60}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-slate-600">Jenis</label>
                        <PilihanJenis defaultValue={r.jenis} />
                      </div>
                      <div className="w-20 space-y-1 text-xs">
                        <label className="font-medium text-slate-600">Lantai</label>
                        <input
                          name="lantai"
                          type="number"
                          min={0}
                          max={20}
                          defaultValue={r.lantai ?? ""}
                          placeholder="Lantai"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div className="w-24 space-y-1 text-xs">
                        <label className="font-medium text-slate-600">Kapasitas</label>
                        <input
                          name="kapasitas"
                          type="number"
                          min={1}
                          max={1000}
                          defaultValue={r.kapasitas ?? ""}
                          placeholder="Kapasitas"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                        />
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
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
