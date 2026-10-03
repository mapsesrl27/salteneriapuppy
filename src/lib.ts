export const bs = (n: any) => 'Bs ' + Number(n || 0).toFixed(2)
export const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
export const ini = (f: string) => f + 'T00:00:00-04:00'
export const fin = (f: string) => f + 'T23:59:59-04:00'
export function csv(nombre: string, filas: any[]) {
  if (!filas.length) return
  const k = Object.keys(filas[0])
  const t = [k.join(','), ...filas.map(r => k.map(c => JSON.stringify(r[c] ?? '')).join(','))].join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + t], { type: 'text/csv' })); a.download = nombre + '.csv'; a.click()
}
