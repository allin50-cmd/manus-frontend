'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-white shadow-lg"
      style={{
        backgroundColor:
          type === 'success' ? '#16a34a' : '#dc2626',
      }}
    >
      {message}
    </div>
  )
}

