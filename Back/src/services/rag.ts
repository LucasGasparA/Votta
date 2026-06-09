import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RagSource = {
  titulo?: string;
  numero?: string;
  tipo?: string;
  data?: string;
  situacao?: string;
  url?: string;
  distance?: number | null;
};

export type RagResult = {
  context: string;
  sources: RagSource[];
};

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACK_ROOT = path.resolve(MODULE_DIR, '..', '..');
const DEFAULT_SCRIPT = path.join(BACK_ROOT, 'rag', 'retrieve.py');
const DEFAULT_CHROMA_DIR = path.resolve(BACK_ROOT, '..', 'chroma_db');

const RAG_TIMEOUT_MS = Number(process.env.RAG_TIMEOUT_MS ?? 20_000);
const RAG_RESULTS = Number(process.env.RAG_RESULTS ?? 4);

function isRagEnabled(): boolean {
  return process.env.RAG_ENABLED !== 'false';
}

function resolveRetrieverScript(): string {
  return process.env.RAG_RETRIEVER_SCRIPT || DEFAULT_SCRIPT;
}

function resolveChromaDir(): string {
  return process.env.CHROMA_DIR || DEFAULT_CHROMA_DIR;
}

export async function retrieveLegalContext(query: string, nResults = RAG_RESULTS): Promise<RagResult | null> {
  if (!isRagEnabled()) return null;

  const script = resolveRetrieverScript();
  const chromaDir = resolveChromaDir();

  if (!existsSync(script)) {
    console.warn(`RAG desabilitado: script nao encontrado em ${script}`);
    return null;
  }

  if (!existsSync(chromaDir)) {
    console.warn(`RAG desabilitado: chroma_db nao encontrado em ${chromaDir}`);
    return null;
  }

  const pythonBin = process.env.PYTHON_BIN || '/app/.venv/bin/python';
  const payload = JSON.stringify({ query, n_results: nResults });

  return new Promise((resolve) => {
    const child = spawn(pythonBin, [script], {
      cwd: BACK_ROOT,
      env: {
        ...process.env,
        CHROMA_DIR: chromaDir,
        PYTHONIOENCODING: 'utf-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill();
      console.warn('RAG retrieval timeout.');
      resolve(null);
    }, RAG_TIMEOUT_MS);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      console.warn('Erro ao iniciar RAG:', error.message);
      resolve(null);
    });

    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (code !== 0) {
        console.warn('RAG retornou erro:', stderr.trim() || `codigo ${code}`);
        resolve(null);
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as RagResult;
        resolve(parsed.context ? parsed : null);
      } catch (error: any) {
        console.warn('Resposta invalida do RAG:', error?.message ?? error);
        resolve(null);
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}
