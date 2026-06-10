import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { exportToPDF } from '../services/exportarPdf.js'
import { exportToDocx } from '../services/exportarDocx.js'

export function useProposalExport({ tituloProposicao, pendingDocRef, municipioDocumento, formatoExportacao }) {
  const [exibirModalExportacao, setExibirModalExportacao] = useState(false)
  const [exportacaoRevisada, setExportacaoRevisada]       = useState(false)
  const [exportando, setExportando]                       = useState(false)

  const aoClicarExportar = useCallback(() => {
    setExportacaoRevisada(false)
    setExibirModalExportacao(true)
  }, [])

  const confirmarExportacao = useCallback(() => {
    setExibirModalExportacao(false)
    setExportando(true)
    const isDocx = formatoExportacao === 'DOCX'
    toast.promise(
      (isDocx
        ? exportToDocx(tituloProposicao, pendingDocRef.current, municipioDocumento)
        : exportToPDF(tituloProposicao, pendingDocRef.current, municipioDocumento)
      ).finally(() => setExportando(false)),
      {
        loading: isDocx ? 'Gerando DOCX...' : 'Gerando PDF...',
        success: isDocx ? 'DOCX exportado!'  : 'PDF exportado!',
        error:   isDocx ? 'Erro ao gerar DOCX' : 'Erro ao gerar PDF',
      }
    )
  }, [tituloProposicao, pendingDocRef, municipioDocumento, formatoExportacao])

  return {
    exibirModalExportacao, setExibirModalExportacao,
    exportacaoRevisada, setExportacaoRevisada,
    exportando,
    aoClicarExportar,
    confirmarExportacao,
  }
}
