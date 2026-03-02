import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
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
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined
      if (mode === 'login') {
        setError(status === 401 ? 'Неверная почта или пароль' : 'Сервер недоступен. Проверьте соединение и попробуйте позже.')
      } else {
        setError(status === 400 || status === 409 ? 'Ошибка регистрации. Возможно, такая почта уже используется.' : 'Сервер недоступен. Проверьте соединение и попробуйте позже.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center z-10 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.svg"
              alt="ТехАртель"
              className="w-16 h-16 drop-shadow-[0_0_16px_rgba(99,102,241,0.6)]"
            />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-1">ТехАртель</h1>
          <p className="text-white/40 text-sm">Система управления проектами</p>
        </div>

        <div className="backdrop-blur-2xl bg-white/[0.14] border border-white/[0.20] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] p-8">
          <div className="flex rounded-2xl bg-white/[0.11] border border-white/[0.23] p-1 mb-7">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-indigo-500/80 text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)]'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Войти
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-indigo-500/80 text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)]'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Полное имя"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-white/[0.14] border border-white/[0.22] rounded-2xl px-4 py-3 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:bg-white/[0.11] transition-all text-sm"
              />
            )}
            <input
              type="email"
              placeholder="Эл. почта"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/[0.14] border border-white/[0.22] rounded-2xl px-4 py-3 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:bg-white/[0.11] transition-all text-sm"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/[0.14] border border-white/[0.22] rounded-2xl px-4 py-3 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:bg-white/[0.11] transition-all text-sm"
            />
            {mode === 'register' && (
              <input
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white/[0.14] border border-white/[0.22] rounded-2xl px-4 py-3 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:bg-white/[0.11] transition-all text-sm"
              />
            )}
            {error && (
              <p className="text-red-300/90 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-indigo-500/80 hover:bg-indigo-500/95 disabled:opacity-50 text-white rounded-2xl py-3 font-semibold transition-all shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] border border-indigo-400/30"
            >
              {loading
                ? mode === 'login' ? 'Вход…' : 'Регистрация…'
                : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
