import { AuthLayout } from '@/components/layout/auth-layout';

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
