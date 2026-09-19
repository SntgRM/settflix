import { HeartPlus, Heart, Loader2 } from 'lucide-react';

const FavoriteIcon = ({ loading, added, justAdded, size = 15 }) => {
  if (loading) return <Loader2 size={size} className="animate-spin" />;
  if (added) return <Heart size={size} fill="currentColor" className={justAdded ? 'icon-pop' : ''} />;
  return <HeartPlus size={size} />;
};

export default FavoriteIcon;