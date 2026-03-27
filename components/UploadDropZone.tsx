'use client'

import { useRef, useState, type DragEvent } from 'react'

type Props = {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
}

export default function UploadDropZone({ onFileSelect, accept = '.txt,.docx,.pdf', maxSizeMB = 5, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowed = accept.split(',').map(s => s.trim().replace('.', ''))
    if (!ext || !allowed.includes(ext)) {
      setError(`Format non supporte. Utilisez ${accept}`)
      return false
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Fichier trop volumineux (${maxSizeMB} Mo max)`)
      return false
    }
    setError(null)
    return true
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && validate(file)) onFileSelect(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && validate(file)) onFileSelect(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
        dragging ? 'border-[#C4622A] bg-[#C4622A]/10' : 'border-white/20 hover:border-white/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-[#FAF8F4] font-display text-xl italic mb-2">
        Glissez un fichier ici
      </p>
      <p className="text-[#9C8E80] text-sm">
        ou cliquez pour parcourir
      </p>
      <p className="text-[#9C8E80] text-xs mt-3">
        PDF, Word ou texte — {maxSizeMB} Mo max
      </p>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  )
}
