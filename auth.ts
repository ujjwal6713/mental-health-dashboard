import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const nextAuth = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const { auth, signIn, signOut, handlers } = nextAuth;
export default nextAuth;