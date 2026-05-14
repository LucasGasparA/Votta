import { useState, useEffect } from 'react'
import { User, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

export default function Configuracoes() {
  // ── Perfil ──────────────────────────────────────────────────────
  const [name,          setName]          = useState('')
  const [email,         setEmail]         = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Senha ────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent,     setShowCurrent]     = useState(false)
  const [showNew,         setShowNew]         = useState(false)
  const [savingPassword,  setSavingPassword]  = useState(false)

  useEffect(() => {
    api.get('/auth/me')
      .then(({ user }) => {
        setName(user.name || '')
        setEmail(user.email || '')
      })
      .catch(() => toast.error('Não foi possível carregar os dados do perfil.'))
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('O nome não pode ficar em branco.')
      return
    }
    setSavingProfile(true)
    try {
      await api.put('/auth/me', { name: name.trim() })
      toast.success('Nome atualizado com sucesso!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSavingPassword(true)
    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-xl font-display font-bold text-primary-800 mb-1">Configurações</h1>
        <p className="text-primary-500 text-sm">Gerencie sua conta e credenciais de acesso</p>
      </motion.div>

      <div className="space-y-4">

      {/* ── Seção Perfil ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-primary-100 shadow-sm"
      >
        <div className="flex items-center gap-3 p-6 border-b border-primary-100">
          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
            <User size={18} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-primary-800">Perfil</h2>
            <p className="text-xs text-primary-400">Seu nome de exibição no sistema</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-primary-700">
              Nome completo <span className="text-rosso-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-primary-200
                focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                outline-none transition-all duration-200 text-sm"
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-primary-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 rounded-xl border-2 border-primary-100
                bg-primary-50 text-primary-400 text-sm cursor-not-allowed outline-none"
            />
            <p className="text-xs text-primary-400">
              O e-mail não pode ser alterado. Entre em contato com o suporte se necessário.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white
                text-sm font-semibold rounded-xl hover:bg-primary-700
                active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {savingProfile ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {savingProfile ? 'Salvando...' : 'Salvar nome'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── Seção Segurança ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-primary-100 shadow-sm"
      >

        <div className="flex items-center gap-3 p-6 border-b border-primary-100">
          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
            <Lock size={18} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-primary-800">Segurança</h2>
            <p className="text-xs text-primary-400">Altere sua senha de acesso</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-primary-700">
              Senha atual <span className="text-rosso-500">*</span>
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-primary-200
                  focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                  outline-none transition-all duration-200 text-sm"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400
                  hover:text-primary-600 transition-colors"
                aria-label={showCurrent ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-sm font-medium text-primary-700">
              Nova senha <span className="text-rosso-500">*</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-primary-200
                  focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                  outline-none transition-all duration-200 text-sm"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400
                  hover:text-primary-600 transition-colors"
                aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-700">
              Confirmar nova senha <span className="text-rosso-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-primary-200
                focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                outline-none transition-all duration-200 text-sm"
              placeholder="Repita a nova senha"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white
                text-sm font-semibold rounded-xl hover:bg-primary-700
                active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {savingPassword ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              {savingPassword ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </motion.div>

      </div>
    </div>
  )
}
