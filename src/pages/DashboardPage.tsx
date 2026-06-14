import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./DashboardPage.module.css";
import {
  BookIcon,
  CalendarIcon,
  ChefIcon,
  DiceIcon,
  FridgeIcon,
  SaveIcon,
  SearchIcon,
} from "../components/ui/Icons";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.greeting}>
          ¡Hola, {user?.username?.split(" ")[0]}!
        </h1>
        <p className={styles.question}>¿Qué tenés ganas de comer hoy?</p>
      </section>

      <NavLink to="/recipes/new">
        <section className={styles.banner}>
          <div className={styles.bannerContent}>
            <h1 className={styles.greeting}>¡Comparte tus recetas!</h1>
            <p className={styles.question}>Cuentanos tus mejores recetas</p>
          </div>

          <div className={styles.bannerIcon}>
            <ChefIcon fill="var(--c-surface)" />
          </div>
        </section>
      </NavLink>

      <section className={styles.actions}>
        <div className={styles.actionGrid}>
          <button
            className={styles.actionCard}
            onClick={() => navigate("/random-dinner")}
          >
            <div className={styles.actionIcon}>
              <DiceIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>
                  ¿No sabes qué cocinar?
                </span>
                <p className={styles.actionDesc}>
                  Deja que la suerte elija tu próxima aventura culinaria.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Sorpréndeme!</span>
            </div>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => navigate("/semanario")}
          >
            <div className={styles.actionIcon}>
              <CalendarIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>
                  Organizá tu semana
                </span>
                <p className={styles.actionDesc}>
                  Planificá el menú semanal con desayuno, almuerzo, merienda y cena.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Planificá!</span>
            </div>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => navigate("/fridge")}
          >
            <div className={styles.actionIcon}>
              <FridgeIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>
                  ¿Que tienes en la heladera?
                </span>
                <p className={styles.actionDesc}>
                  Busquemos algo con lo que ya tenés en casa.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Busquemos!</span>
            </div>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => navigate("/saved")}
          >
            <div className={styles.actionIcon}>
              <SaveIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>
                  ¿Qué guardaste por ahí?
                </span>
                <p className={styles.actionDesc}>
                  Volvé a descubrir las recetas que guardaste.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Tus guardas!</span>
            </div>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => navigate("/discover")}
          >
            <div className={styles.actionIcon}>
              <SearchIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>
                  ¿Buscando inspiración?
                </span>
                <p className={styles.actionDesc}>
                  Descubrí recetas nuevas, ideas deliciosas.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Descubre!</span>
            </div>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => navigate("/recipes")}
          >
            <div className={styles.actionIcon}>
              <BookIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>
                  Tus creaciones culinarias
                </span>
                <p className={styles.actionDesc}>
                  Volvé a preparar tus mejores platos.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Volvé!</span>
            </div>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => navigate("/recipes/new")}
          >
            <div className={styles.actionIcon}>
              <ChefIcon />
            </div>
            <div className={styles.actionContent}>
              <div className={styles.actionBody}>
                <span className={styles.actionTitle}>Comparte tu receta</span>
                <p className={styles.actionDesc}>
                  Escribí tu receta y guardá tus creaciones favoritas.
                </p>
              </div>

              <span className={styles.actionBtn}>¡Comparte!</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
