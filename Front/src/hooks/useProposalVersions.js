import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'

export function useProposalVersions(id, { pendingDocRef, setDoc, setChaveDoc, setTemAlteracoes }) {
  const [exibirModalVersoes, setExibirModalVersoes]   = useState(false)
  const [versoes, setVersoes]                         = useState([])
  const [carregandoVersoes, setCarregandoVersoes]     = useState(false)
  const [confirmandoVersaoId, setConfirmandoVersaoId] = useState(null)

  const carregarVersoes = useCallback(async () => {
    setCarregandoVersoes(true)
    try {
      const data = await api.get('/proposals/' + id + '/versions')
      setVersoes(data)
    } catch {
      toast.error('Não foi possível carregar o histórico de versões.')
    } finally {
      setCarregandoVersoes(false)
    }
  }, [id])

  const abrirModalVersoes = useCallback(() => {
    setExibirModalVersoes(true)
    setConfirmandoVersaoId(null)
    carregarVersoes()
  }, [carregarVersoes])

  const restaurarVersao = useCallback((version) => {
    try {
      const restored = JSON.parse(version.content)
      pendingDocRef.current = restored
      setDoc(restored)
      setChaveDoc(k => k + 1)
      setTemAlteracoes(true)
      setExibirModalVersoes(false)
      toast.success(`Versão ${version.versionNumber} restaurada. Salve para confirmar.`)
    } catch {
      toast.error('Não foi possível restaurar esta versão.')
    }
  }, [pendingDocRef, setDoc, setChaveDoc, setTemAlteracoes])

  return {
    exibirModalVersoes, setExibirModalVersoes,
    versoes,
    carregandoVersoes,
    confirmandoVersaoId, setConfirmandoVersaoId,
    abrirModalVersoes,
    restaurarVersao,
  }
}
