import { AuthLayout } from '@/components/layout/auth-layout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
