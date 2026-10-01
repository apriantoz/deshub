"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Prodi = { id: string; nama: string; singkatan: string | null };

export default function FilterJadwal({ daftarProdi }: { daftarProdi: Prodi[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateSearchParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  // Debounce generik tanpa 'any' dan kompatibel dengan kualifikasi tipe fungsi
  function debounce<T extends (...args: Parameters<T>) => void>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const debouncedSearch = debounce((val: string) => updateSearchParam("q", val), 300);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 text-sm shadow-sm">
      <label className="min-w-64 flex-1 space-y-1">
        <span className="flex items-center justify-between font-medium text-gray-700">
          <span>Cari Jadwal</span>
          {isPending && (
            <span className="text-xs text-blue-600 animate-pulse">
              Memuat...
            </span>
          )}
        </span>
        <input
          type="text"
          defaultValue={searchParams.get("q")?.toString() ?? ""}
          onChange={(e) => debouncedSearch(e.target.value)}
          placeholder="Cari mata kuliah, ruang, atau hari..."
          className="block w-full rounded-md border px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
      </label>

      {daftarProdi && daftarProdi.length > 0 && (
        <label className="space-y-1">
          <span className="block font-medium text-gray-700">Filter Prodi</span>
          <select
            defaultValue={searchParams.get("prodi")?.toString() ?? ""}
            onChange={(e) => updateSearchParam("prodi", e.target.value)}
            className="block rounded-md border px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">Semua Prodi</option>
            {daftarProdi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}