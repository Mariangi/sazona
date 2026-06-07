import RecipeForm from '../components/recipes/RecipeForm'
import styles from './CreateRecipePage.module.css'

export default function CreateRecipePage() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Nueva receta</h2>
      <p className={styles.subtitle}>Compartí tu creación con el mundo</p>
      <div className={styles.card}>
        <RecipeForm />
      </div>
    </div>
  )
}
