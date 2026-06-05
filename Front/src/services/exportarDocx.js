import {
  Document, Paragraph, TextRun, AlignmentType,
  Footer, PageNumber, Packer, BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'

export async function exportToDocx(proposalTitle = 'Proposição', doc, municipality = null) {
  let settings = {}
  try {
    const saved = localStorage.getItem('legisla:settings')
    if (saved) settings = JSON.parse(saved)
  } catch { /* usa padrões */ }
  const includePageNumbers    = settings.includePageNumbers    !== false
  const includeGenerationDate = settings.includeGenerationDate !== false

  const municipioNome = municipality?.nomeOficial || municipality?.nome || 'Nova Veneza'
  const municipioUF   = municipality?.uf || 'SC'
  const municipioSlug = `${municipioNome}/${municipioUF}`

  const children = []

  /* ── Cabeçalho ─────────────────────────────────────────────────── */
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'ESTADO DE SANTA CATARINA', bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `CÂMARA MUNICIPAL DE ${municipioNome.toUpperCase()}`, bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
    }),
    new Paragraph({ children: [], spacing: { after: 160 } }),
  )

  /* ── Ementa ─────────────────────────────────────────────────────── */
  if (doc.ementa?.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: doc.ementa, italics: true, bold: true, size: 20 })],
        alignment: AlignmentType.RIGHT,
        indent: { left: 4320 },
        spacing: { before: 160, after: 400 },
      }),
    )
  }

  /* ── Preâmbulo ──────────────────────────────────────────────────── */
  if (doc.preambulo?.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: doc.preambulo, size: 24 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 320 },
      }),
    )
  }

  /* ── Artigos ────────────────────────────────────────────────────── */
  if (doc.artigos?.length) {
    doc.artigos.forEach(artigo => {
      if (!artigo.texto?.trim()) return
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: artigo.numero + '  ', bold: true, size: 24 }),
            new TextRun({ text: artigo.texto, size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
        }),
      )
    })
    children.push(new Paragraph({ children: [], spacing: { after: 80 } }))
  }

  /* ── Vigência ───────────────────────────────────────────────────── */
  if (doc.vigencia?.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: doc.vigencia, size: 24 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160 },
      }),
    )
  }

  /* ── Revogação ──────────────────────────────────────────────────── */
  if (doc.revogacao?.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: doc.revogacao, size: 24 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 640 },
      }),
    )
  }

  /* ── Data ───────────────────────────────────────────────────────── */
  const dateStr = includeGenerationDate
    ? `${municipioSlug}, ${new Date().toLocaleDateString('pt-BR')}`
    : `${municipioSlug}, ____/____/________`
  children.push(
    new Paragraph({
      children: [new TextRun({ text: dateStr, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
    }),
  )

  /* ── Assinatura ─────────────────────────────────────────────────── */
  const sigLabel = proposalTitle.length > 40 ? 'Assinatura' : proposalTitle
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '_'.repeat(40), size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: sigLabel, bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
    }),
  )

  /* ── Rodapé com número de página ───────────────────────────────── */
  const footer = includePageNumbers
    ? new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Página ', size: 18, color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888' }),
              new TextRun({ text: ' de ', size: 18, color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '888888' }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      })
    : undefined

  const document = new Document({
    sections: [
      {
        properties: {},
        ...(footer ? { footers: { default: footer } } : {}),
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(document)

  const filename = proposalTitle
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '').trim()
    .replace(/\s+/g, '_')
    .substring(0, 60) || 'proposicao'

  saveAs(blob, `${filename}.docx`)
}
