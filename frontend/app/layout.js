import "./globals.css";
import Navbar from "../components/Navbar";
import { WishlistProvider } from "../components/marketplace/wishlist/WishlistProvider";

export const metadata = {
  title: "Bazara B2B Marketplace",
  description: "A B2B marketplace for clients, vendors, and admin users.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <WishlistProvider>
          <Navbar />
          {children}
        </WishlistProvider>
      </body>
    </html>
  );
}
