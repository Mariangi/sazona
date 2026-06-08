import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { RecipeResponse } from "@sasona/shared";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import styles from "./RecipeDetailPage.module.css";
import { ArrowLeftIcon, ClockIcon, EditIcon, PeopleIcon, SavedIcon, SaveIcon } from "../components/ui/Icons";

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [togglingSave, setTogglingSave] = useState(false);

  useEffect(() => {
    if (!id) return;
    const recipeId = Number(id);
    api
      .getRecipeById(recipeId)
      .then(setRecipe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    api
      .isRecipeSaved(recipeId)
      .then((res) => setSaved(res.saved))
      .catch(() => {});
  }, [id]);

  async function handleToggleSave() {
    if (!id) return;
    setTogglingSave(true);
    try {
      if (saved) {
        await api.unsaveRecipe(Number(id));
        setSaved(false);
      } else {
        await api.saveRecipe(Number(id));
        setSaved(true);
      }
    } catch {
    } finally {
      setTogglingSave(false);
    }
  }

  async function handleGenerateList() {
    if (!recipe) return;
    setGenerating(true);
    try {
      await api.createShoppingList({
        name: recipe.name,
        items: recipe.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGenerating(false);
    }
  }

  if (loading)
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  if (error)
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  if (!recipe)
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>Receta no encontrada</p>
      </div>
    );

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
       <ArrowLeftIcon height="12" width="12" fill="var(--c-primary)"/> Volver
      </button>

      {recipe.imageUrl && (
        <div className={styles.hero}>
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className={styles.heroImage}
          />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{recipe.name}</h1>
            <div className={styles.meta}>
              <span>
                <PeopleIcon
                  height="14"
                  width="14"
                  fill="var(--c-text-secondary)"
                />{" "}
                {recipe.servings} comensales
              </span>
              <span>
                {" "}
                <ClockIcon
                  height="14"
                  width="14"
                  fill="var(--c-text-secondary)"
                />{" "}
                {recipe.prepTime} minutos
              </span>
            </div>
          </div>
          <div className={styles.actionsRow}>
            {recipe.userId === user?.id && (
              <button
                className={styles.editBtn}
                onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                title="Editar receta"
              >
                <EditIcon fill="var(--c-primary)" height="24" width="24"/>
              </button>
            )}
            <button
              className={`${styles.saveBtn} ${saved ? styles.saved : ""}`}
              onClick={handleToggleSave}
              disabled={togglingSave}
              title={saved ? "Quitar de guardados" : "Guardar"}
            >
              {saved ? <SavedIcon fill="var(--c-primary)"/> : <SaveIcon fill="var(--c-primary)"/>}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Ingredientes</h3>
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className={styles.ingredientItem}>
                <span className={styles.ingredientBullet} />
                <span className={styles.ingredientName}>{ing.name}</span>
                {ing.quantity && (
                  <span className={styles.ingredientQty}>
                    {ing.quantity}
                    {ing.unit ? ` ${ing.unit}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Pasos</h3>
          <ol className={styles.stepList}>
            {recipe.steps.map((step, i) => (
              <li key={i} className={styles.stepItem}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <p className={styles.stepText}>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.actions}>
          {generated ? (
            <Button onClick={() => navigate("/shopping-lists")}>
               Ver lista de compras
            </Button>
          ) : (
            <Button onClick={handleGenerateList} isLoading={generating}>
               Generar lista de compras
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
