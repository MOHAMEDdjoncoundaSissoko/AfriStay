export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #1A3C34 0%, #2D5A4A 30%, #D4522A 70%, #E8A838 100%)' }}
    >
      {children}
    </main>
  );
}