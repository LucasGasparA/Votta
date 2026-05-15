// Progressos por status — alterar aqui reflete em todo o app.
// DRAFT: rascunho inicial, REVIEW: aguardando revisão jurídica,
// APPROVED: aprovado, REJECTED: devolvido com vício formal.
export const PROGRESSO_POR_STATUS = {
  DRAFT:    30,
  REVIEW:   70,
  APPROVED: 100,
  REJECTED: 100,
}

export function calcularProgresso(status) {
  return PROGRESSO_POR_STATUS[status] ?? 30
}
