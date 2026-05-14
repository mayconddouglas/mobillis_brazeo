import { 
  Bike, Car, Truck, Package, ShoppingBag, Briefcase, Target, Zap, Gift, Plane, Music, Film, Book, GraduationCap, DollarSign, CreditCard, PiggyBank, Heart, Star, Umbrella, Award, 
  Tag, Fuel, Coffee, HomeIcon, Smartphone, Wrench, ShoppingCart, LucideIcon
} from 'lucide-react';

export const incomeCategoryIconMap: Record<string, LucideIcon> = {
  car: Car, bike: Bike, truck: Truck, package: Package, 'shopping-bag': ShoppingBag, 
  briefcase: Briefcase, laptop: Package, 'trending-up': Target, zap: Zap, gift: Gift, 
  plane: Plane, music: Music, film: Film, book: Book, 'graduation-cap': GraduationCap,
  'dollar-sign': DollarSign, 'credit-card': CreditCard, 'piggy-bank': PiggyBank,
  heart: Heart, star: Star, umbrella: Umbrella, award: Award
};

export const expenseCategoryIconMap: Record<string, LucideIcon> = {
  tag: Tag, fuel: Fuel, coffee: Coffee, home: HomeIcon, smartphone: Smartphone, wrench: Wrench, 'shopping-cart': ShoppingCart
};

export function getCategoryIcon(iconKey: string | null | undefined, type: 'income' | 'expense'): LucideIcon {
  const map = type === 'income' ? incomeCategoryIconMap : expenseCategoryIconMap;
  return map[iconKey || ''] || (type === 'income' ? DollarSign : Tag);
}
