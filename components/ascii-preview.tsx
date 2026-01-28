"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import type { TreeNode } from "./tree-builder"

interface AsciiPreviewProps {
  tree: TreeNode[]
}

export function AsciiPreview({ tree }: AsciiPreviewProps) {
  const [copied, setCopied] = useState(false)

  const generateAsciiTree = (nodes: TreeNode[], prefix = ""): string => {
    let result = ""

    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1
      const connector = isLast ? "└─ " : "├─ "

      // Add the current node
      result += prefix + connector + node.name + (node.type === "folder" ? "/" : "")
      if (node.comment) {
        result += `  #${node.comment}`
      }
      result += "\n"

      // Add children with proper continuation lines
      if (node.children.length > 0) {
        const childPrefix = prefix + (isLast ? "   " : "│  ")
        result += generateAsciiTree(node.children, childPrefix)
      }
    })

    return result
  }

  const asciiOutput = generateAsciiTree(tree)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(asciiOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">ASCII Preview</h2>
        <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 bg-transparent">
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <pre className="font-mono text-sm text-foreground whitespace-pre overflow-x-auto">{asciiOutput}</pre>
      </div>
    </Card>
  )
}
