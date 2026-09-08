import BackendHealthCheck from "./components/BackendHealthCheck";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-lg flex-col items-center gap-10 text-center">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
            AI Language Teacher
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Learn by speaking
          </h1>
          <p className="text-base leading-relaxed text-neutral-600">
            Practice natural conversations, get corrections, and track your
            progress — starting with Dutch.
          </p>
        </div>

        <BackendHealthCheck />
      </main>
    </div>
  );
}
