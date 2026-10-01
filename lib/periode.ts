import type { SupabaseClient } from "@supabase/supabase-js";

// Mencari periode akademik yang berlaku pada tanggal tertentu.
// 1) periode yang rentang tanggalnya memuat tanggal itu;
// 2) cadangan: periode aktif yang BELUM punya tanggal (data lama).
// Di luar semua periode (misalnya libur antar semester) hasilnya null.
export async function cariPeriode(supabase: SupabaseClient, tanggal: string) {
  const { data: tepat } = await supabase
    .from("periode_akademik")
    .select("id, tahun_ajaran, jenis, aktif")
    .lte("tanggal_mulai", tanggal)
    .gte("tanggal_selesai", tanggal)
    .limit(1)
    .maybeSingle();
  if (tepat) return tepat;

  const { data: cadangan } = await supabase
    .from("periode_akademik")
    .select("id, tahun_ajaran, jenis, aktif")
    .eq("aktif", true)
    .is("tanggal_mulai", null)
    .maybeSingle();
  return cadangan ?? null;
}
