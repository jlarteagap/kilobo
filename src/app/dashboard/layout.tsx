import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Kilo",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
