import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailSignupBar from "@/components/EmailSignupBar";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <EmailSignupBar />
    </div>
  );
}
