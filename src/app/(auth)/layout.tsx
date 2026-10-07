export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="dark bg-asphalt-950 text-foreground relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="from-sayfy-900/40 absolute inset-0 -z-10 bg-radial-[at_30%_20%] to-transparent to-60%"
      />
      {children}
    </main>
  );
}
