import { AuthLayout } from '@/components/layout/auth-layout';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
