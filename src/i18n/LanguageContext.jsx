import { createContext, useContext, useMemo, useState } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)

function resolver(dict, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict)
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('idioma') || 'es')

  function setLang(nuevoIdioma) {
    setLangState(nuevoIdioma)
    localStorage.setItem('idioma', nuevoIdioma)
  }

  const t = useMemo(() => {
    return (path, vars) => {
      let texto = resolver(translations[lang], path) ?? resolver(translations.es, path) ?? path
      if (vars) {
        for (const [clave, valor] of Object.entries(vars)) {
          texto = texto.replace(`{${clave}}`, valor)
        }
      }
      return texto
    }
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
