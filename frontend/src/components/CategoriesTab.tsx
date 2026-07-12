import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../components/ui/toast'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from './ui/dialog'

interface AssetCategory {
  id: string
  name: string
  description?: string
  extraFields: Record<string, string>
}

interface AttributeRow {
  key: string
  value: string
}

export const CategoriesTab: React.FC = () => {
  const { toast } = useToast()
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<AttributeRow[]>([])
  const [validationError, setValidationError] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await api.get('/categories')
      setCategories(response.data?.data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      toast('Failed to load asset categories.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenCreate = () => {
    setName('')
    setDescription('')
    setAttributes([])
    setValidationError('')
    setIsModalOpen(true)
  }

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }])
  }

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...attributes]
    updated[index][field] = value
    setAttributes(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setValidationError('Category name is required')
      return
    }

    // Verify key validity
    for (const attr of attributes) {
      if (!attr.key.trim() && attr.value.trim()) {
        setValidationError('Attribute key cannot be blank if a value is provided')
        return
      }
    }

    setActionLoading(true)
    setValidationError('')

    // Reduce attributes array to object
    const extraFields: Record<string, string> = {}
    attributes.forEach((attr) => {
      const k = attr.key.trim()
      if (k) {
        extraFields[k] = attr.value.trim()
      }
    })

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      extraFields,
    }

    try {
      await api.post('/categories', payload)
      toast('Category created successfully!', 'success')
      setIsModalOpen(false)
      fetchCategories()
    } catch (err: any) {
      console.error('Create category error:', err)
      const msg = err.response?.data?.message || 'Failed to create category. Ensure the name is unique.'
      setValidationError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Asset Categories</h3>
          <p className="text-xs text-muted-foreground">Manage classification rules and custom attributes</p>
        </div>
        <Button onClick={handleOpenCreate} className="h-9 text-xs px-3">
          <Plus size={14} className="mr-1.5" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900/20 border-dashed border-border flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4">
            <Tag size={20} />
          </div>
          <span className="text-sm font-medium text-zinc-900 dark:text-white">No Categories Found</span>
          <span className="text-xs text-muted-foreground mt-1">Start by creating your first asset classification model.</span>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 text-left">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-6 bg-white dark:bg-zinc-900/20 border-border/80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Tag size={16} />
                  </div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white text-base">{cat.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>

                {Object.keys(cat.extraFields).length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Custom Attributes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(cat.extraFields).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[11px] px-2 py-0.5 rounded border border-border bg-secondary/20 text-zinc-700 dark:text-zinc-300 font-mono"
                        >
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>Add a new asset category classification model</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-5">
            {validationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {validationError}
              </div>
            )}

            <Input
              label="Category Name"
              type="text"
              placeholder="e.g. Electronics, Vehicles, Furniture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={actionLoading}
            />

            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </label>
              <textarea
                placeholder="Brief category description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={actionLoading}
                rows={3}
                className="w-full p-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Dynamic Attributes Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Custom Fields / Attributes
                </span>
                <Button
                  type="button"
                  onClick={handleAddAttribute}
                  variant="outline"
                  className="h-7 text-[11px] px-2.5"
                  disabled={actionLoading}
                >
                  Add Field
                </Button>
              </div>

              {attributes.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded-lg text-center text-xs text-muted-foreground">
                  No custom attributes defined yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Key (e.g. warranty)"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                        disabled={actionLoading}
                        className="h-9 px-3"
                      />
                      <Input
                        type="text"
                        placeholder="Default value"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                        disabled={actionLoading}
                        className="h-9 px-3"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(idx)}
                        disabled={actionLoading}
                        className="text-muted-foreground hover:text-rose-400 p-2 hover:bg-secondary/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
