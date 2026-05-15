import { municipiosHabilitados } from '../data/municipiosHabilitados.js'

const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

// Retorna os municípios habilitados de uma UF com nome oficial do IBGE.
// Se a API falhar, retorna o fallback local para não travar o sistema.
export async function buscarMunicipiosPorUF(uf) {
  const habilitados = municipiosHabilitados.filter(m => m.uf === uf)
  const ids = new Set(habilitados.map(m => String(m.ibgeId)))

  try {
    const res = await fetch(`${BASE}/estados/${uf}/municipios`)
    if (!res.ok) throw new Error(`IBGE retornou ${res.status}`)

    const todos = await res.json()
    const filtrados = todos.filter(m => ids.has(String(m.id)))

    return filtrados.map(m => ({
      ibgeId:      String(m.id),
      nome:        m.nome,
      nomeOficial: m.nome,
      uf,
    }))
  } catch {
    // Fallback local — sistema funciona mesmo offline ou com IBGE indisponível
    return habilitados.map(m => ({
      ibgeId:      m.ibgeId,
      nome:        m.nome,
      nomeOficial: m.nome,
      uf:          m.uf,
    }))
  }
}
