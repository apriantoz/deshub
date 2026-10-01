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
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Ruang</h1>

      {(error || errBaca) && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error ?? "Gagal membaca data ruang."}
        </p>
      )}

      <form
        action={tambahRuang}
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
      >
        <label className="min-w-48 flex-1 space-y-1 text-sm">
          <span>Nama ruang</span>
          <Input
            name="nama"
            required
            minLength={2}
            maxLength={60}
            className="block w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Jenis</span>
          <PilihanJenis />
        </label>
        <label className="space-y-1 text-sm">
          <span>Lantai</span>
          <Input
            name="lantai"
            type="number"
            min={0}
            max={20}
            className="block w-20 rounded-md border px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Kapasitas</span>
          <Input
            name="kapasitas"
            type="number"
            min={1}
            max={1000}
            className="block w-24 rounded-md border px-3 py-2"
          />
        </label>
        <Button>
          Tambah
        </Button>
      </form>

      <div className="rounded-xl border bg-white">
        {ruang?.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Belum ada ruang.
          </p>
        )}

        <ul className="divide-y">
          {ruang?.map((r) => (
            <li key={r.id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.nama}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {LABEL_JENIS[r.jenis] ?? r.jenis}
                  </span>
                  <span className="text-gray-500">
                    {r.lantai !== null ? `Lantai ${r.lantai}` : "Lantai -"}
                    {" · "}
                    {r.kapasitas !== null
                      ? `${r.kapasitas} orang`
                      : "Kapasitas -"}
                  </span>
                </div>

                <form action={hapusRuang}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button variant="destructive">
                    Hapus
                  </Button>
                </form>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-gray-600 hover:underline">
                  Ubah
                </summary>
                <form
                  action={ubahRuang}
                  className="mt-2 flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    name="nama"
                    defaultValue={r.nama}
                    required
                    minLength={2}
                    maxLength={60}
                    className="min-w-48 flex-1 rounded-md border px-3 py-2"
                  />
                  <PilihanJenis defaultValue={r.jenis} />
                  <input
                    name="lantai"
                    type="number"
                    min={0}
                    max={20}
                    defaultValue={r.lantai ?? ""}
                    placeholder="Lantai"
                    className="w-20 rounded-md border px-3 py-2"
                  />
                  <input
                    name="kapasitas"
                    type="number"
                    min={1}
                    max={1000}
                    defaultValue={r.kapasitas ?? ""}
                    placeholder="Kapasitas"
                    className="w-24 rounded-md border px-3 py-2"
                  />
                  <Button>
                    Simpan
                  </Button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
