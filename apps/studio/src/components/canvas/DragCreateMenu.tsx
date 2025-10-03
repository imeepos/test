import React from 'react'
import { Sparkles, FilePlus2, BookmarkPlus, X } from 'lucide-react'

interface TemplateOption {
  name: string
  content: string
  importance: 1 | 2 | 3 | 4 | 5
  tags: string[]
}

interface DragCreateMenuProps {
  position: { x: number; y: number }
  templates: TemplateOption[]
  onCreateAi: () => void | Promise<void>
  onCreateBlank: () => void | Promise<void>
  onCreateTemplate: (templateName: string) => void
  onClose: () => void
}

export const DragCreateMenu = React.forwardRef<HTMLDivElement, DragCreateMenuProps>(
  ({ position, templates, onCreateAi, onCreateBlank, onCreateTemplate, onClose }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute z-50 w-64 rounded-lg border border-sidebar-border bg-sidebar-surface/95 backdrop-blur shadow-xl"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
        role="dialog"
        aria-label="选择连线操作"
      >
        <div className="flex items-center justify-between border-b border-sidebar-border/60 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-text-muted">连线操作</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-sidebar-text-muted transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-text"
            aria-label="关闭选项"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1 px-2 py-2">
          <button
            type="button"
            onClick={onCreateAi}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sidebar-text transition-colors hover:bg-sidebar-accent/10"
          >
            <Sparkles className="h-4 w-4 text-sidebar-accent" />
            <div className="flex flex-col">
              <span className="font-medium">AI 扩展节点</span>
              <span className="text-xs text-sidebar-text-muted">基于源节点生成新的内容</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onCreateBlank}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sidebar-text transition-colors hover:bg-sidebar-accent/10"
          >
            <FilePlus2 className="h-4 w-4 text-sidebar-accent" />
            <div className="flex flex-col">
              <span className="font-medium">创建空节点</span>
              <span className="text-xs text-sidebar-text-muted">快速插入占位节点，稍后补充内容</span>
            </div>
          </button>
        </div>

        {templates.length > 0 && (
          <div className="border-t border-sidebar-border/60">
            <p className="px-3 pt-2 text-[11px] uppercase tracking-wide text-sidebar-text-muted">使用模板</p>
            <div className="max-h-44 overflow-y-auto px-2 py-1">
              {templates.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => onCreateTemplate(template.name)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sidebar-text transition-colors hover:bg-sidebar-accent/10"
                >
                  <BookmarkPlus className="h-4 w-4 text-sidebar-accent" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium truncate">{template.name}</span>
                    {template.tags.length > 0 && (
                      <span className="text-xs text-sidebar-text-muted truncate">
                        {template.tags.slice(0, 3).join(' · ')}
                      </span>
                    )}
                  </div>
                  <span className="rounded-full border border-sidebar-border/80 px-1.5 py-0.5 text-[11px] text-sidebar-text-muted">
                    Lv{template.importance}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-sidebar-border/60 px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs font-medium text-sidebar-text-muted transition-colors hover:text-sidebar-text"
          >
            取消
          </button>
        </div>
      </div>
    )
  }
)

DragCreateMenu.displayName = 'DragCreateMenu'

