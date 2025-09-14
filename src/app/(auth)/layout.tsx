// import { Navbar } from '@/components/layout/Navbar';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* <Navbar /> */}
      <div className="flex-1">{children}</div>
    </>
  );
}
