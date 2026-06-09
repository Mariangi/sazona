import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import type { SavedRecipe, RecipeListItem } from "@sasona/shared";
import AvatarUpload from "../components/profile/AvatarUpload";
import ProfileForm from "../components/profile/ProfileForm";
import ChangePasswordForm from "../components/profile/ChangePasswordForm";
import styles from "./ProfilePage.module.css";
import { ArrowRightIcon, CutleryIcon } from "../components/ui/Icons";
import { Popup } from "../components/ui/Popup";
import LogOut from "../components/Auth/LogOut";
import { NavLink } from "react-router-dom";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [favorites, setFavorites] = useState<SavedRecipe[]>([]);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [showPopupPassword, setShowPopupPassword] = useState(false);
  const [showPopupEdit, setShowPopupEdit] = useState(false);
  const [showPopupClose, setShowPopupClose] = useState(false);

  useEffect(() => {
    api.getSavedRecipes().then(setFavorites).catch(() => {});
    api.getRecipes().then(setRecipes).catch(() => {});
  }, []);

  async function handleAvatarUpload(base64: string) {
    const { avatarUrl } = await api.uploadAvatar(base64);
    if (user) setUser({ ...user, avatarUrl });
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div className={styles.info}>
          <AvatarUpload
            currentUrl={user?.avatarUrl || null}
            onUpload={handleAvatarUpload}
          />
          <h2>Chef {user?.username}</h2>
        </div>

        {recipes.length > 0 && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mis recetas</h2>
              <NavLink to="/recipes" className={styles.allLink}>
                <span className={styles.all}>ver todas</span>
              </NavLink>
            </div>

            <div className={styles.favorites}>
              {recipes.slice(0, 3).map((recipe) => (
                <NavLink
                  to={`/recipes/${recipe.id}`}
                  key={recipe.id}
                  className={styles.favoriteCard}
                >
                  <div className={styles.favoriteImageWrapper}>
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className={styles.favoriteImage}
                      />
                    ) : (
                      <div className={styles.favoritePlaceholder}><CutleryIcon height="12" width="12" /></div>
                    )}
                  </div>
                  <span className={styles.favoriteTitle}>{recipe.name}</span>
                </NavLink>
              ))}
            </div>
          </section>
        )}

        {favorites.length > 0 && (
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mis favoritos</h2>
              <NavLink to="/saved" className={styles.allLink}>
                <span className={styles.all}>ver todos</span>
              </NavLink>
            </div>

            <div className={styles.favorites}>
              {favorites.slice(0, 3).map((recipe) => (
                <NavLink
                  to={`/recipes/${recipe.recipeId}`}
                  key={recipe.id}
                  className={styles.favoriteCard}
                >
                  <div className={styles.favoriteImageWrapper}>
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className={styles.favoriteImage}
                      />
                    ) : (
                      <div className={styles.favoritePlaceholder}><CutleryIcon height="12" width="12" /></div>
                    )}
                  </div>
                  <span className={styles.favoriteTitle}>{recipe.name}</span>
                </NavLink>
              ))}
            </div>
          </section>
        )}

        <div className={styles.card} onClick={() => setShowPopupEdit(true)}>
          <span>Editar perfil</span>
          <ArrowRightIcon height="20" fill="var(--c-text)" />
        </div>

        <div className={styles.card} onClick={() => setShowPopupPassword(true)}>
          <span>Cambiar contraseña</span>
          <ArrowRightIcon height="20" fill="var(--c-text)" />
        </div>

        <div className={styles.card} onClick={() => setShowPopupClose(true)}>
          <span>Cerrar sesión</span>
          <ArrowRightIcon height="20" fill="var(--c-text)" />
        </div>
      </div>

      {showPopupEdit && (
        <Popup title="Editar perfil" onClose={() => setShowPopupEdit(false)}>
          <ProfileForm />
        </Popup>
      )}

      {showPopupPassword && (
        <Popup
          title="Cambiar contraseña"
          onClose={() => setShowPopupPassword(false)}
        >
          <ChangePasswordForm />
        </Popup>
      )}

      {showPopupClose && (
        <Popup title="Cerrar sesión" onClose={() => setShowPopupClose(false)}>
          <LogOut />
        </Popup>
      )}

      <p className={styles.version}>v1.1.0</p>
    </div>
  );
}
