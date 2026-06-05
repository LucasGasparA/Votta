import { describe, expect, it } from 'vitest';
import { normalizeProposalContent, validateProposalContentJson } from './proposalContent.js';

describe('proposal content validation', () => {
  it('normalizes a valid proposal document', () => {
    const content = normalizeProposalContent({
      ementa: 'Dispõe sobre coleta seletiva.',
      preambulo: 'A Câmara Municipal aprova:',
      artigos: [
        { id: 1, numero: 'Art. 1º', texto: 'Fica instituído o programa.', citacoes: [] },
      ],
      vigencia: 'Esta Lei entra em vigor na data de sua publicação.',
      revogacao: '',
    });

    expect(content.artigos).toHaveLength(1);
    expect(content.artigos[0].numero).toBe('Art. 1º');
  });

  it('rejects invalid JSON strings', () => {
    expect(() => validateProposalContentJson('{')).toThrow('CONTENT_JSON_INVALID');
  });

  it('rejects unknown top-level fields', () => {
    expect(() => validateProposalContentJson(JSON.stringify({
      ementa: '',
      preambulo: '',
      artigos: [],
      vigencia: '',
      revogacao: '',
      script: '<script>alert(1)</script>',
    }))).toThrow();
  });
});
