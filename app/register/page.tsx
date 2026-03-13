import type { Metadata } from 'next';
import { RegisterClient } from './register-client';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Sign in and get your ClawRank API token',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
