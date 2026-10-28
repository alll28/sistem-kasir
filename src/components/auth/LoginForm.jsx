import { useState } from 'react'
import { signIn } from '../../lib/supabase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signIn(email.trim(), password)
    } catch (signInError) {
      setError(signInError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4 dark:bg-slate-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-700 text-sm font-bold text-white">POS</div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Masuk ke kasir</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gunakan akun kasir Supabase untuk membuka data toko.</p>
        </div>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/40" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Kata sandi
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/40" />
          </label>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? 'Memeriksa akun...' : 'Masuk'}
        </button>
        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Buat akun kasir melalui Supabase Dashboard → Authentication → Users. Pendaftaran publik tidak diaktifkan dari aplikasi ini.</p>
      </form>
    </main>
  )
}
