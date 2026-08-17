import { useEffect, useState } from 'react'
import type { AnalyzeMealResponse, NutritionLogEntry } from '@sasona/shared'
import { api, resolveMediaUrl } from '../api/client'
import Button from '../components/ui/Button'
import MealCapture from '../components/nutrition/MealCapture'
import { TrashIcon } from '../components/ui/Icons'
import styles from './NutritionPage.module.css'

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export default function NutritionPage() {
  const [logs, setLogs] = useState<NutritionLogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [draft, setDraft] = useState<AnalyzeMealResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoadingLogs(true)
    try {
      const data = await api.getNutritionLogs()
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial')
    } finally {
      setLoadingLogs(false)
    }
  }

  function handleAnalyzed(result: AnalyzeMealResponse, imageBase64: string) {
    setDraft(result)
    setPendingImage(imageBase64)
    setError('')
  }

  function updateDraft(field: keyof AnalyzeMealResponse, value: string) {
    if (!draft) return
    if (field === 'foodName' || field === 'servingDescription') {
      setDraft({ ...draft, [field]: value })
    } else {
      setDraft({ ...draft, [field]: Number(value) || 0 })
    }
  }

  function handleDiscard() {
    setDraft(null)
    setPendingImage(null)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setError('')
    try {
      const created = await api.createNutritionLog({
        imageBase64: pendingImage || undefined,
        foodName: draft.foodName,
        servingDescription: draft.servingDescription,
        calories: draft.calories,
        protein: draft.protein,
        fat: draft.fat,
        carbs: draft.carbs,
      })
      setLogs([created, ...logs])
      setDraft(null)
      setPendingImage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const previous = logs
    setLogs(logs.filter(l => l.id !== id))
    try {
      await api.deleteNutritionLog(id)
    } catch (err) {
      setLogs(previous)
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
    }
  }

  const todayLogs = logs.filter(l => isToday(l.createdAt))
  const todayTotals = todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein,
      fat: acc.fat + l.fat,
      carbs: acc.carbs + l.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Nutrición</h2>
        <p className={styles.subtitle}>
          Sacale una foto a tu comida y estimamos sus calorías y macros
        </p>
      </div>

      <div className={styles.card}>
        <MealCapture onAnalyzed={handleAnalyzed} />

        {error && <div className={styles.error}>{error}</div>}

        {draft && (
          <div className={styles.draft}>
            {pendingImage && (
              <img src={pendingImage} alt="" className={styles.draftImage} />
            )}

            <div className={styles.field}>
              <label className={styles.label}>Comida</label>
              <input
                className={styles.input}
                value={draft.foodName}
                onChange={(e) => updateDraft('foodName', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Porción</label>
              <input
                className={styles.input}
                value={draft.servingDescription}
                onChange={(e) => updateDraft('servingDescription', e.target.value)}
              />
            </div>

            <div className={styles.macroGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Calorías</label>
                <input
                  type="number"
                  className={styles.input}
                  value={draft.calories}
                  onChange={(e) => updateDraft('calories', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Proteínas (g)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={draft.protein}
                  onChange={(e) => updateDraft('protein', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Grasas (g)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={draft.fat}
                  onChange={(e) => updateDraft('fat', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Carbohidratos (g)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={draft.carbs}
                  onChange={(e) => updateDraft('carbs', e.target.value)}
                />
              </div>
            </div>

            <p className={styles.disclaimer}>
              Los valores son una estimación aproximada hecha por IA a partir de la foto, no una medición exacta.
            </p>

            <div className={styles.actions}>
              <Button onClick={handleSave} isLoading={saving}>
                Guardar
              </Button>
              <Button variant="secondary" onClick={handleDiscard} disabled={saving}>
                Descartar
              </Button>
            </div>
          </div>
        )}
      </div>

      {todayLogs.length > 0 && (
        <div className={styles.totalsCard}>
          <h3 className={styles.totalsTitle}>Hoy</h3>
          <div className={styles.totalsGrid}>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{Math.round(todayTotals.calories)}</span>
              <span className={styles.totalLabel}>Calorías</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{Math.round(todayTotals.protein)}g</span>
              <span className={styles.totalLabel}>Proteínas</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{Math.round(todayTotals.fat)}g</span>
              <span className={styles.totalLabel}>Grasas</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalValue}>{Math.round(todayTotals.carbs)}g</span>
              <span className={styles.totalLabel}>Carbohidratos</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.history}>
        <h3 className={styles.historyTitle}>Historial</h3>

        {loadingLogs && <div className={styles.loadingState}>Cargando...</div>}

        {!loadingLogs && logs.length === 0 && (
          <div className={styles.empty}>
            <p>Todavía no registraste ninguna comida</p>
          </div>
        )}

        <div className={styles.logList}>
          {logs.map((log) => (
            <div key={log.id} className={styles.logItem}>
              {log.imageUrl && (
                <img src={resolveMediaUrl(log.imageUrl)} alt="" className={styles.logImage} />
              )}
              <div className={styles.logInfo}>
                <span className={styles.logName}>{log.foodName}</span>
                {log.servingDescription && (
                  <span className={styles.logServing}>{log.servingDescription}</span>
                )}
                <div className={styles.logMacros}>
                  <span>{Math.round(log.calories)} kcal</span>
                  <span>{Math.round(log.protein)}g prot</span>
                  <span>{Math.round(log.fat)}g grasa</span>
                  <span>{Math.round(log.carbs)}g carb</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(log.id)}
                title="Eliminar"
              >
                <TrashIcon width="18" height="18" fill="var(--c-text-secondary)" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
