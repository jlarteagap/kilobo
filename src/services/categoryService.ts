
import { 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  updateDoc,
} from "firebase/firestore";
import { categoriesCollection } from "@/lib/firebase";
import { Category, CreateCategoryData } from "@/types/category";

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const q = query(
      categoriesCollection
    );
    
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, "id">)
    }))

    return categories;
  },

  async create(data: CreateCategoryData): Promise<Category> {
    const newCategory = {
      ...data,
      parent_id: data.parent_id || null,
      icon: data.icon || null
    };
    
    const docRef = await addDoc(categoriesCollection, newCategory);
    
    return {
      id: docRef.id,
      ...newCategory
    };
  },

  async update(id: string, data: Partial<CreateCategoryData>): Promise<void> {
    const docRef = doc(categoriesCollection, id);
    await updateDoc(docRef, data);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(categoriesCollection, id);
    await deleteDoc(docRef);
  }
};