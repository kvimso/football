import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In | Georgian Football Talent Platform',
  description: 'Sign in to your Georgian Football Talent Platform account.',
}

export default function LoginPage() {
  return <LoginForm />
}
