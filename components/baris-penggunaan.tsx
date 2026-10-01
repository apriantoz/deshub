import { menitKeJam } from "@/lib/waktu";

export type Penggunaan = {
  jamMulai: number;
  jamSelesai: number;
  judul: string;
  keterangan: string;
  tipe: "KULIAH" | "PINJAM";
};

export function BarisPenggunaan({ p }: { p: Penggunaan }) {
  return (
    <li className="flex items-start gap-3 py-2 text-sm">
      <span className="w-28 shrink-0 font-mono text-gray-600">
        {menitKeJam(p.jamMulai)}-{menitKeJam(p.jamSelesai)}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{p.judul}</span>
          {p.tipe === "PINJAM" && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
              Peminjaman
            </span>
          )}
        </div>
        <div className="text-gray-500">{p.keterangan}</div>
      </div>
    </li>
  );
}
