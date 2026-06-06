import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CreateRecipePage from './pages/CreateRecipePage'
import MyRecipesPage from './pages/MyRecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import ProfilePage from './pages/ProfilePage'
import RandomDinnerPage from './pages/RandomDinnerPage'
import FridgePage from './pages/FridgePage'
import SavedRecipesPage from './pages/SavedRecipesPage'
import GroupsPage from './pages/GroupsPage'
import GroupPage from './pages/GroupPage'
import ShoppingListsPage from './pages/ShoppingListsPage'
import ShoppingListDetail from './pages/ShoppingListDetail'
import AuthLayout from './components/layout/AuthLayout'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <AuthLayout />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Cargando...</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
      </Route>

      <Route path="/recipes" element={<ProtectedRoute />}>
        <Route index element={<MyRecipesPage />} />
        <Route path="new" element={<CreateRecipePage />} />
      </Route>

      <Route path="/profile" element={<ProtectedRoute />}>
        <Route index element={<ProfilePage />} />
      </Route>

      <Route path="/random-dinner" element={<ProtectedRoute />}>
        <Route index element={<RandomDinnerPage />} />
      </Route>

      <Route path="/fridge" element={<ProtectedRoute />}>
        <Route index element={<FridgePage />} />
      </Route>

      <Route path="/saved" element={<ProtectedRoute />}>
        <Route index element={<SavedRecipesPage />} />
      </Route>

      <Route path="/recipes/:id" element={<ProtectedRoute />}>
        <Route index element={<RecipeDetailPage />} />
      </Route>

      <Route path="/groups" element={<ProtectedRoute />}>
        <Route index element={<GroupsPage />} />
        <Route path=":id" element={<GroupPage />} />
      </Route>

      <Route path="/shopping-lists" element={<ProtectedRoute />}>
        <Route index element={<ShoppingListsPage />} />
        <Route path=":id" element={<ShoppingListDetail />} />
      </Route>
    </Routes>
  )
}
