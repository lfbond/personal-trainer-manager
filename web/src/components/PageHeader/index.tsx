
interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-[2rem] leading-[1.2] font-bold text-text-primary">
        {title}
      </h1>

      <p className="mt-2 leading-[1.6] text-text-secondary">
        {description}
      </p>
    </header>
  )
}
