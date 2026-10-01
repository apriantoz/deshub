"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HARI, jamKeMenit, menitKeJam } from "@/lib/waktu";

const PATH = "/admin/jadwal";

type Opsi = { error?: string; info?: string; peringatan?: string };

// Kembali ke daftar jadwal pada periode yang sama, membawa pesan lewat URL
function kembali(periodeId: string, opsi: Opsi = {}): never {
  const p = new URLSearchParams();
  if (periodeId) p.set("periode", periodeId);
  if (opsi.error) p.set("error", opsi.error);
  if (opsi.info) p.set("info", opsi.info);
  if (opsi.peringatan) p.set("peringatan", opsi.peringatan);
  const qs = p.toString();
  redirect(qs ? `${PATH}?${qs}` : PATH);
}

function bacaForm(formData: FormData, periodeId: string) {
  const ruangId = String(formData.get("ruang_id") ?? "");
  const mataKuliahId = String(formData.get("mata_kuliah_id") ?? "");
  const hari = String(formData.get("hari") ?? "");
  const mulai = jamKeMenit(String(formData.get("jam_mulai") ?? ""));
  const selesai = jamKeMenit(String(formData.get("jam_selesai") ?? ""));

  if (!ruangId) kembali(periodeId, { error: "Pilih ruang." });
  if (!mataKuliahId) kembali(periodeId, { error: "Pilih mata kuliah." });
  if (!(HARI as readonly string[]).includes(hari)) {
    kembali(periodeId, { error: "Pilih hari." });
  }
  if (mulai === null || selesai === null) {
    kembali(periodeId, { error: "Isi jam mulai dan jam selesai dengan benar." });
  }
  if (selesai <= mulai) {
    kembali(periodeId, { error: "Jam selesai harus lebih besar dari jam mulai." });
  }

  return {
    ruang_id: ruangId,
    mata_kuliah_id: mataKuliahId,
    hari,
    jam_mulai: mulai,
    jam_selesai: selesai,
  };
}

// Setelah simpan: cek ke view jadwal_bentrok, lalu susun peringatan (bukan penolakan)
async function peringatanBentrok(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jadwalId: string,
): Promise<string | undefined> {
  const { data } = await supabase
    .from("jadwal_bentrok")
    .select("bentrok_mata_kuliah, bentrok_prodi, bentrok_jam_mulai, bentrok_jam_selesai")
    .eq("jadwal_id", jadwalId);

  if (!data || data.length === 0) return undefined;

  const daftar = data
    .map(
      (b) =>
        `${b.bentrok_mata_kuliah} (${b.bentrok_prodi}, ${menitKeJam(b.bentrok_jam_mulai)}-${menitKeJam(b.bentrok_jam_selesai)})`,
    )
    .join("; ");
  return `Jadwal ini bentrok dengan: ${daftar}`;
}

export async function tambahJadwal(formData: FormData) {
  const periodeId = String(formData.get("periode_id") ?? "");
  if (!periodeId) kembali("", { error: "Periode tidak valid." });

  const data = bacaForm(formData, periodeId);
  const supabase = await createClient();

  const { data: baru, error } = await supabase
    .from("jadwal")
    .insert({ ...data, periode_id: periodeId })
    .select("id")
    .single();
  if (error || !baru) kembali(periodeId, { error: "Gagal menambah jadwal." });

  revalidatePath(PATH);
  kembali(periodeId, {
    info: "Jadwal tersimpan.",
    peringatan: await peringatanBentrok(supabase, baru.id),
  });
}

export async function ubahJadwal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const periodeId = String(formData.get("periode_id") ?? "");

  const data = bacaForm(formData, periodeId);
  const supabase = await createClient();

  const { error } = await supabase.from("jadwal").update(data).eq("id", id);
  if (error) kembali(periodeId, { error: "Gagal mengubah jadwal." });

  revalidatePath(PATH);
  kembali(periodeId, {
    info: "Jadwal diperbarui.",
    peringatan: await peringatanBentrok(supabase, id),
  });
}

export async function hapusJadwal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const periodeId = String(formData.get("periode_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("jadwal").delete().eq("id", id);
  if (error) kembali(periodeId, { error: "Gagal menghapus jadwal." });

  revalidatePath(PATH);
  kembali(periodeId, { info: "Jadwal dihapus." });
}
