// features/projects/ProjectForm.tsx
"use client"

import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input }   from "@/components/ui/input"
import { Button }  from "@/components/ui/button"

import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project.schema"
import type { Project } from "@/types/project"

// ─── Paleta de colores predefinidos ──────────────────────────────────────────
const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
]

const PROJECT_ICONS = ['🚗', '🎬', '💻', '📦', '🏠', '📱', '🎵', '✈️', '🍔', '💡']

interface ProjectFormProps {
  initialData?: Project
  onSubmit:     (data: CreateProjectInput) => void
  onCancel:     () => void
  isPending:    boolean
}

export function ProjectForm({ initialData, onSubmit, onCancel, isPending }: ProjectFormProps) {
  const isEdit = !!initialData

  // Estado local para subtypes — se manejan como lista dinámica
  const [subtypeInput, setSubtypeInput] = useState('')

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema) as Resolver<CreateProjectInput>,
    defaultValues: {
      name:        initialData?.name        ?? '',
      description: initialData?.description ?? '',
      color:       initialData?.color       ?? PROJECT_COLORS[0],
      icon:        initialData?.icon        ?? PROJECT_ICONS[0],
      subtypes:    initialData?.subtypes    ?? [],
    },
  })

  const selectedColor    = useWatch({ control: form.control, name: 'color' })
  const selectedIcon     = useWatch({ control: form.control, name: 'icon' })
  const projectName      = useWatch({ control: form.control, name: 'name' })
  const currentSubtypes  = useWatch({ control: form.control, name: 'subtypes' }) ?? []

  const addSubtype = () => {
    const value = subtypeInput.trim()
    if (!value || currentSubtypes.includes(value)) return
    form.setValue('subtypes', [...currentSubtypes, value])
    setSubtypeInput('')
  }

  const removeSubtype = (s: string) => {
    form.setValue('subtypes', currentSubtypes.filter((t) => t !== s))
  }

  const handleSubtypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSubtype() }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Icono — chips seleccionables ── */}
        <FormField<CreateProjectInput>
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-neutral-600">
                Ícono
              </FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => field.onChange(icon)}
                      className={cn(
                        'w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-150',
                        field.value === icon
                          ? 'bg-neutral-900 shadow-sm scale-105'
                          : 'bg-neutral-100 hover:bg-neutral-200'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Color ── */}
        <FormField<CreateProjectInput>
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-neutral-600">
                Color
              </FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all duration-150',
                        field.value === color
                          ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                          : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Preview — igual que AccountCard ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-100">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: selectedColor + '20' }}
          >
            {selectedIcon}
          </div>
          <div>
            <p className="text-[13px] font-bold text-neutral-900 leading-tight">
              {projectName || 'Nombre del proyecto'}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {currentSubtypes.length > 0
                ? currentSubtypes.slice(0, 3).join(', ') + (currentSubtypes.length > 3 ? '…' : '')
                : 'Sin subtipos aún'}
            </p>
          </div>
        </div>

        {/* ── Nombre ── */}
        <FormField<CreateProjectInput>
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-neutral-600">
                Nombre
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Uber, Edición de video…"
                  {...field}
                  value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ""}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Descripción ── */}
        <FormField<CreateProjectInput>
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-neutral-600">
                Descripción
                <span className="text-neutral-400 font-normal ml-1">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Ingresos y gastos de Uber"
                  {...field}
                  value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ""}
                  className="rounded-xl border-0 bg-neutral-50 focus-visible:ring-neutral-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Subtipos ── */}
        <FormField<CreateProjectInput>
          control={form.control}
          name="subtypes"
          render={() => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-neutral-600">
                Subtipos
                <span className="text-neutral-400 font-normal ml-1">(opcional)</span>
              </FormLabel>

              {/* Input + botón agregar */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: gasolina, mantenimiento…"
                  value={subtypeInput}
                  onChange={(e) => setSubtypeInput(e.target.value)}
                  onKeyDown={handleSubtypeKeyDown}
                  className="rounded-xl border-0 bg-neutral-50 focus-visible:ring-neutral-900/10"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSubtype}
                  disabled={!subtypeInput.trim()}
                  className="rounded-xl flex-shrink-0 border-neutral-200"
                >
                  Agregar
                </Button>
              </div>

              {/* Chips de subtipos */}
              {currentSubtypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentSubtypes.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium bg-neutral-900 text-white"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSubtype(s)}
                        className="hover:opacity-70 transition-opacity ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Acciones ── */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando…</>
              : isEdit ? 'Guardar cambios' : 'Crear proyecto'
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}