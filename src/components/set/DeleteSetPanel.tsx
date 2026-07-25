type Props = {
  onDelete: () => void
}

export function DeleteSetPanel({ onDelete }: Props) {
  return (
    <div className="danger-zone">
      <button type="button" className="danger-btn" onClick={onDelete}>
        Удалить сет
      </button>
    </div>
  )
}
