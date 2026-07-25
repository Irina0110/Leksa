type Props = {
  title: string
  onBack: () => void
}

export function SetTopBar({ title, onBack }: Props) {
  return (
    <header className="top-bar">
      <button type="button" className="back-btn" onClick={onBack} aria-label="Назад">
        <span aria-hidden>‹</span>
        Назад
      </button>
      <h1>{title}</h1>
      <span className="top-spacer" />
    </header>
  )
}
