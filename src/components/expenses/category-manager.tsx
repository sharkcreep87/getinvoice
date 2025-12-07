'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Tags } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

type ExpenseCategory = {
  id: string
  name: string
  is_predefined: boolean
}

type CategoryManagerProps = {
  categories: ExpenseCategory[]
  onCategoriesChange: () => void
}

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const openAddDialog = () => {
    setEditingCategory(null)
    setCategoryName("")
    setDialogOpen(true)
  }

  const openEditDialog = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const trimmedName = categoryName.trim()
      if (!trimmedName) {
        throw new Error("Category name cannot be empty")
      }

      if (editingCategory) {
        // Update existing custom category
        const { error } = await (supabase as any)
          .from('expense_categories')
          .update({ name: trimmedName })
          .eq('id', editingCategory.id)
          .eq('is_predefined', false) // Safety check

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            throw new Error("A category with this name already exists")
          }
          throw error
        }

        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      } else {
        // Create new custom category
        const { error } = await (supabase as any)
          .from('expense_categories')
          .insert({
            name: trimmedName,
            user_id: user.id,
            is_predefined: false,
          })

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            throw new Error("A category with this name already exists")
          }
          throw error
        }

        toast({
          title: "Success",
          description: "Category created successfully",
        })
      }

      setDialogOpen(false)
      setCategoryName("")
      setEditingCategory(null)
      onCategoriesChange()
    } catch (error: any) {
      console.error('Category save error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (category: ExpenseCategory) => {
    if (category.is_predefined) {
      toast({
        title: "Cannot delete",
        description: "Predefined categories cannot be deleted",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', category.id)
        .eq('is_predefined', false) // Safety check

      if (error) {
        if (error.code === '23503') { // Foreign key constraint violation
          throw new Error("Cannot delete category that is being used by expenses")
        }
        throw error
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      onCategoriesChange()
    } catch (error: any) {
      console.error('Category delete error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  // Separate predefined and custom categories
  const predefinedCategories = categories.filter(cat => cat.is_predefined)
  const customCategories = categories.filter(cat => !cat.is_predefined)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Expense Categories</h3>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add Custom Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update the category name below"
                  : "Create a new custom expense category"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Business Travel"
                    required
                    disabled={submitting}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Predefined Categories */}
            {predefinedCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary">Predefined</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-50 cursor-not-allowed"
                      disabled
                      title="Cannot edit predefined categories"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-50 cursor-not-allowed"
                      disabled
                      title="Cannot delete predefined categories"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* Custom Categories */}
            {customCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">Custom</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* Empty state */}
            {customCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                  No custom categories yet. Add one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
