"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, FolderIcon, FileIcon } from "lucide-react"

export interface TreeNode {
  id: string
  name: string
  type: "file" | "folder"
  comment: string
  children: TreeNode[]
}

interface TreeBuilderProps {
  tree: TreeNode[]
  onTreeChange: (tree: TreeNode[]) => void
}

export function TreeBuilder({ tree, onTreeChange }: TreeBuilderProps) {
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
      return
    }

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
            depth={0}
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
  depth?: number
}

function TreeNodeItem({ node, onUpdate, onAddChild, onDelete, depth = 0 }: TreeNodeItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [editComment, setEditComment] = useState(node.comment)

  const handleSave = () => {
    onUpdate(node.id, { name: editName, comment: editComment })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(node.name)
    setEditComment(node.comment)
    setIsEditing(false)
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="flex-shrink-0 mt-1">
          {node.type === "folder" ? (
            <FolderIcon className="w-4 h-4 text-blue-500" />
          ) : (
            <FileIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 text-sm"
              placeholder="Name"
            />
            <Input
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
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
                onClick={() => setIsEditing(true)}
                className="text-left w-full hover:text-primary transition-colors"
              >
                <span className="font-mono text-sm text-foreground">{node.name}</span>
                {node.comment && <span className="ml-2 text-xs text-muted-foreground">{node.comment}</span>}
              </button>
            </div>

            <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {node.children.map((child) => (
        <TreeNodeItem
          key={child.id}
          node={child}
          onUpdate={onUpdate}
          onAddChild={onAddChild}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
