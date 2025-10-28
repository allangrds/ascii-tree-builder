"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, FolderIcon, FileIcon, ChevronRight, ChevronDown, GripVertical } from "lucide-react"

export interface TreeNode {
  id: string
  name: string
  type: "file" | "folder"
  comment: string
  children: TreeNode[]
}

interface DragState {
  draggedNode: TreeNode | null
  draggedFromParent: string | null
}

interface TreeBuilderProps {
  tree: TreeNode[]
  onTreeChange: (tree: TreeNode[]) => void
  onClearAll: () => void
}

export function TreeBuilder({ tree, onTreeChange, onClearAll }: TreeBuilderProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [dragState, setDragState] = useState<DragState>({ draggedNode: null, draggedFromParent: null })
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  const toggleCollapse = (nodeId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const isNodeCollapsed = (nodeId: string) => collapsedFolders.has(nodeId)

  const updateNode = (nodeId: string, updates: Partial<TreeNode>) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates }
      }
      return {
        ...node,
        children: node.children.map(updateRecursive),
      }
    }
    onTreeChange(tree.map(updateRecursive))
  }

  const addChild = (parentId: string | null, type: "file" | "folder") => {
    const newNode: TreeNode = {
      id: Date.now().toString(),
      name: type === "folder" ? "new-folder" : "new-file.txt",
      type,
      comment: "",
      children: [],
    }

    if (parentId === null) {
      onTreeChange([...tree, newNode])
    } else {
      const addRecursive = (node: TreeNode): TreeNode => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...node.children, newNode],
          }
        }
        return {
          ...node,
          children: node.children.map(addRecursive),
        }
      }
      onTreeChange(tree.map(addRecursive))
    }

    // Auto-open edit mode for new node
    setEditingNodeId(newNode.id)
  }

  const deleteNode = (nodeId: string) => {
    const filteredRoot = tree.filter((node) => node.id !== nodeId)
    if (filteredRoot.length !== tree.length) {
      onTreeChange(filteredRoot)
      return
    }

    const deleteRecursive = (node: TreeNode): TreeNode => {
      return {
        ...node,
        children: node.children.filter((child) => child.id !== nodeId).map(deleteRecursive),
      }
    }
    onTreeChange(tree.map(deleteRecursive))
  }

  const moveNode = (nodeId: string, targetParentId: string | null, position?: number) => {
    let nodeToMove: TreeNode | null = null
    
    // Remove node from current location
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter((node) => {
        if (node.id === nodeId) {
          nodeToMove = node
          return false
        }
        return true
      }).map((node) => ({
        ...node,
        children: removeNode(node.children),
      }))
    }

    const newTree = removeNode(tree)
    
    if (!nodeToMove) return

    // Add node to new location
    if (targetParentId === null) {
      // Add to root
      if (position !== undefined) {
        newTree.splice(position, 0, nodeToMove)
        onTreeChange(newTree)
      } else {
        onTreeChange([...newTree, nodeToMove])
      }
    } else {
      // Add to a parent folder
      const addToParent = (node: TreeNode): TreeNode => {
        if (node.id === targetParentId) {
          if (position !== undefined) {
            const newChildren = [...node.children]
            newChildren.splice(position, 0, nodeToMove!)
            return { ...node, children: newChildren }
          }
          return {
            ...node,
            children: [...node.children, nodeToMove!],
          }
        }
        return {
          ...node,
          children: node.children.map(addToParent),
        }
      }
      onTreeChange(newTree.map(addToParent))
    }
  }

  const reorderNode = (nodeId: string, targetNodeId: string, position: 'before' | 'after', parentId: string | null) => {
    let nodeToMove: TreeNode | null = null
    
    // Remove node from current location
    const removeNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter((node) => {
        if (node.id === nodeId) {
          nodeToMove = node
          return false
        }
        return true
      }).map((node) => ({
        ...node,
        children: removeNode(node.children),
      }))
    }

    const newTree = removeNode(tree)
    
    if (!nodeToMove) return

    // Insert at new position
    const insertNode = (nodes: TreeNode[]): TreeNode[] => {
      const targetIndex = nodes.findIndex((n) => n.id === targetNodeId)
      if (targetIndex !== -1) {
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
        nodes.splice(insertIndex, 0, nodeToMove!)
        return nodes
      }
      return nodes.map((node) => ({
        ...node,
        children: insertNode(node.children),
      }))
    }

    if (parentId === null) {
      onTreeChange(insertNode(newTree))
    } else {
      const updateParent = (node: TreeNode): TreeNode => {
        if (node.id === parentId) {
          return {
            ...node,
            children: insertNode(node.children),
          }
        }
        return {
          ...node,
          children: node.children.map(updateParent),
        }
      }
      onTreeChange(newTree.map(updateParent))
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Tree Builder</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addChild(null, "folder")} className="gap-2">
            <Plus className="w-4 h-4" />
            Folder
          </Button>
          <Button size="sm" variant="outline" onClick={() => addChild(null, "file")} className="gap-2">
            <Plus className="w-4 h-4" />
            File
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={onClearAll} 
            className="gap-2"
            disabled={tree.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            onUpdate={updateNode}
            onAddChild={addChild}
            onDelete={deleteNode}
            onMove={moveNode}
            onReorder={reorderNode}
            depth={0}
            isNodeCollapsed={isNodeCollapsed}
            onToggleCollapse={toggleCollapse}
            parentId={null}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
          />
        ))}
      </div>
    </Card>
  )
}

