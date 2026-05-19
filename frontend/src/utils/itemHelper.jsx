import React from 'react'
import { 
  Smartphone, 
  Car, 
  Bike, 
  Tv, 
  Monitor, 
  Box, 
  Wind,
  Layers
} from 'lucide-react'

/**
 * Universal helper to get the display name of an installment's item/product.
 * If category is 'other' and customItemName is set, returns customItemName.
 * Else returns `${brand} ${model}`.
 */
export function getItemDisplayName(installment) {
  if (!installment) return '';
  
  if (installment.category === 'other' && installment.customItemName) {
    return installment.customItemName;
  }
  
  // Fallback to customCategory if brand & model are missing
  const brand = installment.brand || '';
  const model = installment.model || '';
  if (!brand && !model && installment.customCategory) {
    return installment.customCategory;
  }
  
  const combined = `${brand} ${model}`.trim();
  return combined || 'Other Item';
}

/**
 * Universal helper to get a Lucide icon for a given category.
 */
export function getItemIcon(category, size = 16) {
  switch (category) {
    case 'motorcycle':
      return <Bike size={size} className="text-amber-600" />;
    case 'car':
      return <Car size={size} className="text-blue-600" />;
    case 'mobile':
      return <Smartphone size={size} className="text-purple-600" />;
    case 'tv':
    case 'lcd':
      return <Tv size={size} className="text-red-600" />;
    case 'ac':
      return <Wind size={size} className="text-sky-600" />;
    case 'washing_machine':
    case 'fridge':
      return <Layers size={size} className="text-emerald-600" />;
    case 'other':
    default:
      return <Box size={size} className="text-slate-600" />;
  }
}
