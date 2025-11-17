import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, Share2, Minus, Plus, Check } from 'lucide-react';
import { Badge } from './ui/badge';

export function ProductDetail({ product, onBuyNow }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isLiked, setIsLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-neutral-200 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-8 p-8">
        <div className="relative bg-neutral-50 rounded-2xl overflow-hidden aspect-[3/4]">
          {product.preorder && (
            <Badge className="absolute top-4 left-4 bg-neutral-900 text-white hover:bg-neutral-800 z-10">
              Pre-order
            </Badge>
          )}
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          {product.category && (
            <p className="text-neutral-500 text-sm mb-2">
              HOME • {product.category.toUpperCase()}
            </p>
          )}

          <h2 className="text-neutral-900 mb-4">{product.name}</h2>

          <div className="flex items-center gap-3 mb-6">
            <p className="text-neutral-900">${product.price.toFixed(2)} USD</p>
            {product.preorder && (
              <Badge className="bg-neutral-900 text-white hover:bg-neutral-800">
                Pre-order
              </Badge>
            )}
          </div>

          <div className="mb-6">
            <p className="text-neutral-900 mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedSize === size
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-neutral-900 mb-2">Quantity</p>
            <div className="inline-flex items-center gap-4 border border-neutral-200 rounded-lg px-4 py-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-neutral-900 min-w-[2ch] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <button
              onClick={handleAddToCart}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {addedToCart ? (
                <>
                  <Check className="w-5 h-5" />
                  Added to Cart
                </>
              ) : (
                'Add More to Cart'
              )}
            </button>
            <button 
              onClick={() => onBuyNow?.(product, quantity, selectedSize)}
              className="w-full border border-neutral-900 text-neutral-900 hover:bg-neutral-50 py-4 rounded-xl transition-colors text-center"
            >
              Buy Now
            </button>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            </button>
            <button
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
