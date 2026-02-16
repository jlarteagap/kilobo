"use client"

import { useState, useEffect } from "react"
import { Category } from "@/types/category"
import { CategoryForm } from "./CategoryForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { categoryService } from "@/services/categoryService"

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<{ id: string; type: 'INCOME' | 'EXPENSE' } | null>(null)

  const loadCategories = async () => {
    try {
      setLoading(true)
      const categories = await categoryService.getAll()
      setCategories(categories)
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
      await categoryService.delete(id)
      await loadCategories()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddSubcategory = (parentId: string, parentType: 'INCOME' | 'EXPENSE') => {
    setSelectedParent({ id: parentId, type: parentType })
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSelectedParent(null)
    }
  }

  // Organize categories by parent-child relationship
  const parentCategories = categories.filter(cat => !cat.parent_id)
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId)

  console.log(categories)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedParent ? 'Crear Subcategoría' : 'Crear Categoría'}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm 
              parentId={selectedParent?.id}
              parentType={selectedParent?.type}
              onSuccess={() => {
                setIsDialogOpen(false)
                setSelectedParent(null)
                loadCategories()
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando categorías...</div>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((category) => {
            const subcategories = getSubcategories(category.id)
            
            return (
              <div key={category.id} className="space-y-2">
                {/* Parent Category */}
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex items-center justify-between group">
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAddSubcategory(category.id, category.type)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-500 transition-all"
                      title="Agregar subcategoría"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {subcategories.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {subcategories.map((subcategory) => (
                      <div 
                        key={subcategory.id} 
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{subcategory.icon || '📄'}</span>
                          <div>
                            <h4 className="text-sm font-medium">{subcategory.name}</h4>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(subcategory.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
