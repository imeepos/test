import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

type MarkdownContentProps = {
  content: string | undefined
  className?: string
}

const markdownComponents: Components = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-sidebar-accent hover:text-sidebar-accent/80 underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
    />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  )
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className }) => {
  const trimmedContent = content?.trim()

  if (!trimmedContent) {
    return (
      <p className="text-sm text-sidebar-text-muted">
        暂无内容
      </p>
    )
  }

  return (
    <div className={['markdown-content', className].filter(Boolean).join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {trimmedContent}
      </ReactMarkdown>
    </div>
  )
}
