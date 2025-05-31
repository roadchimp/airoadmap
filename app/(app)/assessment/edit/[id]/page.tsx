import { redirect } from 'next/navigation';

interface EditRedirectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRedirectPage({ params }: EditRedirectPageProps) {
  const { id } = await params;
  // Redirect to the correct edit URL structure
  redirect(`/assessment/${id}`);
} 