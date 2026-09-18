import { Plus, Check, Loader2 } from 'lucide-react';

const FavoriteIcon = ({ loading, added, justAdded, size = 15 }) => {
  if (loading) return <Loader2 size={size} className="animate-spin" />;
  if (added) return <Check size={size} className={justAdded ? 'icon-pop' : ''} />;
  return <Plus size={size} />;
};

export default FavoriteIcon;