// Jam disimpan di database sebagai menit sejak 00:00 (08:00 = 480).

export const HARI = [
  "SENIN",
  "SELASA",
  "RABU",
  "KAMIS",
  "JUMAT",
  "SABTU",
] as const;

export const LABEL_HARI: Record<string, string> = {
  SENIN: "Senin",
  SELASA: "Selasa",
  RABU: "Rabu",
  KAMIS: "Kamis",
  JUMAT: "Jumat",
  SABTU: "Sabtu",
};

const dua = (n: number) => String(n).padStart(2, "0");

// "08:30" (nilai <input type="time">) -> 510. Mengembalikan null kalau formatnya salah.
export function jamKeMenit(teks: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(teks.trim());
  if (!m) return null;
  const jam = Number(m[1]);
  const menit = Number(m[2]);
  if (jam > 23 || menit > 59) return null;
  return jam * 60 + menit;
}

// 510 -> "08.30" (untuk tampilan)
export function menitKeJam(total: number): string {
  return `${dua(Math.floor(total / 60))}.${dua(total % 60)}`;
}

// 510 -> "08:30" (untuk defaultValue <input type="time">)
export function menitKeInput(total: number): string {
  return `${dua(Math.floor(total / 60))}:${dua(total % 60)}`;
}

// ===== Helper tanggal (format "YYYY-MM-DD") =====

export function tanggalValid(teks: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(teks)) return false;
  const d = new Date(`${teks}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === teks;
}

// Tanggal hari ini menurut zona WITA (Bali), bukan zona server (Vercel memakai UTC)
export function hariIni(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" });
}

export function geserTanggal(teks: string, selisih: number): string {
  const d = new Date(`${teks}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + selisih);
  return d.toISOString().slice(0, 10);
}

// "2026-10-01" -> "KAMIS". Hari Minggu mengembalikan null (tidak ada jadwal kuliah).
export function hariDariTanggal(teks: string): string | null {
  const idx = new Date(`${teks}T00:00:00Z`).getUTCDay(); // 0 = Minggu
  return idx === 0 ? null : HARI[idx - 1];
}

export function labelTanggal(teks: string): string {
  return new Date(`${teks}T00:00:00Z`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "2026-10-01" -> "1 Okt 2026"
export function tanggalPendek(teks: string): string {
  return new Date(`${teks}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
