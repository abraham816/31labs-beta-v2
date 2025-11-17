import { ImageWithFallback } from './figma/ImageWithFallback';

export function ProductCard({ product, onClick }) {
  return (
    <button
      onClick={() => onClick?.(product)}
      className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:shadow-lg transition-all text-left w-full group"
    >
      <div className="aspect-square bg-neutral-50 overflow-hidden">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 space-y-1">
        <h3 className="text-neutral-900 text-sm font-medium line-clamp-2">{product.name}</h3>
        <p className="text-neutral-900 font-medium">${product.price.toFixed(2)}</p>
        {product.description && (
          <p className="text-neutral-500 text-xs line-clamp-2">{product.description}</p>
        )}
      </div>
    </button>
  );
}
