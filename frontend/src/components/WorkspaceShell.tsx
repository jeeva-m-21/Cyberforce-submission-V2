import React, { useRef } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface WorkspaceShellProps {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ left, center, right }) => {
  const [leftCollapsed, setLeftCollapsed] = React.useState(false)
  const [rightCollapsed, setRightCollapsed] = React.useState(false)
  // default to showing center/editor immediately
  const [stage, setStage] = React.useState<1 | 2 | 3>(2)

  // adjustable widths (px)
  const [leftWidth, setLeftWidth] = React.useState<number>(260)
  const [rightWidth, setRightWidth] = React.useState<number>(320)

  const containerRef = useRef<HTMLDivElement | null>(null)

  // start a drag for the given side; attaches listeners immediately
  const startDrag = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      if (side === 'left') {
        const x = ev.clientX - rect.left
        const min = 140
        const max = Math.max(320, rect.width - rightWidth - 160)
        const newW = Math.max(min, Math.min(max, x))
        setLeftWidth(newW)
      } else {
        const x = ev.clientX
        const newW = Math.max(200, Math.min(800, rect.right - x))
        setRightWidth(newW)
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
  }

  const showCenter = true
  const showRight = stage >= 3

  return (
    <div className="flex flex-col min-h-[60vh] w-full" ref={containerRef}>
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <aside
          style={{ width: leftCollapsed ? undefined : leftWidth }}
          className={`bg-surface p-4 rounded border border-var overflow-auto flex-shrink-0 panel transition-all duration-150 ${leftCollapsed ? 'w-12 md:w-16' : ''}`}
        >
          <div className="flex items-start justify-between">
            {!leftCollapsed && <div className="flex-1 mr-2">{left}</div>}
            <button
              className="ml-2 p-1 rounded bg-transparent hover:bg-white/6"
              onClick={() => setLeftCollapsed((v) => !v)}
              title={leftCollapsed ? 'Expand left panel' : 'Collapse left panel'}
            >
              {leftCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          </div>
        </aside>

        {/* left-center resizer */}
        <div
          onMouseDown={(e) => startDrag('left', e)}
          className="hidden md:block w-2 cursor-col-resize hover:bg-white/10"
          style={{ marginLeft: -4, marginRight: -4 }}
        />

        <main className="flex-1 min-w-0 bg-surface p-4 rounded border border-var min-h-[48vh] overflow-auto panel">
          <div className="h-full">{center}
            {!showRight && (
              <div className="mt-4 flex justify-end">
                <button onClick={() => setStage(3)} className="px-3 py-1 bg-gray-800 text-white rounded-md text-sm">
                  Open Right Panel
                </button>
              </div>
            )}
          </div>
        </main>

        {/* center-right resizer */}
        <div
          onMouseDown={(e) => startDrag('right', e)}
          className={`hidden md:block w-2 cursor-col-resize hover:bg-white/10 ${showRight ? '' : 'opacity-0 pointer-events-none'}`}
          style={{ marginLeft: -4, marginRight: -4 }}
        />

        <aside
          style={{ width: rightCollapsed ? undefined : showRight ? rightWidth : undefined }}
          className={`bg-surface p-4 rounded border border-var overflow-auto flex-shrink-0 panel transition-all duration-150 ${rightCollapsed ? 'w-12 md:w-16' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-2">{!rightCollapsed && showRight ? right : null}</div>
            <button
              className="ml-2 p-1 rounded bg-transparent hover:bg-white/6"
              onClick={() => setRightCollapsed((v) => !v)}
              title={rightCollapsed ? 'Expand right panel' : 'Collapse right panel'}
            >
              {rightCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
            </button>
          </div>
        </aside>
      </div>

      <footer className="mt-4 flex items-center justify-between">
        <div className="bg-transparent text-xs text-muted">Agent timeline available in bottom drawer.</div>
        <div className="flex gap-2">
          {stage > 1 && (
            <button onClick={() => setStage((s) => (s === 3 ? 2 : 1))} className="text-sm px-2 py-1 rounded bg-gray-800 text-white">
              Back
            </button>
          )}
          {stage < 3 && (
            <button onClick={() => setStage((s) => (s === 1 ? 2 : 3))} className="text-sm px-2 py-1 rounded bg-blue-600 text-white">
              Next
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default WorkspaceShell
