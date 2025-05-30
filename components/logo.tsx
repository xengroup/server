"use client"

import { useState } from "react"
import Image from "next/image"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 150, height = 150, className = "" }: LogoProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div
        className={`flex items-center justify-center font-bold text-primary-accent ${className}`}
        style={{ width, height: height / 2 }}
      >
        ValoreClub
      </div>
    )
  }

  return (
    <Image
      src="/logo.svg"
      alt="ValoreClub Tracker"
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
    />
  )
}
