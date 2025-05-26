import { redirect } from 'next/navigation';

interface EditRedirectPageProps {
  params: {
    id: string;
  };
}

export default function EditRedirectPage({ params }: EditRedirectPageProps) {
  // Redirect to the correct edit URL structure
  redirect(`/assessment/${params.id}`);
} 