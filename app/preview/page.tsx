import { notFound } from 'next/navigation';
import { RendererPreview } from '@/components/questions/RendererPreview';

export default function PreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <RendererPreview />;
}
