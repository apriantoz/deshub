"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/prodi";

function kembali(pesan?: string): never {
  redirect(pesan ? `${PATH}?error=${encodeURIComponent(pesan)}` : PATH);
}

// Membaca & memvalidasi isian form; mengembalikan data bersih atau mengalihkan dengan pesan error
function bacaForm(formData: FormData) {
  const nama = String(formData.get("nama") ?? "").trim();
  const singkatan = String(formData.get("singkatan") ?? "").trim();

  if (nama.length < 3) kembali("Nama prodi minimal 3 karakter.");
  if (nama.length > 100) kembali("Nama prodi maksimal 100 karakter.");
  if (singkatan.length > 10) kembali("Singkatan maksimal 10 karakter.");

  return { nama, singkatan: singkatan || null };
}

export async function tambahProdi(formData: FormData) {
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("prodi").insert(data);
  if (error) {
    kembali(
      error.code === "23505"
        ? "Nama prodi itu sudah ada."
        : "Gagal menambah prodi.",
    );
  }

  revalidatePath(PATH);
  kembali();
}

export async function ubahProdi(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("prodi").update(data).eq("id", id);
  if (error) {
    kembali(
      error.code === "23505"
        ? "Nama prodi itu sudah dipakai prodi lain."
        : "Gagal mengubah prodi.",
    );
  }

  revalidatePath(PATH);
  kembali();
}

export async function hapusProdi(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("prodi").delete().eq("id", id);
  if (error) {
    kembali(
      error.code === "23503"
        ? "Prodi ini masih punya mata kuliah, jadi tidak bisa dihapus."
        : "Gagal menghapus prodi.",
    );
  }

  revalidatePath(PATH);
  kembali();
}
