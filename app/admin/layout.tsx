import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl gap-4 p-3 text-sm">
          <Link href="/admin" className="font-semibold">
            Deshub
          </Link>
          <Link href="/admin/periode" className="hover:underline">
            Periode Akademik
          </Link>
          <Link href="/admin/prodi" className="hover:underline">
            Prodi
          </Link>
          <Link href="/admin/ruang" className="hover:underline">
            Ruang
          </Link>
          <Link href="/admin/mata-kuliah" className="hover:underline">
            Mata Kuliah
          </Link>
          <Link href="/admin/jadwal" className="hover:underline">
            Jadwal
          </Link>
          <Link href="/admin/peminjaman" className="hover:underline">
            Peminjaman
          </Link>
          <Link href="/" className="ml-auto text-gray-500 hover:underline">
            Lihat tampilan publik
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
