"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateCategory } from "../hooks/useCategories"

// ─── Paleta de colores estilo Apple ──────────────────────────────────────────
const COLOR_PALETTE = [
  { value: '#FFB3B3', label: 'Rosa'     },
  { value: '#FFD9B3', label: 'Melocotón'},
  { value: '#FFFAB3', label: 'Amarillo' },
  { value: '#B3F0D9', label: 'Menta'    },
  { value: '#B3D9FF', label: 'Azul'     },
  { value: '#D9B3FF', label: 'Lavanda'  },
  { value: '#B3FFD9', label: 'Verde'    },
  { value: '#E0E0E0', label: 'Gris'     },
]

// ─── Schema de validación ─────────────────────────────────────────────────────
const categorySchema = z.object({
  name:      z.string().min(1, 'El nombre es requerido').max(50),
  type:      z.enum(['INCOME', 'EXPENSE']),
  icon:      z.string().optional(),
  color:     z.string().optional(),
  tags:      z.array(z.string().max(20)).max(10).optional(),
  parent_id: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  onSuccess?: () => void
  parentId?:   string | null
  parentType?: 'INCOME' | 'EXPENSE'
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function CategoryForm({ onSuccess, parentId, parentType }: CategoryFormProps) {
  const createCategory = useCreateCategory()
  const [tags, setTags]         = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const tagInputRef             = useRef<HTMLInputElement>(null)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type:      parentType ?? 'EXPENSE',
      name:      '',
      icon:      '',
      color:     COLOR_PALETTE[4].value,
      tags:      [],
      parent_id: parentId ?? undefined,
    },
  })

  const selectedColor = useWatch({ control: form.control, name: 'color' })
  const selectedType  = useWatch({ control: form.control, name: 'type' })

  // ─── Tag logic ──────────────────────────────────────────────────────────────
  const addTag = () => {
    const value = tagInput.trim().toLowerCase()
    if (!value || tags.includes(value) || tags.length >= 10) return
    const next = [...tags, value]
    setTags(next)
    form.setValue('tags', next)
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag)
    setTags(next)
    form.setValue('tags', next)
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CategoryFormValues) => {
    await createCategory.mutateAsync({ ...data, tags })
    form.reset()
    setTags([])
    onSuccess?.()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

      {/* ── Selector de tipo (solo para categorías raíz) ── */}
      {!parentId ? (
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => form.setValue('type', t)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                selectedType === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
          <span className="text-[13px] text-gray-500">
            Subcategoría de tipo
          </span>
          <span className={cn(
            'text-[12px] font-medium px-2 py-0.5 rounded-full',
            parentType === 'INCOME'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          )}>
            {parentType === 'INCOME' ? 'Ingreso' : 'Gasto'}
          </span>
        </div>
      )}

      {/* ── Nombre ── */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-gray-600">Nombre</label>
        <input
          {...form.register('name')}
          placeholder="Ej: Alimentación, Transporte…"
          className={cn(
            'w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm',
            'placeholder:text-gray-300 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-gray-900/10',
            'transition-all duration-200',
            form.formState.errors.name && 'ring-2 ring-rose-300'
          )}
        />
        {form.formState.errors.name && (
          <p className="text-[12px] text-rose-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* ── Icono ── */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-gray-600">
          Icono <span className="text-gray-400 font-normal">(emoji)</span>
        </label>
        <input
          {...form.register('icon')}
          placeholder="🍔"
          className={cn(
            'w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm',
            'placeholder:text-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-gray-900/10',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* ── Color ── */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-gray-600">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PALETTE.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() => form.setValue('color', value)}
              className={cn(
                'w-7 h-7 rounded-full transition-all duration-200',
                'hover:scale-110 focus:outline-none',
                selectedColor === value
                  ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  : 'ring-1 ring-black/5'
              )}
              style={{ backgroundColor: value }}
            />
          ))}
        </div>
      </div>

      {/* ── Tags ── */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-gray-600">
          Tags <span className="text-gray-400 font-normal">(opcional)</span>
        </label>

        {/* Área de chips + input */}
        <div
          onClick={() => tagInputRef.current?.focus()}
          className={cn(
            'min-h-[46px] w-full rounded-xl bg-gray-50 px-3 py-2',
            'flex flex-wrap gap-1.5 items-center cursor-text',
            'focus-within:ring-2 focus-within:ring-gray-900/10 transition-all duration-200'
          )}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 rounded-full text-[12px] text-gray-700 font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                className="hover:text-gray-900 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? 'Añadir tag…' : ''}
            className="flex-1 min-w-[80px] bg-transparent text-sm placeholder:text-gray-300 focus:outline-none"
          />
        </div>
        <p className="text-[12px] text-gray-400">
          Presiona Enter o coma para añadir · máximo 10 tags
        </p>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={createCategory.isPending}
        className={cn(
          'w-full flex justify-center items-center gap-2',
          'py-3 px-4 rounded-xl text-sm font-medium text-white',
          'bg-gray-900 hover:bg-gray-800',
          'transition-all duration-200 shadow-sm hover:shadow-md',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
        )}
      >
        {createCategory.isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</>
          : parentId ? 'Crear Subcategoría' : 'Crear Categoría'
        }
      </button>
    </form>
  )
}