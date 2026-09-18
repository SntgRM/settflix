import { Loader2 } from 'lucide-react';

const Loader = ({ label = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <Loader2 className="w-8 h-8 text-[#ff6b1a] animate-spin" />
    <p className="text-[#8f8a82] text-sm">{label}</p>
  </div>
);

export const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[140px] md:w-[180px]">
    <div className="aspect-[2/3] bg-[#161616] rounded-lg animate-pulse" />
    <div className="mt-2 h-3 w-3/4 bg-[#161616] rounded animate-pulse" />
    <div className="mt-1 h-2 w-1/3 bg-[#161616] rounded animate-pulse" />
  </div>
);

export default Loader;
