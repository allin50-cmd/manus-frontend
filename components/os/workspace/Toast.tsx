'use client'

import { useEffect, useRef } from 'react'

export interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({
  message,
  type,
  onDismiss,
}: ToastProps) {
  // Keep the latest onDismiss without making it a timer dependency: onDismiss
  // is a fresh closure every render, so depending on it directly restarts the
  // 3s timer on every re-render instead of running it once per toast.
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), 3000)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg"
      style={{
        backgroundColor:
          type === 'success' ? '#16a34a' : '#dc2626',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-white/80 hover:text-white text-lg leading-none"
      >
        &times;
      </button>
    </div>
  )
}

