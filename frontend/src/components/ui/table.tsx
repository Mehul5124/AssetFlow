import React from 'react'

interface TableProps {
  headers: string[]
  children: React.ReactNode
  isEmpty?: boolean
  emptyMessage?: string
  emptySub?: string
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  isEmpty = false,
  emptyMessage = 'No records found',
  emptySub = 'Add new entries to populate this list',
}) => {
  return (
    <div className="w-full overflow-hidden border border-border/80 bg-white dark:bg-zinc-900/20 dark:glassmorphism rounded-xl shadow-sm">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-zinc-100/50 dark:bg-zinc-950/40 text-zinc-600 dark:text-muted-foreground font-medium text-xs uppercase tracking-wider h-11">
              {headers.map((h, idx) => (
                <th key={idx} className="px-6 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70 dark:divide-border/40">
            {isEmpty ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-sm font-medium text-foreground">{emptyMessage}</span>
                    <span className="text-xs text-muted-foreground">{emptySub}</span>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
