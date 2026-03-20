import { useParams } from 'react-router-dom';
import ClientDetails from '../../features/clients/components/ClientDetails';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ClientDetails clientId={id!} />;
}
