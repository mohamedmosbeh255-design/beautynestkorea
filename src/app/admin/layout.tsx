// Pass-through layout so /admin/login renders clean (no dashboard nav).
// The dashboard chrome lives in (dashboard)/layout.tsx and only wraps
// authenticated routes: /admin, /admin/products, ...
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>;
}
