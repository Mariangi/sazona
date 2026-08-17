import { useEffect, useState } from "react";
import { api, resolveMediaUrl } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import type { SavedRecipe, RecipeListItem, FamilyGroup } from "@sasona/shared";
import AvatarUpload from "../components/profile/AvatarUpload";
import ProfileForm from "../components/profile/ProfileForm";
import ChangePasswordForm from "../components/profile/ChangePasswordForm";
import styles from "./ProfilePage.module.css";
import {
  ArrowRightIcon,
  CalendarIcon,
  CutleryIcon,
  GroupIcon,
  ListToBuyIcon,
  NutritionIcon,
} from "../components/ui/Icons";
import { Popup } from "../components/ui/Popup";
import LogOut from "../components/Auth/LogOut";
import AppVersion from "../components/ui/AppVersion";
import { NavLink } from "react-router-dom";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [favorites, setFavorites] = useState<SavedRecipe[]>([]);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [showPopupPassword, setShowPopupPassword] = useState(false);
  const [showPopupEdit, setShowPopupEdit] = useState(false);
  const [showPopupClose, setShowPopupClose] = useState(false);

  useEffect(() => {
    api
      .getSavedRecipes()
      .then(setFavorites)
      .catch(() => {});
    api
      .getRecipes()
      .then(setRecipes)
      .catch(() => {});
    api
      .getGroups()
      .then(setGroups)
      .catch(() => {});
  }, []);

  async function handleAvatarUpload(base64: string) {
    const { avatarUrl } = await api.uploadAvatar(base64);
    if (user) setUser({ ...user, avatarUrl });
  }

  return (
    <section>
      <div className={styles.container}>
        <div className={styles.cards}>
          <div className={styles.info}>
            <AvatarUpload
              currentUrl={user?.avatarUrl || null}
              onUpload={handleAvatarUpload}
            />
            <h2>Chef {user?.username}</h2>
          </div>

          <section className={styles.emptySection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mis recetas</h2>
              {recipes.length > 0 && (
                <NavLink to="/recipes" className={styles.allLink}>
                  <span className={styles.all}>ver todas</span>
                </NavLink>
              )}
            </div>

            {recipes.length > 0 ? (
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
                          src={resolveMediaUrl(recipe.imageUrl)}
                          alt={recipe.name}
                          className={styles.favoriteImage}
                        />
                      ) : (
                        <div className={styles.favoritePlaceholder}>
                          <CutleryIcon height="12" width="12" />
                        </div>
                      )}
                    </div>
                    <span className={styles.favoriteTitle}>{recipe.name}</span>
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Todavía no creaste ninguna receta</p>
                <NavLink to="/recipes/new" className={styles.emptyLink}>
                  Crear tu primera receta
                </NavLink>
              </div>
            )}
          </section>

          <section className={styles.emptySection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mis favoritos</h2>
              {favorites.length > 0 && (
                <NavLink to="/saved" className={styles.allLink}>
                  <span className={styles.all}>ver todos</span>
                </NavLink>
              )}
            </div>

            {favorites.length > 0 ? (
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
                          src={resolveMediaUrl(recipe.imageUrl)}
                          alt={recipe.name}
                          className={styles.favoriteImage}
                        />
                      ) : (
                        <div className={styles.favoritePlaceholder}>
                          <CutleryIcon height="12" width="12" />
                        </div>
                      )}
                    </div>
                    <span className={styles.favoriteTitle}>{recipe.name}</span>
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Todavía no guardaste recetas</p>
                <NavLink to="/discover" className={styles.emptyLink}>
                  Descubrir recetas
                </NavLink>
              </div>
            )}
          </section>

          <section className={styles.emptySection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mis grupos</h2>
              {groups.length > 0 && (
                <NavLink to="/groups" className={styles.allLink}>
                  <span className={styles.all}>ver todos</span>
                </NavLink>
              )}
            </div>

            {groups.length > 0 ? (
              <div className={styles.favorites}>
                {groups.slice(0, 3).map((group) => (
                  <NavLink
                    to={`/groups/${group.id}`}
                    key={group.id}
                    className={styles.groupCard}
                  >
                    <div className={styles.groupPlaceholder}>
                      <GroupIcon height="28" width="28" />
                    </div>
                    <div className={styles.groupInfo}>
                      <span className={styles.groupName}>{group.name}</span>
                      <span className={styles.groupMeta}>{group.memberCount} miembros</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Todavía no formás parte de ningún grupo</p>
                <NavLink to="/groups" className={styles.emptyLink}>
                  Crear o unirme a un grupo
                </NavLink>
              </div>
            )}
          </section>

          <NavLink to="/meal-planner" className={styles.cardLink}>
            <div className={styles.card}>
              <span>Menu semanal</span>
              <CalendarIcon height="20" width="20" fill="var(--c-text)" />
            </div>
          </NavLink>

          <NavLink to="/shopping-lists" className={styles.cardLink}>
            <div className={styles.card}>
              <span>Lista de compras</span>
              <ListToBuyIcon height="20" width="20" fill="var(--c-text)" />
            </div>
          </NavLink>

          <NavLink to="/nutrition" className={styles.cardLink}>
            <div className={styles.card}>
              <span>Nutrición</span>
              <NutritionIcon height="20" width="20" fill="var(--c-text)" />
            </div>
          </NavLink>

          <div className={styles.card} onClick={() => setShowPopupEdit(true)}>
            <span>Editar perfil</span>
            <ArrowRightIcon height="20" fill="var(--c-text)" />
          </div>

          <div
            className={styles.card}
            onClick={() => setShowPopupPassword(true)}
          >
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
      </div>
      <AppVersion />
    </section>
  );
}
