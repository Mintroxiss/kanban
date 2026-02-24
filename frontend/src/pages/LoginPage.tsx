import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      const tokens =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password, fullName)
      loginStore(tokens)
      navigate('/boards')
    } catch {
      setError(mode === 'login' ? 'Неверная почта или пароль' : 'Ошибка регистрации. Возможно, такая почта уже используется.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Kanban</h1>

        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Полное имя"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email"
            placeholder="Эл. почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {mode === 'register' && (
            <input
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? mode === 'login' ? 'Вход…' : 'Регистрация…'
              : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  )
}
