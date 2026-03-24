import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { type AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from "./store"

interface SettingsContextValue {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS })
    saveSettings({ ...DEFAULT_SETTINGS })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

const SSR_FALLBACK: SettingsContextValue = {
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  return ctx ?? SSR_FALLBACK
}
