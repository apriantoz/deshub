"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tanggalValid } from "@/lib/waktu";

const PATH = "/admin/periode";

function kembali(pesan?: string): never {
  redirect(pesan ? `${PATH}?error=${encodeURIComponent(pesan)}` : PATH);
}

function bacaForm(formData: FormData) {
  const tahun = String(formData.get("tahun_ajaran") ?? "").trim();
  const jenis = String(formData.get("jenis") ?? "");
  const mulai = String(formData.get("tanggal_mulai") ?? "");
  const selesai = String(formData.get("tanggal_selesai") ?? "");

  if (!/^\d{4}\/\d{4}$/.test(tahun)) {
    kembali("Format tahun ajaran harus seperti 2026/2027.");
  }
  const [awal, akhir] = tahun.split("/").map(Number);
  if (akhir !== awal + 1) {
    kembali("Tahun akhir harus satu tahun setelah tahun awal.");
  }
  if (jenis !== "GASAL" && jenis !== "GENAP") {
    kembali("Jenis semester tidak valid.");
  }
  if (!tanggalValid(mulai) || !tanggalValid(selesai)) {
    kembali("Isi tanggal mulai dan tanggal selesai dengan benar.");
  }
  if (selesai < mulai) {
    kembali("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  }

  return {
    tahun_ajaran: tahun,
    jenis,
    tanggal_mulai: mulai,
    tanggal_selesai: selesai,
  };
}

function pesanError(code: string | undefined, aksi: string) {
  if (code === "23505") return "Periode itu (tahun ajaran dan semester) sudah ada.";
  if (code === "23P01") return "Rentang tanggal tumpang tindih dengan periode lain.";
  return `Gagal ${aksi} periode.`;
}

export async function tambahPeriode(formData: FormData) {
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("periode_akademik").insert(data);
  if (error) kembali(pesanError(error.code, "menambah"));

  revalidatePath(PATH);
  revalidatePath("/");
  kembali();
}

export async function ubahPeriode(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("periode_akademik").update(data).eq("id", id);
  if (error) kembali(pesanError(error.code, "mengubah"));

  revalidatePath(PATH);
  revalidatePath("/");
  kembali();
}

export async function aktifkanPeriode(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  // Fungsi database: menonaktifkan yang lama lalu mengaktifkan yang baru (satu transaksi)
  const { error } = await supabase.rpc("aktifkan_periode", { p_id: id });
  if (error) kembali("Gagal mengaktifkan periode.");

  revalidatePath(PATH);
  revalidatePath("/");
  kembali();
}

export async function hapusPeriode(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("periode_akademik").delete().eq("id", id);
  if (error) {
    kembali(
      error.code === "23503"
        ? "Periode ini sudah dipakai jadwal, jadi tidak bisa dihapus."
        : "Gagal menghapus periode.",
    );
  }

  revalidatePath(PATH);
  revalidatePath("/");
  kembali();
}
