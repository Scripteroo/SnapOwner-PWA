export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-lens-bg flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-lens-accent/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📡</span>
        </div>
        <h1 className="text-xl font-bold text-lens-text mb-2">You&apos;re Offline</h1>
        <p className="text-lens-secondary text-sm">SnapOwner needs an internet connection. Please check your connection and try again.</p>
      </div>
    </div>
  );
}
