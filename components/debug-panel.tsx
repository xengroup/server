"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [envInfo, setEnvInfo] = useState<Record<string, string>>({})

  const toggleVisibility = () => {
    if (!isVisible) {
      // Só carregar informações quando abrir o painel
      const info: Record<string, string> = {
        "Next.js Environment": process.env.NODE_ENV || "unknown",
        "Supabase URL exists": process.env.NEXT_PUBLIC_SUPABASE_URL ? "Yes" : "No",
        "Supabase Anon Key exists": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Yes" : "No",
        "Service Role Key exists": process.env.SUPABASE_SERVICE_ROLE_KEY
          ? "Yes (length: " + (process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0) + ")"
          : "No",
        Browser: typeof window !== "undefined" ? navigator.userAgent : "SSR",
      }
      setEnvInfo(info)
    }
    setIsVisible(!isVisible)
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100"
        onClick={toggleVisibility}
      >
        Debug
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-card p-4 rounded-lg shadow-lg border border-border max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Info</h3>
        <Button variant="ghost" size="sm" onClick={toggleVisibility}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs">
        {Object.entries(envInfo).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2 mb-1">
            <span className="font-medium">{key}:</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
