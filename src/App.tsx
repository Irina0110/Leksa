import { useState } from 'react'
import { Home } from './components/Home'
import { LibraryPage } from './components/LibraryPage'
import { StatsPage } from './components/StatsPage'
import { AddCardScreen, SetEditor } from './components/set'
import { StudyMode } from './components/StudyMode'
import { useAppStore } from './hooks/useAppStore'
import type { View } from './types'

export default function App() {
  const store = useAppStore()
  const [view, setView] = useState<View>({ name: 'home' })

  if (view.name === 'study') {
    return (
      <StudyMode
        setIds={view.setIds}
        store={store}
        onExit={() => setView({ name: 'home' })}
      />
    )
  }

  if (view.name === 'stats') {
    return <StatsPage store={store} onBack={() => setView({ name: 'home' })} />
  }

  if (view.name === 'library') {
    return <LibraryPage store={store} onBack={() => setView({ name: 'home' })} />
  }

  if (view.name === 'add-card') {
    return (
      <AddCardScreen
        store={store}
        setId={view.setId}
        onBack={() => setView({ name: 'edit-set', setId: view.setId })}
      />
    )
  }

  if (view.name === 'edit-set') {
    return (
      <SetEditor
        store={store}
        setId={view.setId}
        onBack={() => setView({ name: 'home' })}
        onCreated={(setId) => setView({ name: 'edit-set', setId })}
        onAddCard={(setId) => setView({ name: 'add-card', setId })}
      />
    )
  }

  return (
    <Home
      store={store}
      onCreateSet={() => setView({ name: 'edit-set', setId: null })}
      onEditSet={(setId) => setView({ name: 'edit-set', setId })}
      onStartStudy={(setIds) => setView({ name: 'study', setIds })}
      onOpenStats={() => setView({ name: 'stats' })}
      onOpenLibrary={() => setView({ name: 'library' })}
    />
  )
}
