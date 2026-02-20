import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Register | Georgian Football Talent Platform',
  description: 'Create your free scout account on the Georgian Football Talent Platform.',
}

export default function RegisterPage() {
  return <RegisterForm />
}