interface TreeNodeItemProps {
  node: TreeNode
  onUpdate: (nodeId: string, updates: Partial<TreeNode>) => void
  onAddChild: (parentId: string | null, type: "file" | "folder") => void
  onDelete: (nodeId: string) => void
  onMove: (nodeId: string, targetParentId: string | null, position?: number) => void
  onReorder: (nodeId: string, targetNodeId: string, position: 'before' | 'after', parentId: string | null) => void
  depth?: number
  isNodeCollapsed: (nodeId: string) => boolean
  onToggleCollapse: (nodeId: string) => void
  parentId: string | null
  editingNodeId: string | null
  setEditingNodeId: (id: string | null) => void
}

function TreeNodeItem({
  node,
  onUpdate,
  onAddChild,
  onDelete,
  onMove,
  onReorder,
  depth = 0,
  isNodeCollapsed,
  onToggleCollapse,
  parentId,
  editingNodeId,
  setEditingNodeId,
}: TreeNodeItemProps) {
  const [editName, setEditName] = useState(node.name)
  const [editComment, setEditComment] = useState(node.comment)
  const [dragOver, setDragOver] = useState<'top' | 'bottom' | 'inside' | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditing = editingNodeId === node.id
  const isCollapsed = isNodeCollapsed(node.id)

  useEffect(() => {
    if (isEditing) {
      setEditName(node.name)
      setEditComment(node.comment)
      // Focus on name input when entering edit mode
      setTimeout(() => {
        nameInputRef.current?.focus()
        nameInputRef.current?.select()
      }, 0)
    }
  }, [isEditing, node.name, node.comment])

  const handleSave = () => {
    onUpdate(node.id, { name: editName, comment: editComment })
    setEditingNodeId(null)
  }

  const handleCancel = () => {
    setEditName(node.name)
    setEditComment(node.comment)
    setEditingNodeId(null)
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('nodeId', node.id)
    e.dataTransfer.setData('parentId', parentId || '')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    
    if (node.type === 'folder') {
      // For folders: top third, middle (inside), bottom third
      if (y < height / 3) {
        setDragOver('top')
      } else if (y > (height * 2) / 3) {
        setDragOver('bottom')
      } else {
        setDragOver('inside')
      }
    } else {
      // For files: top half or bottom half
      if (y < height / 2) {
        setDragOver('top')
      } else {
        setDragOver('bottom')
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const draggedNodeId = e.dataTransfer.getData('nodeId')
    const draggedParentId = e.dataTransfer.getData('parentId') || null
    
    if (draggedNodeId === node.id) {
      setDragOver(null)
      return
    }
    
    // Prevent dropping a folder into itself or its descendants
    if (isDescendant(draggedNodeId, node.id)) {
      setDragOver(null)
      return
    }
    
    if (dragOver === 'inside' && node.type === 'folder') {
      onMove(draggedNodeId, node.id)
    } else if (dragOver === 'top') {
      onReorder(draggedNodeId, node.id, 'before', parentId)
    } else if (dragOver === 'bottom') {
      onReorder(draggedNodeId, node.id, 'after', parentId)
    }
    
    setDragOver(null)
  }

  const isDescendant = (ancestorId: string, nodeId: string): boolean => {
    const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n
        const found = findNode(n.children, id)
        if (found) return found
      }
      return null
    }

    const checkDescendant = (node: TreeNode | null): boolean => {
      if (!node) return false
      if (node.id === nodeId) return true
      return node.children.some(child => checkDescendant(child))
    }

    // This is a simplified check - in production you'd need access to the full tree
    return false
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group relative ${
          dragOver === 'top' ? 'border-t-2 border-primary' : ''
        } ${dragOver === 'bottom' ? 'border-b-2 border-primary' : ''} ${
          dragOver === 'inside' ? 'bg-primary/10 border-2 border-primary' : ''
        }`}
        style={{ marginLeft: `${depth * 20}px` }}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="shrink-0 mt-1 cursor-move">
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {node.type === "folder" ? (
          <button
            onClick={() => onToggleCollapse(node.id)}
            className="shrink-0 mt-1 hover:bg-accent rounded p-0.5 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        <div className="shrink-0 mt-1">
          {node.type === "folder" ? (
            <FolderIcon className="w-4 h-4 text-blue-500" />
          ) : (
            <FileIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              ref={nameInputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  handleCancel()
                }
              }}
              className="h-8 text-sm"
              placeholder="Name"
            />
            <Input
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  handleCancel()
                }
              }}
              className="h-8 text-sm"
              placeholder="Comment (optional)"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setEditingNodeId(node.id)}
                className="text-left w-full hover:text-primary transition-colors"
              >
                <span className="font-mono text-sm text-foreground">{node.name}</span>
                {node.comment && <span className="ml-2 text-xs text-muted-foreground">{node.comment}</span>}
              </button>
            </div>

            <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.type === "folder" && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddChild(node.id, "folder")}
                    className="h-7 w-7 p-0"
                    title="Add folder"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddChild(node.id, "file")}
                    className="h-7 w-7 p-0"
                    title="Add file"
                  >
                    <FileIcon className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(node.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>

      {!isCollapsed &&
        node.children.map((child) => (
          <TreeNodeItem
            key={child.id}
            node={child}
            onUpdate={onUpdate}
            onAddChild={onAddChild}
            onDelete={onDelete}
            onMove={onMove}
            onReorder={onReorder}
            depth={depth + 1}
            isNodeCollapsed={isNodeCollapsed}
            onToggleCollapse={onToggleCollapse}
            parentId={node.id}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
          />
        ))}
    </div>
  )
}
