"use client"

import { useState } from "react"
import { TreeBuilder } from "@/components/tree-builder"
import { AsciiPreview } from "@/components/ascii-preview"
import type { TreeNode } from "@/components/tree-builder"

export default function Page() {
  const [tree, setTree] = useState<TreeNode[]>([
    {
      id: "1",
      name: "src",
      type: "folder" as const,
      comment: "",
      children: [
        {
          id: "2",
          name: "index.ts",
          type: "file" as const,
          comment: "🚀 entry point",
          children: [],
        },
      ],
    },
    {
      id: "3",
      name: "README.md",
      type: "file" as const,
      comment: "",
      children: [],
    },
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-foreground">ASCII Tree Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build your folder structure visually and generate ASCII tree output
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TreeBuilder tree={tree} onTreeChange={setTree} />
          <AsciiPreview tree={tree} />
        </div>
      </main>
    </div>
  )
}
