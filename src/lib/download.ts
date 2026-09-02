/**
 * Offers a generated file to the user. When running inside the Claude Artifacts
 * viewer, a plain `<a download>` link/anchor click does nothing — the sandbox
 * only hands a file to the viewer through the platform's `downloads` capability
 * (a confirm-and-save prompt). Outside that viewer (a real self-hosted
 * deployment), `window.claude` doesn't exist at all, so this falls back to the
 * standard browser download.
 */

interface ClaudeDownloadsNamespace {
  save(req: { filename: string; data: string }): Promise<{ status: 'saved' }>;
}

interface ClaudeGlobal {
  use(name: string): Promise<unknown>;
}

async function getClaudeDownloads(): Promise<ClaudeDownloadsNamespace | null> {
  const claude = (window as unknown as { claude?: ClaudeGlobal }).claude;
  if (!claude) return null;
  try {
    const ns = await claude.use('downloads');
    return (ns as ClaudeDownloadsNamespace | null) ?? null;
  } catch {
    return null;
  }
}

function downloadViaAnchor(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface SaveFileResult {
  ok: boolean;
  reason?: string;
}

export async function saveFile(filename: string, contents: string, mimeType: string): Promise<SaveFileResult> {
  const claudeDownloads = await getClaudeDownloads();
  if (claudeDownloads) {
    try {
      await claudeDownloads.save({ filename, data: contents });
      return { ok: true };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'declined') return { ok: false, reason: 'declined' };
      return { ok: false, reason: 'Could not save the file here.' };
    }
  }
  downloadViaAnchor(filename, contents, mimeType);
  return { ok: true };
}
