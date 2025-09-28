import { MainLayout } from '@/components/layout/main-layout';
import { requireAuth } from '@/lib/auth';

export default async function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication
  const loggedInAgent = await requireAuth();

  return (
    <MainLayout loggedInAgent={loggedInAgent}>
      {children}
    </MainLayout>
  );
}
