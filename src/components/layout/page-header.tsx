interface PageHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
