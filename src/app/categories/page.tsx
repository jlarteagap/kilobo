import { CategoriesList } from "@/features/categories/components/CategoriesList"
import AppLayout from "@/components/layout/AppLayout"

export default function CategoriesPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <CategoriesList />
      </div>
    </AppLayout>
  )
}
