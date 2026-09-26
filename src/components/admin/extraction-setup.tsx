/** Shown when ANTHROPIC_API_KEY isn't configured, so extraction can't run. */
export function ExtractionSetupNotice() {
  return (
    <div role="status" className="border-l-2 border-brass bg-brass/10 px-5 py-4 text-sm text-ink-soft">
      <p className="font-semibold text-ink">Image reading isn&apos;t set up yet</p>
      <p className="mt-1">
        Uploads are stored, but details can&apos;t be read from them until an Anthropic API key is configured. To set it up:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Create a key at <span className="font-mono">console.anthropic.com</span> → API keys.</li>
        <li>Add <code className="bg-paper px-1 font-mono">ANTHROPIC_API_KEY=&quot;sk-ant-…&quot;</code> to the server&apos;s <code className="font-mono">.env</code>.</li>
        <li>Restart the server, then use “Read details” on each upload.</li>
      </ol>
    </div>
  );
}
