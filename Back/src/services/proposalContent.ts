import { z } from 'zod';

const citationSchema = z.object({
  titulo: z.string().max(500).optional(),
  url: z.string().url().max(2000).optional(),
}).passthrough();

const articleSchema = z.object({
  id: z.number().int().positive(),
  numero: z.string().min(1).max(50),
  texto: z.string().max(20000),
  citacoes: z.array(z.union([citationSchema, z.string().max(2000)])).default([]),
});

export const proposalContentSchema = z.object({
  ementa: z.string().max(5000).default(''),
  preambulo: z.string().max(10000).default(''),
  artigos: z.array(articleSchema).max(200).default([]),
  vigencia: z.string().max(5000).default(''),
  revogacao: z.string().max(5000).default(''),
}).strict();

export type ProposalContent = z.infer<typeof proposalContentSchema>;

export function normalizeProposalContent(content: unknown): ProposalContent {
  return proposalContentSchema.parse(content);
}

export function validateProposalContentJson(content: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('CONTENT_JSON_INVALID');
  }

  return JSON.stringify(normalizeProposalContent(parsed));
}
