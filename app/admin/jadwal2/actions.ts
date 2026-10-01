"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/jadwal";

function kembali(pesan?: string): never {
  redirect(pesan ? `${PATH}?error=${encodeURIComponent(pesan)}` : PATH);
}

// Convert format HH:MM ("08:00") atau HH:MM:SS ke menit angka (480)
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (isNaN(hours) || isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

function bacaForm(formData: FormData) {
  const periodeId = String(formData.get("periode_id") ?? "");
  const ruangId = String(formData.get("ruang_id") ?? "");
  const mataKuliahId = String(formData.get("mata_kuliah_id") ?? "");
  const hari = String(formData.get("hari") ?? "").trim();
  const jamMulaiStr = String(formData.get("jam_mulai") ?? "").trim();
  const jamSelesaiStr = String(formData.get("jam_selesai") ?? "").trim();

  if (!periodeId) kembali("Periode akademik harus dipilih.");
  if (!ruangId) kembali("Pilih ruang terlebih dahulu.");
  if (!mataKuliahId) kembali("Pilih mata kuliah terlebih dahulu.");
  if (!hari) kembali("Pilih hari terlebih dahulu.");

  const jamMulai = timeToMinutes(jamMulaiStr);
  const jamSelesai = timeToMinutes(jamSelesaiStr);

  if (jamMulai < 0 || jamSelesai < 0) {
    kembali("Format jam mulai atau jam selesai tidak valid.");
  }
  if (jamSelesai <= jamMulai) {
    kembali("Jam selesai harus lebih besar dari jam mulai.");
  }

  return {
    periode_id: periodeId,
    ruang_id: ruangId,
    mata_kuliah_id: mataKuliahId,
    hari,
    jam_mulai: jamMulai,
    jam_selesai: jamSelesai,
  };
}

export async function tambahJadwal(formData: FormData) {
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("jadwal").insert(data);
  if (error) {
    console.error("Error Tambah Jadwal:", error);
    kembali(`Gagal menambah jadwal: ${error.message}`);
  }

  revalidatePath(PATH);
  kembali();
}

export async function ubahJadwal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("jadwal").update(data).eq("id", id);
  if (error) {
    console.error("Error Ubah Jadwal:", error);
    kembali(`Gagal mengubah jadwal: ${error.message}`);
  }

  revalidatePath(PATH);
  kembali();
}

export async function hapusJadwal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("jadwal").delete().eq("id", id);
  if (error) {
    console.error("Error Hapus Jadwal:", error);
    kembali(`Gagal menghapus jadwal: ${error.message}`);
  }

  revalidatePath(PATH);
  kembali();
}