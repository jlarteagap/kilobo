"use client"

import { useState, useEffect } from "react"
import { Category } from "@/types/category"
import { CategoryForm } from "./CategoryForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadCategories = async () => {
    try {
      setLoading(true)
      // TODO: Implement local storage or API call
      setCategories([])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    
    try {
      // TODO: Implement delete logic
      await loadCategories()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Categoría</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={() => {
              setIsDialogOpen(false)
              loadCategories()
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando categorías...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon || '📁'}</span>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    category.type === 'INCOME' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {category.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(category.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
