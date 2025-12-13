import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, FolderOpen, Tag, Palette } from 'lucide-react';
import ColorPicker from '@/components/ui/color-picker';
import IconSelector from '@/components/IconSelector';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  created_at: string;
  sub_categories_count?: number;
}

interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  created_at: string;
}

const CategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'FileText',
    subCategories: '',
    selectedSubCategories: [] as string[]
  });

  useEffect(() => {
    fetchCategoriesAndSubs();
  }, []);

  const fetchCategoriesAndSubs = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch sub-categories
      const { data: subCategoriesData, error: subCategoriesError } = await supabase
        .from('sub_categories')
        .select('*')
        .order('name');

      if (subCategoriesError) throw subCategoriesError;

      // Count sub-categories for each category
      const categoriesWithCounts = categoriesData?.map(category => ({
        ...category,
        sub_categories_count: subCategoriesData?.filter(sub => sub.category_id === category.id).length || 0
      })) || [];

      setCategories(categoriesWithCounts);
      setSubCategories(subCategoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'FileText',
      subCategories: '',
      selectedSubCategories: []
    });
    setEditingCategory(null);
    setShowCreateModal(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Debug: Check current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to edit categories",
          variant: "destructive"
        });
        return;
      }

      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (editingCategory) {
        console.log('Attempting to update category:', editingCategory.id, formData);
        
        // Update category
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description,
            color: formData.color || '#3b82f6',
            icon: formData.icon || 'FileText',
            slug
          })
          .eq('id', editingCategory.id)
          .select();

        console.log('Update result:', { data, error });

        if (error) {
          console.error('Category update error:', error);
          toast({
            title: "Update Failed",
            description: `Error: ${error.message}`,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
        
        // Reset form and close modal first
        resetForm();
        
        // Then refresh data
        await fetchCategoriesAndSubs();
      } else {
        // Create category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: formData.name,
            description: formData.description,
            color: formData.color || '#3b82f6',
            icon: formData.icon || 'FileText',
            slug
          })
          .select()
          .single();

        if (categoryError) throw categoryError;

        // Create sub-categories if provided
        if (formData.subCategories.trim()) {
          const subCategoryNames = formData.subCategories
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

          if (subCategoryNames.length > 0) {
            const subCategoryInserts = subCategoryNames.map(name => ({
              category_id: categoryData.id,
              name,
              slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));

            const { error: subError } = await supabase
              .from('sub_categories')
              .insert(subCategoryInserts);

            if (subError) throw subError;
          }
        }

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      // Force refresh data after any save operation
      resetForm();
      await fetchCategoriesAndSubs();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      icon: category.icon || 'FileText',
      subCategories: '',
      selectedSubCategories: []
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        // Check if the error is due to tools being assigned
        if (error.message.includes('tools are still assigned')) {
          toast({
            title: "Cannot Delete Category",
            description: "This category cannot be deleted because tools are still assigned to it. Please reassign the tools first.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      await fetchCategoriesAndSubs(); // Force refresh after deletion
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">Manage categories and sub-categories for tools</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-primary text-white hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update the category details' : 'Add a new category with optional sub-categories'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Image Generation"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the category"
                />
              </div>
              <div>
                <Label htmlFor="color">Category Color</Label>
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />
              </div>
              <div>
                <Label htmlFor="icon">Category Icon</Label>
                <IconSelector
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                />
              </div>
                <div>
                  <Label htmlFor="subCategories">Sub-categories</Label>
                  <div className="space-y-2">
                    <details className="border border-border rounded-lg">
                      <summary className="cursor-pointer p-3 bg-muted/50 hover:bg-muted rounded-t-lg">
                        Select Sub-categories ({formData.selectedSubCategories.length} selected)
                      </summary>
                      <div className="p-3 max-h-32 overflow-y-auto">
                        <div className="mb-2">
                          <Input
                            placeholder="Search sub-categories..."
                            className="text-sm"
                            onChange={(e) => {
                              const search = e.target.value.toLowerCase();
                              // Filter functionality can be added here
                            }}
                          />
                        </div>
                        {subCategories.map((subCat) => (
                          <div key={subCat.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`sub-${subCat.id}`}
                              checked={formData.selectedSubCategories.includes(subCat.id)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...formData.selectedSubCategories, subCat.id]
                                  : formData.selectedSubCategories.filter(id => id !== subCat.id);
                                setFormData({ ...formData, selectedSubCategories: newSelected });
                              }}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`sub-${subCat.id}`} className="text-sm cursor-pointer">
                              {subCat.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </details>
                  {!editingCategory && (
                    <div>
                      <Label htmlFor="newSubCategories">Add New Sub-categories (one per line)</Label>
                      <Textarea
                        id="newSubCategories"
                        value={formData.subCategories}
                        onChange={(e) => setFormData({ ...formData, subCategories: e.target.value })}
                        placeholder="Art & Design&#10;Photo Editing&#10;Logos & Graphics"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} className="bg-gradient-primary text-white hover:shadow-lg">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white dark:bg-gray-800 border border-primary/20 shadow-lg">
        <CardHeader className="bg-white dark:bg-gray-800 border-b border-primary/10">
          <CardTitle className="text-foreground">Categories Overview</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your tool categories and sub-categories</CardDescription>
        </CardHeader>
        <CardContent className="bg-white dark:bg-gray-800 p-6">
          <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="border-b border-primary/30">
                   <th className="text-left p-4 font-medium">Name</th>
                   <th className="text-left p-4 font-medium">Slug</th>
                   <th className="text-left p-4 font-medium">Color</th>
                   <th className="text-left p-4 font-medium">Sub-categories</th>
                   <th className="text-right p-4 font-medium">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {categories.map((category) => (
                   <tr key={category.id} className="border-b border-primary/20 hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{category.slug}</code>
                    </td>
                     <td className="p-4">
                       <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: category.color || '#3b82f6' }}
                          />
                       </div>
                     </td>
                     <td className="p-4">
                       <div 
                         className="px-3 py-1 text-white rounded-full flex items-center justify-center w-fit"
                         style={{ backgroundColor: category.color || '#3b82f6' }}
                       >
                         <Tag className="h-3 w-3 mr-1" />
                         {category.sub_categories_count || 0}
                       </div>
                     </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.name}"? This will also delete all sub-categories and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(category.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagement;