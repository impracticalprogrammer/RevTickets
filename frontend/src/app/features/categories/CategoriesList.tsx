'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody, Modal, ModalHeader, ModalBody, Label, TextInput, Textarea } from 'flowbite-react';
import { Plus, Edit, Trash2, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { categoriesApi, subCategoriesApi } from '../../../lib/api';
import { LoadingSpinner } from '../../shared/components';
import type { Category, SubCategory } from '../../shared/types';

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  const [categorySubCategories, setCategorySubCategories] = useState<{id?: string, name: string, description: string}[]>([]);
  const [newSubCategory, setNewSubCategory] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoriesData = await categoriesApi.getAll();
      setCategories(categoriesData);
      
      // Fetch subcategory counts for all categories
      const subcategoryPromises = categoriesData.map(async (category) => {
        try {
          const subCategoriesData = await subCategoriesApi.getByCategoryId(category.id);
          return subCategoriesData;
        } catch (error) {
          console.error(`Failed to fetch subcategories for ${category.name}:`, error);
          return [];
        }
      });
      
      const allSubCategories = (await Promise.all(subcategoryPromises)).flat();
      setSubCategories(allSubCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    
    if (expandedCategories.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Fetch subcategories for this category if not already loaded
      try {
        const subCategoriesData = await subCategoriesApi.getByCategoryId(categoryId);
        setSubCategories(prev => {
          // Remove old subcategories for this category and add new ones
          const filtered = prev.filter(sub => sub.category?.id !== categoryId);
          const newSubCategories = [...filtered, ...subCategoriesData];
          return newSubCategories;
        });
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
      }
    }
    
    setExpandedCategories(newExpanded);
  };

  const getSubCategoryCount = (categoryId: string) => {
    return subCategories.filter(sub => sub.category?.id === categoryId).length;
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setCategorySubCategories([]);
    setNewSubCategory({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = async (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    
    // Load existing subcategories for this category
    try {
      const existingSubCategories = await subCategoriesApi.getByCategoryId(category.id);
      setCategorySubCategories(existingSubCategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        description: sub.description
      })));
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setCategorySubCategories([]);
    }
    
    setNewSubCategory({ name: '', description: '' });
    setShowModal(true);
  };

  const addSubCategory = () => {
    if (!newSubCategory.name.trim() || !newSubCategory.description.trim()) return;
    
    setCategorySubCategories(prev => [...prev, {
      name: newSubCategory.name.trim(),
      description: newSubCategory.description.trim()
    }]);
    setNewSubCategory({ name: '', description: '' });
  };

  const removeSubCategory = (index: number) => {
    setCategorySubCategories(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubCategory = (index: number, field: 'name' | 'description', value: string) => {
    setCategorySubCategories(prev => prev.map((sub, i) => 
      i === index ? { ...sub, [field]: value } : sub
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    try {
      setSubmitting(true);
      
      let categoryId: string;
      
      if (editingCategory) {
        // Update existing category
        await categoriesApi.update(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        categoryId = editingCategory.id;
        
        // Force a small delay to ensure backend processes the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trigger a custom event to notify other components (like TicketsList) to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categoryUpdated', { 
            detail: { categoryId: editingCategory.id } 
          }));
        }
      } else {
        // Create new category
        const newCategory = await categoriesApi.create({
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        categoryId = newCategory.id;
      }
      
      // Handle subcategories
      if (editingCategory) {
        // For existing category, get current subcategories and compare
        const currentSubCategories = await subCategoriesApi.getByCategoryId(categoryId);
        
        // Delete removed subcategories
        for (const currentSub of currentSubCategories) {
          const stillExists = categorySubCategories.find(sub => sub.id === currentSub.id);
          if (!stillExists) {
            await subCategoriesApi.delete(currentSub.id);
          }
        }
        
        // Update existing subcategories and create new ones
        for (const sub of categorySubCategories) {
          if (sub.id) {
            // Update existing subcategory
            await subCategoriesApi.update(sub.id, {
              name: sub.name,
              description: sub.description,
              category_id: categoryId
            });
          } else {
            // Create new subcategory
            await subCategoriesApi.create({
              name: sub.name,
              description: sub.description,
              category_id: categoryId
            });
          }
        }
      } else {
        // For new category, just create all subcategories
        for (const sub of categorySubCategories) {
          await subCategoriesApi.create({
            name: sub.name,
            description: sub.description,
            category_id: categoryId
          });
        }
      }
      
      await fetchData();
      setShowModal(false);
      setFormData({ name: '', description: '' });
      setCategorySubCategories([]);
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const subcategoryCount = getSubCategoryCount(category.id);
    
    if (subcategoryCount > 0) {
      alert(`Cannot delete category "${category.name}" because it has ${subcategoryCount} subcategory(ies). Please delete the subcategories first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesApi.delete(category.id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading categories..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage main ticket categories
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first ticket category
            </p>
            <Button
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Subcategories</TableHeadCell>
                  <TableHeadCell>Tags</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const categorySubCategories = subCategories.filter(sub => sub.category?.id === category.id);
                  
                  return (
                    <React.Fragment key={category.id}>
                      <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => toggleCategory(category.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                            <FolderOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span>{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {category.description}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900/20 dark:text-orange-400">
                            {getSubCategoryCount(category.id)} subcategories
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-400 dark:text-gray-600">Tags managed separately</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="xs"
                              onClick={() => handleEdit(category)}
                              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="xs"
                              onClick={() => handleDelete(category)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white dark:bg-red-600 dark:hover:bg-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Subcategories rows */}
                      {isExpanded && categorySubCategories.map((subCategory) => (
                        <TableRow 
                          key={`sub-${subCategory.id}`}
                          className="bg-gray-50 dark:bg-gray-700/50 border-l-4 border-orange-200 dark:border-orange-800"
                        >
                          <TableCell className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                            <div className="flex items-center space-x-2 ml-8">
                              <div className="h-4 w-4 flex items-center justify-center">
                                <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                              </div>
                              <span className="text-sm">{subCategory.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 dark:text-gray-400 text-sm">
                            {subCategory.description}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-400">Subcategory</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-400">-</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="xs"
                                onClick={() => {/* Handle subcategory edit */}}
                                className="bg-gray-500 hover:bg-gray-600 focus:ring-gray-400 text-white"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="xs"
                                onClick={() => {/* Handle subcategory delete */}}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="2xl">
        <ModalHeader>
          {editingCategory ? 'Edit Category' : 'Create New Category'}
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2 block">Category Name *</Label>
              <TextInput
                id="name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what this category is for"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            {/* Subcategories Management */}
            <div className="border-t pt-4">
              <Label className="mb-3 block text-base font-medium">Subcategories</Label>
              
              {/* Existing subcategories */}
              {categorySubCategories.length > 0 && (
                <div className="space-y-2 mb-4">
                  {categorySubCategories.map((sub, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <TextInput
                          placeholder="Subcategory name"
                          value={sub.name}
                          onChange={(e) => updateSubCategory(index, 'name', e.target.value)}
                          className="text-sm"
                        />
                        <TextInput
                          placeholder="Subcategory description"
                          value={sub.description}
                          onChange={(e) => updateSubCategory(index, 'description', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => removeSubCategory(index)}
                        className="bg-red-500 hover:bg-red-600 text-white flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new subcategory */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Label className="mb-2 block text-sm font-medium">Add New Subcategory</Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <TextInput
                      placeholder="Subcategory name"
                      value={newSubCategory.name}
                      onChange={(e) => setNewSubCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="text-sm"
                    />
                    <TextInput
                      placeholder="Subcategory description"
                      value={newSubCategory.description}
                      onChange={(e) => setNewSubCategory(prev => ({ ...prev, description: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={addSubCategory}
                    disabled={!newSubCategory.name.trim() || !newSubCategory.description.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="bg-gray-500 hover:bg-gray-600 focus:ring-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                disabled={submitting || !formData.name.trim() || !formData.description.trim()}
              >
                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}