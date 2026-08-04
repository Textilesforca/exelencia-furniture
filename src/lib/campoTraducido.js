export function campoTraducido(objeto, campo, lang) {
  if (lang === 'en') {
    const valorEn = objeto?.[`${campo}_en`]
    if (valorEn && String(valorEn).trim()) return valorEn
  }
  return objeto?.[campo] ?? ''
}
