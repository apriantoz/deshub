"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { jamKeMenit, menitKeJam, tanggalValid } from "@/lib/waktu";

const PATH = "/admin/peminjaman";

type Opsi = { error?: string; info?: string; peringatan?: string };

function kembali(opsi: Opsi = {}): never {
  const p = new URLSearchParams();
  if (opsi.error) p.set("error", opsi.error);
  if (opsi.info) p.set("info", opsi.info);
  if (opsi.peringatan) p.set("peringatan", opsi.peringatan);
  const qs = p.toString();
  redirect(qs ? `${PATH}?${qs}` : PATH);
}

function bacaForm(formData: FormData) {
  const ruangId = String(formData.get("ruang_id") ?? "");
  const tanggal = String(formData.get("tanggal") ?? "");
  const mulai = jamKeMenit(String(formData.get("jam_mulai") ?? ""));
  const selesai = jamKeMenit(String(formData.get("jam_selesai") ?? ""));
  const peminjam = String(formData.get("peminjam") ?? "").trim();
  const keperluan = String(formData.get("keperluan") ?? "").trim();
  const kontak = String(formData.get("kontak") ?? "").trim();

  if (!ruangId) kembali({ error: "Pilih ruang." });
  if (!tanggalValid(tanggal)) kembali({ error: "Tanggal tidak valid." });
  if (mulai === null || selesai === null) {
    kembali({ error: "Isi jam mulai dan jam selesai dengan benar." });
  }
  if (selesai <= mulai) {
    kembali({ error: "Jam selesai harus lebih besar dari jam mulai." });
  }
  if (peminjam.length < 2 || peminjam.length > 100) {
    kembali({ error: "Nama peminjam harus 2-100 karakter." });
  }
  if (keperluan.length < 3 || keperluan.length > 200) {
    kembali({ error: "Keperluan harus 3-200 karakter." });
  }
  if (kontak.length > 100) kembali({ error: "Kontak maksimal 100 karakter." });

  return {
    ruang_id: ruangId,
    tanggal,
    jam_mulai: mulai,
    jam_selesai: selesai,
    peminjam,
    keperluan,
    kontak: kontak || null,
  };
}

// Cek view peminjaman_bentrok; hasilnya berupa peringatan, bukan penolakan
async function peringatanBentrok(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<string | undefined> {
  const { data } = await supabase
    .from("peminjaman_bentrok")
    .select("jenis_lawan, lawan_nama, lawan_detail, lawan_jam_mulai, lawan_jam_selesai")
    .eq("peminjaman_id", id);

  if (!data || data.length === 0) return undefined;

  const daftar = data
    .map(
      (b) =>
        `${b.jenis_lawan === "JADWAL" ? "jadwal kuliah" : "peminjaman"} ${b.lawan_nama} (${b.lawan_detail}, ${menitKeJam(b.lawan_jam_mulai)}-${menitKeJam(b.lawan_jam_selesai)})`,
    )
    .join("; ");
  return `Bentrok dengan: ${daftar}`;
}

export async function tambahPeminjaman(formData: FormData) {
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { data: baru, error } = await supabase
    .from("peminjaman")
    .insert(data)
    .select("id")
    .single();
  if (error || !baru) {
    kembali({
      error: error?.message?.includes("Lab")
        ? "Lab tidak bisa dipinjam, hanya ruang umum dan teleconference."
        : "Gagal mencatat peminjaman.",
    });
  }

  revalidatePath(PATH);
  kembali({
    info: "Peminjaman dicatat dengan status Menunggu persetujuan.",
    peringatan: await peringatanBentrok(supabase, baru.id),
  });
}

export async function ubahPeminjaman(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = bacaForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("peminjaman").update(data).eq("id", id);
  if (error) kembali({ error: "Gagal mengubah peminjaman." });

  revalidatePath(PATH);
  revalidatePath("/");
  kembali({
    info: "Peminjaman diperbarui.",
    peringatan: await peringatanBentrok(supabase, id),
  });
}

export async function setujuiPeminjaman(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("peminjaman")
    .update({ status: "DISETUJUI", catatan_admin: null })
    .eq("id", id);
  if (error) kembali({ error: "Gagal menyetujui peminjaman." });

  revalidatePath(PATH);
  revalidatePath("/");
  kembali({
    info: "Peminjaman disetujui dan sekarang tampil di jadwal publik.",
    peringatan: await peringatanBentrok(supabase, id),
  });
}

export async function tolakPeminjaman(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const catatan = String(formData.get("catatan_admin") ?? "").trim();
  if (catatan.length > 200) kembali({ error: "Catatan maksimal 200 karakter." });

  const supabase = await createClient();
  const { error } = await supabase
    .from("peminjaman")
    .update({ status: "DITOLAK", catatan_admin: catatan || null })
    .eq("id", id);
  if (error) kembali({ error: "Gagal menolak peminjaman." });

  revalidatePath(PATH);
  revalidatePath("/");
  kembali({ info: "Peminjaman ditolak." });
}

export async function hapusPeminjaman(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("peminjaman").delete().eq("id", id);
  if (error) kembali({ error: "Gagal menghapus peminjaman." });

  revalidatePath(PATH);
  revalidatePath("/");
  kembali({ info: "Peminjaman dihapus." });
}
