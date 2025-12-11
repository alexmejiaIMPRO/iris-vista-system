export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      {children}
    </div>
  );
}
