import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listSpreadsheets,
  createSpreadsheet,
  deleteSpreadsheet,
  logout,
  getCachedUser,
  type SpreadsheetListItem,
} from '../lib/api'
import {
  Grid3X3,
  Plus,
  FileSpreadsheet,
  Trash2,
  LogOut,
  Search,
  MoreVertical,
  Clock,
  User,
} from 'lucide-react'
import styles from './DashboardPage.module.css'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const user = getCachedUser()

  const fetchSpreadsheets = useCallback(async () => {
    try {
      const data = await listSpreadsheets()
      setSpreadsheets(data)
    } catch {
      // If unauthorized, redirect to login
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSpreadsheets()
  }, [fetchSpreadsheets])

  // Close menus on outside click
  useEffect(() => {
    function handleClick() {
      setMenuOpen(null)
    }
    if (menuOpen !== null) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [menuOpen])

  async function handleCreate() {
    setCreating(true)
    try {
      const sheet = await createSpreadsheet('Untitled spreadsheet')
      navigate(`/spreadsheet/${sheet.id}`)
    } catch {
      setCreating(false)
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(null)
    if (!confirm('Delete this spreadsheet? This cannot be undone.')) return
    try {
      await deleteSpreadsheet(id)
      setSpreadsheets((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // handle error
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const filtered = spreadsheets.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoMark}>
            <Grid3X3 size={20} strokeWidth={2.5} />
          </div>
          <h1 className={styles.appName}>Jaggle Grids</h1>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search spreadsheets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.headerRight}>
          <button onClick={handleLogout} className={styles.userButton} title="Sign out">
            <div className={styles.avatar}>
              {user?.name?.[0]?.toUpperCase() || <User size={14} />}
            </div>
            <span className={styles.userName}>{user?.name}</span>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {/* Create new section */}
        <section className={styles.createSection}>
          <h2 className={styles.sectionTitle}>Start a new spreadsheet</h2>
          <div className={styles.createGrid}>
            <button
              onClick={handleCreate}
              disabled={creating}
              className={styles.createCard}
            >
              <div className={styles.createCardIcon}>
                <Plus size={32} strokeWidth={1.5} />
              </div>
              <span className={styles.createCardLabel}>Blank spreadsheet</span>
            </button>
          </div>
        </section>

        {/* Recent spreadsheets */}
        <section className={styles.recentSection}>
          <div className={styles.recentHeader}>
            <h2 className={styles.sectionTitle}>Recent spreadsheets</h2>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p>Loading your spreadsheets...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <FileSpreadsheet size={48} strokeWidth={1} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>
                {search ? 'No spreadsheets match your search' : 'No spreadsheets yet'}
              </p>
              <p className={styles.emptyDescription}>
                {search
                  ? 'Try adjusting your search terms'
                  : 'Create your first spreadsheet to get started'}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((sheet) => (
                <div
                  key={sheet.id}
                  className={styles.card}
                  onClick={() => navigate(`/spreadsheet/${sheet.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/spreadsheet/${sheet.id}`)
                  }}
                >
                  <div className={styles.cardPreview}>
                    <FileSpreadsheet size={32} strokeWidth={1} />
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitle}>{sheet.title}</h3>
                      <div className={styles.cardMenu}>
                        <button
                          className={styles.menuButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen(menuOpen === sheet.id ? null : sheet.id)
                          }}
                          aria-label="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpen === sheet.id && (
                          <div className={styles.dropdown}>
                            <button
                              className={styles.dropdownItemDanger}
                              onClick={(e) => handleDelete(sheet.id, e)}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.cardMeta}>
                      <Clock size={12} />
                      <span>Opened {formatDate(sheet.updated_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
