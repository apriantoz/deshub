"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/ruang";
const JENIS = ["LAB", "KULIAH_UMUM", "TELECONFERENCE"] as const;

function kembali(pesan?: string): never {
  redirect(pesan ? `${PATH}?error=${encodeURIComponent(pesan)}` : PATH);
}

// Isian angka opsional: kosong -> null, selain itu harus bilangan bulat dalam rentang
function angkaOpsional(
  nilai: FormDataEntryValue | null,
  label: string,
  min: number,
  max: number,
): number | null {
  const teks = String(nilai ?? "").trim();
  if (teks === "") return null;
  const n = Number(teks);
  if (!Number.isInteger(n) || n < min || n > max) {
    kembali(`${label} harus bilangan bulat ${min}-${max}.`);
  }
  return n;
}

function bacaForm(formData: FormData) {
  const nama = String(formData.get("nama") ?? "").trim();
  const jenis = String(formData.get("jenis") ?? "");

  if (nama.length < 2 || nama.length > 60) {
    kembali("Nama ruang harus 2-60 karakter.");
  }
  if (!(JENIS as readonly string[]).includes(jenis)) {
    kembali("Jenis ruang tidak valid.");
  }

  return {
    nama,
    jenis,
    lantai: angkaOpsional(formData.get("lantai"), "Lantai", 0, 20),
    kapasitas: angkaOpsional(formData.get("kapasitas"), "Kapasitas", 1, 1000),
  };
}

export async function tambahRuang(formData: FormData) {
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("ruang").insert(data);
  if (error) {
    kembali(
      error.code === "23505"
        ? "Nama ruang itu sudah ada."
        : "Gagal menambah ruang.",
    );
  }

  revalidatePath(PATH);
  kembali();
}

export async function ubahRuang(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("ruang").update(data).eq("id", id);
  if (error) {
    kembali(
      error.code === "23505"
        ? "Nama ruang itu sudah dipakai ruang lain."
        : "Gagal mengubah ruang.",
    );
  }

  revalidatePath(PATH);
  kembali();
}

export async function hapusRuang(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("ruang").delete().eq("id", id);
  if (error) {
    kembali(
      error.code === "23503"
        ? "Ruang ini sudah dipakai jadwal, jadi tidak bisa dihapus."
        : "Gagal menghapus ruang.",
    );
  }

  revalidatePath(PATH);
  kembali();
}
