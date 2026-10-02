import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coding Round · Practice workbench",
  description: "A local workspace for AI-assisted coding interview practice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
