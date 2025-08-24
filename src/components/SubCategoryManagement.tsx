import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ColorPicker from '@/components/ui/color-picker';
import { Plus, Edit, Trash2, Tag, Folder } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  description?: string;
}

interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  category?: Category;
}

const SubCategoryManagement: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    color: '#3b82f6'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch sub-categories with category info
      const { data: subCategoriesData, error: subCategoriesError } = await supabase
        .from('sub_categories')
        .select(`
          *,
          category:categories(id, name, color, slug)
        `)
        .order('name');
      
      if (subCategoriesError) throw subCategoriesError;
      setSubCategories(subCategoriesData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category_id: '',
      color: '#3b82f6'
    });
    setEditingSubCategory(null);
    setIsModalOpen(false);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category_id) {
      toast({
        title: "Validation Error",
        description: "Name and category are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const saveData = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        color: formData.color
      };

      if (editingSubCategory) {
        const { error } = await supabase
          .from('sub_categories')
          .update(saveData)
          .eq('id', editingSubCategory.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Sub-category updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('sub_categories')
          .insert(saveData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Sub-category created successfully"
        });
      }

      await fetchData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving sub-category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save sub-category",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      slug: subCategory.slug,
      description: subCategory.description || '',
      category_id: subCategory.category_id,
      color: subCategory.color
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sub_categories')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.message.includes('tools are still assigned')) {
          toast({
            title: "Cannot Delete",
            description: "This sub-category cannot be deleted because tools are still assigned to it. Please reassign the tools first.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Sub-category deleted successfully"
      });
      
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting sub-category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sub-category",
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
          <h2 className="text-2xl font-bold text-foreground">Sub-Category Management</h2>
          <p className="text-muted-foreground">Manage sub-categories for tool classification</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-gradient-primary text-white hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sub-Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingSubCategory ? 'Edit Sub-Category' : 'Create New Sub-Category'}
              </DialogTitle>
              <DialogDescription>
                {editingSubCategory 
                  ? 'Update the sub-category details below.'
                  : 'Fill in the details to create a new sub-category.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category *
                </Label>
                 <Select value={formData.category_id} onValueChange={(value) => {
                   const selectedCategory = categories.find(cat => cat.id === value);
                   setFormData(prev => ({ 
                     ...prev, 
                     category_id: value,
                     color: selectedCategory ? selectedCategory.color : prev.color
                   }));
                 }}>
                   <SelectTrigger className="col-span-3">
                     <SelectValue placeholder="Select a category" />
                   </SelectTrigger>
                   <SelectContent>
                     {categories.map((category) => (
                       <SelectItem key={category.id} value={category.id}>
                         <div className="flex items-center gap-2">
                           <div 
                             className="w-3 h-3 rounded-full" 
                             style={{ backgroundColor: category.color }}
                           />
                           {category.name}
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter sub-category name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  Slug
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="col-span-3"
                  placeholder="auto-generated-from-name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="Enter sub-category description (optional)"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  Color
                </Label>
                <div className="col-span-3">
                  <ColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-primary text-white">
                {editingSubCategory ? 'Update' : 'Create'} Sub-Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Sub-Categories ({subCategories.length})
          </CardTitle>
          <CardDescription>
            Manage and organize sub-categories for better tool classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sub-categories found. Create your first sub-category to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subCategories.map((subCategory) => (
                  <TableRow key={subCategory.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subCategory.color }}
                        />
                        {subCategory.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subCategory.category && (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: subCategory.category.color }}
                          />
                          {subCategory.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {subCategory.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-border" 
                          style={{ backgroundColor: subCategory.color }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {subCategory.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={subCategory.description}>
                        {subCategory.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subCategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the sub-category "{subCategory.name}". 
                                This action cannot be undone and will fail if tools are assigned to this sub-category.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(subCategory.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubCategoryManagement;