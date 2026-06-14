type Props = {
  index: string
  title: string
  subtitle: string
}

export function SectionHeading({ index, title, subtitle }: Props) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink/15 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-sm text-vermilion">{index}</span>
        <h2 className="font-serif text-3xl tracking-tight text-balance md:text-4xl">
          {title}
        </h2>
      </div>
      <p className="max-w-md text-pretty text-sm leading-relaxed text-ink-soft">
        {subtitle}
      </p>
    </div>
  )
}
