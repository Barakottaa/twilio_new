import { AuthLayout } from '@/components/layout/auth-layout';

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
