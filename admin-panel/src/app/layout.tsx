import './globals.css';

export const metadata = {
  title: 'Ana Admin Dashboard',
  description: 'Manage settings, users, and track token usage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
