export default function AdvertiserHome() {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Advertiser Console</h1>
      <p className="text-muted-foreground">Manage campaigns and funding.</p>
      <div className="mt-6">
        <a
          href="/user"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Earn Yield
        </a>
      </div>
    </main>
  )
}




