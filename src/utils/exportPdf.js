const PAGE_W      = 210;
const PAGE_H      = 297;
const MARGIN_H    = 25;   // left & right
const MARGIN_TOP  = 22;
const MARGIN_BOT  = 22;
const USABLE_W    = PAGE_W - MARGIN_H * 2;  // 160mm
const LINE_H      = 6.5;

export async function exportToPDF(proposalTitle = 'Proposição', doc, municipality = null) {
  let settings = {}
  try {
    const saved = localStorage.getItem('legisla:settings')
    if (saved) settings = JSON.parse(saved)
  } catch { /* usa padrões */ }
  const includePageNumbers    = settings.includePageNumbers    !== false
  const includeGenerationDate = settings.includeGenerationDate !== false

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN_TOP;

  const municipioNome = municipality?.nomeOficial || municipality?.nome || 'Nova Veneza'
  const municipioUF   = municipality?.uf || 'SC'
  const municipioSlug = `${municipioNome}/${municipioUF}`

  /* ── helpers ──────────────────────────────────────────────────── */

  function newPageIfNeeded(needed = LINE_H * 2) {
    if (y + needed > PAGE_H - MARGIN_BOT) {
      pdf.addPage();
      y = MARGIN_TOP;
    }
  }

  function text(str, x, opts = {}) {
    const { size = 11, style = 'normal', align = 'left', maxW = USABLE_W, color = [0, 0, 0] } = opts;
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(str || '', maxW);
    newPageIfNeeded(lines.length * LINE_H);
    pdf.text(lines, x, y, { align });
    y += lines.length * LINE_H;
  }

  function gap(mm = 6) { y += mm; }

  function hline(color = [200, 200, 200]) {
    pdf.setDrawColor(...color);
    pdf.line(MARGIN_H, y, PAGE_W - MARGIN_H, y);
    y += 5;
  }

  /* ── Cabeçalho ────────────────────────────────────────────────── */
  text('ESTADO DE SANTA CATARINA',             PAGE_W / 2, { size: 11, style: 'bold', align: 'center' });
  gap(3);
  text(`CÂMARA MUNICIPAL DE ${municipioNome.toUpperCase()}`, PAGE_W / 2, { size: 11, style: 'bold', align: 'center' });
  gap(6);
  hline([0, 0, 0]);
  gap(2);

  /* ── Ementa (itálico, alinhada à direita, meia largura) ───────── */
  if (doc.ementa?.trim()) {
    const halfW = USABLE_W * 0.55;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bolditalic');
    pdf.setTextColor(0, 0, 0);
    const lines = pdf.splitTextToSize(doc.ementa, halfW);
    newPageIfNeeded(lines.length * LINE_H + 8);
    pdf.text(lines, PAGE_W - MARGIN_H, y, { align: 'right' });
    y += lines.length * LINE_H;
    gap(10);
  }

  /* ── Preâmbulo ────────────────────────────────────────────────── */
  if (doc.preambulo?.trim()) {
    text(doc.preambulo, MARGIN_H, { style: 'normal', size: 11 });
    gap(8);
  }

  /* ── Artigos ──────────────────────────────────────────────────── */
  if (doc.artigos?.length) {
    doc.artigos.forEach((artigo) => {
      if (!artigo.texto?.trim()) return;

      newPageIfNeeded(LINE_H * 3);

      // Número do artigo em negrito
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const numLabel = artigo.numero + '  ';   // non-breaking spaces
      const numW = pdf.getTextWidth(numLabel);
      pdf.text(numLabel, MARGIN_H, y);

      // Texto do artigo em normal, indentado
      pdf.setFont('helvetica', 'normal');
      const bodyLines = pdf.splitTextToSize(artigo.texto, USABLE_W - numW);
      pdf.text(bodyLines, MARGIN_H + numW, y);

      y += bodyLines.length * LINE_H;
      gap(4);
    });
    gap(2);
  }

  /* ── Vigência ─────────────────────────────────────────────────── */
  if (doc.vigencia?.trim()) {
    text(doc.vigencia, MARGIN_H, { style: 'normal', size: 11 });
    gap(4);
  }

  /* ── Revogação ────────────────────────────────────────────────── */
  if (doc.revogacao?.trim()) {
    text(doc.revogacao, MARGIN_H, { style: 'normal', size: 11 });
    gap(20);
  }

  /* ── Data e assinatura ────────────────────────────────────────── */
  newPageIfNeeded(40);
  const dateStr = includeGenerationDate
    ? `${municipioSlug}, ${new Date().toLocaleDateString('pt-BR')}`
    : `${municipioSlug}, ____/____/________`;
  text(dateStr, PAGE_W / 2, { style: 'normal', size: 11, align: 'center' });
  gap(18);

  const sigX1 = PAGE_W / 2 - 35;
  const sigX2 = PAGE_W / 2 + 35;
  pdf.setDrawColor(0, 0, 0);
  pdf.line(sigX1, y, sigX2, y);
  gap(5);
  text(proposalTitle.length > 40 ? 'Assinatura' : proposalTitle, PAGE_W / 2, { style: 'bold', size: 10, align: 'center' });

  /* ── Número da página ─────────────────────────────────────────── */
  if (includePageNumbers) {
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Página ${i} de ${totalPages}`, PAGE_W - MARGIN_H, PAGE_H - 10, { align: 'right' });
    }
  }

  /* ── Salvar ───────────────────────────────────────────────────── */
  const filename = proposalTitle
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '').trim()
    .replace(/\s+/g, '_')
    .substring(0, 60) || 'proposicao';

  pdf.save(`${filename}.pdf`);
}
