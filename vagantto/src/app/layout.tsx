import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vagantto 🍱 | 西可児駅",
  description: "To-go bento ordering at Nishi-Kani Station",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            Vagantto <span aria-hidden>🍱</span>
          </a>
          <span className="station">西可児駅 · Nishi-Kani Station</span>
          <nav>
            <a href="/staff">Staff</a>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
