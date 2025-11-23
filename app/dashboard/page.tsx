import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/Dashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Mental Health Literacy Dashboard
            </h1>
            <p className="text-sm text-gray-600">Algoma University</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session.user?.role || 'viewer'}
              </p>
            </div>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <Dashboard userRole={session.user?.role as string} />
    </div>
  );
}