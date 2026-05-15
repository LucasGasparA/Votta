import { createContext, useContext, useState, useEffect } from 'react'

const TemaContext = createContext()

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try {
      const s = localStorage.getItem('legisla:settings')
      return s ? (JSON.parse(s).theme ?? 'light') : 'light'
    } catch { return 'light' }
  })

  useEffect(() => {
    const el = document.documentElement
    if (tema === 'dark') {
      el.classList.add('dark')
    } else {
      el.classList.remove('dark')
    }
  }, [tema])

  return (
    <TemaContext.Provider value={{ tema, definirTema: setTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export const useTema = () => useContext(TemaContext)
