import AlertDetailClient from './AlertDetailClient';

// Pre-render all alert pages at build time for static export
export function generateStaticParams() {
  return [100,101,102,103,104,105,106,107,108,109,110,111,112,113,114].map(id => ({
    id: String(id),
  }));
}

export default function AlertDetailPage({ params }: { params: { id: string } }) {
  return <AlertDetailClient params={params} />;
}
