'use client';

import dynamic from 'next/dynamic';
import { Zen_Old_Mincho } from 'next/font/google';

const zenOldMincho = Zen_Old_Mincho({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

// Dynamic import with NO SSR to avoid hydration mismatch with random physics/canvas
const UniverseGraph = dynamic(() => import('@/components/UniverseGraph'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-white/20 animate-pulse">Initializing Universe...</div>,
});

export const metadata = {
  title: 'Mambo Universe',
  description: 'A personal interactive knowledge graph.',
};

export default function Home() {
  return (
    <main className={`w-screen h-screen bg-[#050510] overflow-hidden ${zenOldMincho.className}`}>
      <UniverseGraph />
    </main>
  );
}
