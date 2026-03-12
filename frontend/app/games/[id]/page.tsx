import GameDetailClient from './GameDetailClient';

// Pre-render all game pages at build time for static export
export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
  ];
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  return <GameDetailClient params={params} />;
}
