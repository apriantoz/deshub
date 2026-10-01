"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/mata-kuliah";

function kembali(pesan?: string): never {
  redirect(pesan ? `${PATH}?error=${encodeURIComponent(pesan)}` : PATH);
}

function bacaForm(formData: FormData) {
  const nama = String(formData.get("nama") ?? "").trim();
  const semester = Number(formData.get("semester"));
  const prodiId = String(formData.get("prodi_id") ?? "");

  if (nama.length < 3 || nama.length > 100) {
    kembali("Nama mata kuliah harus 3-100 karakter.");
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    kembali("Semester harus bilangan bulat 1-8.");
  }
  if (!prodiId) kembali("Pilih prodi terlebih dahulu.");

  return { nama, semester, prodi_id: prodiId };
}

export async function tambahMataKuliah(formData: FormData) {
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("mata_kuliah").insert(data);
  if (error) {
    kembali(
      error.code === "23505"
        ? "Mata kuliah itu sudah ada di prodi tersebut."
        : "Gagal menambah mata kuliah.",
    );
  }

  revalidatePath(PATH);
  kembali();
}

export async function ubahMataKuliah(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("mata_kuliah").update(data).eq("id", id);
  if (error) {
    kembali(
      error.code === "23505"
        ? "Prodi itu sudah punya mata kuliah dengan nama tersebut."
        : "Gagal mengubah mata kuliah.",
    );
  }

  revalidatePath(PATH);
  kembali();
}

export async function hapusMataKuliah(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("mata_kuliah").delete().eq("id", id);
  if (error) {
    kembali(
      error.code === "23503"
        ? "Mata kuliah ini sudah dipakai jadwal, jadi tidak bisa dihapus."
        : "Gagal menghapus mata kuliah.",
    );
  }

  revalidatePath(PATH);
  kembali();
}
