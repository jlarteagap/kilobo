// Responsabilidad única: input de tags tipo chip
import { useRef, KeyboardEvent, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryTagsInputProps {
  value:    string[]
  onChange: (tags: string[]) => void
  // Tags que no se pueden eliminar porque están en uso
  lockedTags?: string[]
}

export function CategoryTagsInput({ value, onChange, lockedTags = [] }: CategoryTagsInputProps) {
  const [input, setInput] = useState('')
  const inputRef          = useRef<HTMLInputElement>(null)

  const addTag = () => {
    const tag = input.trim().toLowerCase()
    if (!tag || value.includes(tag) || value.length >= 10) return
    onChange([...value, tag])
    setInput('')
  }

  const removeTag = (tag: string) => {
    if (lockedTags.includes(tag)) return // no eliminar tags en uso
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      const last = value[value.length - 1]
      removeTag(last)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-gray-600">
        Tags <span className="text-gray-400 font-normal">(opcional)</span>
      </label>

      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'min-h-[46px] w-full rounded-xl bg-gray-50 px-3 py-2',
          'flex flex-wrap gap-1.5 items-center cursor-text',
          'focus-within:ring-2 focus-within:ring-gray-900/10 transition-all duration-200'
        )}
      >
        {value.map((tag) => {
          const locked = lockedTags.includes(tag)
          return (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium',
                locked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700'
              )}
            >
              {tag}
              {locked ? (
                // Tag en uso — muestra candado en lugar de X
                <span title="En uso en transacciones" className="text-[10px]">🔒</span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                  className="hover:text-gray-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )
        })}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? 'Añadir etiqueta…' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm placeholder:text-gray-300 focus:outline-none"
        />
      </div>

      <p className="text-[12px] text-gray-400">
        Enter o coma para añadir · máx. 10 etiquetas
        {lockedTags.length > 0 && (
          <span className="ml-1 text-gray-400">
            · 🔒 etiquetas en uso no pueden eliminarse
          </span>
        )}
      </p>
    </div>
  )
}