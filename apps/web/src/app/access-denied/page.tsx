export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 shadow-soft text-center space-y-4">
        <div className="text-3xl font-extrabold">Access denied</div>
        <p className="text-sm text-black/70">
          You do not have permission to view this page. If you believe this is a mistake,
          please contact an administrator.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Return to dashboard
        </a>
      </div>
    </div>
  );
}
