export function relativeTime(dateStr) {
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const sec = Math.round(diffMs / 1000)

  if (sec < 45) return 'agora mesmo'

  const min = Math.round(sec / 60)
  if (min < 60) return `há ${min} min`

  const hr = Math.round(min / 60)
  if (hr < 24) return `há ${hr} h`

  const day = Math.round(hr / 24)
  if (day < 7) return `há ${day} ${day === 1 ? 'dia' : 'dias'}`

  const wk = Math.round(day / 7)
  if (wk < 5) return `há ${wk} ${wk === 1 ? 'semana' : 'semanas'}`

  const mo = Math.round(day / 30)
  if (mo < 12) return `há ${mo} ${mo === 1 ? 'mês' : 'meses'}`

  const yr = Math.round(day / 365)
  return `há ${yr} ${yr === 1 ? 'ano' : 'anos'}`
}
