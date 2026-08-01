import { useMemo } from 'react'
import type { AppStore } from '../hooks/useAppStore'
import { deriveStats } from '../stats'
import { SetTopBar } from './set/SetTopBar'

type Props = {
  store: AppStore
  onBack: () => void
}

export function StatsPage({ store, onBack }: Props) {
  const s = useMemo(
    () => deriveStats(store.sets, store.cards, store.stats),
    [store.sets, store.cards, store.stats],
  )

  return (
    <div className="screen stats-screen">
      <SetTopBar title="Статистика" onBack={onBack} />

      <section className="stats-hero panel">
        <div className="stats-streak">
          <span className="stats-streak-value">{s.streak}</span>
          <span className="stats-streak-label">
            {s.streak === 1 ? 'день подряд' : s.streak >= 2 && s.streak <= 4 ? 'дня подряд' : 'дней подряд'}
          </span>
        </div>
        <p className="muted stats-hero-sub">
          {s.reviews === 0
            ? 'Начните обучение — здесь появится прогресс'
            : `${s.reviews} ${pluralReviews(s.reviews)} · ${s.totalMinutes} мин`}
        </p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-value">{s.setCount}</span>
          <span className="stat-label">Сеты</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{s.cardCount}</span>
          <span className="stat-label">Карточки</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{s.sessions}</span>
          <span className="stat-label">Сессии</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{s.masteredPercent}%</span>
          <span className="stat-label">Лёгкие</span>
        </article>
      </section>

      <section className="panel">
        <h2>Сложность карточек</h2>
        <div className="mastery-bar" aria-hidden>
          {s.cardCount > 0 ? (
            <>
              <span
                className="mastery-seg mastery-easy"
                style={{ width: `${(s.easyCards / s.cardCount) * 100}%` }}
              />
              <span
                className="mastery-seg mastery-mid"
                style={{ width: `${(s.mediumCards / s.cardCount) * 100}%` }}
              />
              <span
                className="mastery-seg mastery-hard"
                style={{ width: `${(s.hardCards / s.cardCount) * 100}%` }}
              />
            </>
          ) : (
            <span className="mastery-empty" />
          )}
        </div>
        <ul className="mastery-legend">
          <li>
            <span className="dot easy" />
            Лёгкие · {s.easyCards}
          </li>
          <li>
            <span className="dot mid" />
            Средние · {s.mediumCards}
          </li>
          <li>
            <span className="dot hard" />
            Сложные · {s.hardCards}
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2>Оценки</h2>
        <div className="stats-row">
          <div>
            <strong>{s.easyMarks}</strong>
            <span>Проще ↑</span>
          </div>
          <div>
            <strong>{s.hardMarks}</strong>
            <span>Сложнее ↓</span>
          </div>
          <div>
            <strong>{s.reviews}</strong>
            <span>Всего</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>7 дней</h2>
        <div className="week-chart" role="img" aria-label="Активность за 7 дней">
          {s.week.map((day, i) => (
            <div key={`${day.label}-${i}`} className="week-col">
              <div className="week-bar-track">
                <div
                  className="week-bar"
                  style={{ height: `${Math.max(6, (day.reviews / day.max) * 100)}%` }}
                />
              </div>
              <span className="week-label">{day.label}</span>
              <span className="week-count">{day.reviews || ''}</span>
            </div>
          ))}
        </div>
      </section>

      {(s.reviews > 0 || s.sessions > 0) && (
        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            if (window.confirm('Сбросить статистику обучения? Карточки и сеты сохранятся.')) {
              store.resetStats()
            }
          }}
        >
          Сбросить статистику
        </button>
      )}
    </div>
  )
}

function pluralReviews(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'повтор'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'повтора'
  return 'повторов'
}
