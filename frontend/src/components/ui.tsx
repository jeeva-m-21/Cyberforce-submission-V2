import React from 'react'
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'

interface StatusBadgeProps {
  status: 'queued' | 'running' | 'completed' | 'failed'
  message?: string
}

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    queued: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: <FiLoader className="w-4 h-4 animate-spin" />,
    },
    running: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      icon: <FiLoader className="w-4 h-4 animate-spin" />,
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: <FiCheckCircle className="w-4 h-4" />,
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: <FiAlertCircle className="w-4 h-4" />,
    },
  }

  const style = styles[status]
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text} text-sm font-medium`}>
      {style.icon}
      <span>{label}</span>
    </div>
  )
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-500"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  )
}

export function Card({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`surface rounded-lg shadow-md border p-6 ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}) {
  const baseStyles =
    'px-4 py-2 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-white text-black rounded-full',
    secondary: 'bg-transparent border border-var text-muted rounded-md',
    danger: 'bg-transparent border border-red-600 text-red-600 rounded-md',
  }

  return (
    <button
      disabled={loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <FiLoader className="animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export function Input({
  label,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`input-base px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    </div>
  )
}

export function Select({
  label,
  options,
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options?: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`input-base px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {options ? (
          <>
            <option value="">-- Select an option --</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </>
        ) : (
          children
        )}
      </select>
    </div>
  )
}

export function Textarea({
  label,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        className={`input-base px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${className}`}
        {...props}
      />
    </div>
  )
}
