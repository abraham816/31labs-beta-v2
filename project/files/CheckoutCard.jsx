import { useState } from 'react';
import { ArrowLeft, Info, Check } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function CheckoutCard({ 
  product, 
  initialQuantity = 1, 
  initialSize = 'M',
  brandName = 'YOUR BRAND',
  onBack 
}) {
  const [expressShipping, setExpressShipping] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const subtotal = product.price * initialQuantity;
  const shippingCost = expressShipping ? 9.99 : 0;
  const expressSavings = 6;
  const tax = 0;
  const total = subtotal + shippingCost + tax;

  const handleCheckout = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setOrderComplete(true);
    }, 2000);
  };

  if (orderComplete) {
    return (
      <div className="bg-[#2d4a4a] text-white p-6 rounded-2xl max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-[#2d4a4a]" strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl">Order Confirmed</h2>
            <p className="text-neutral-200">
              Thank you for your purchase!
            </p>
          </div>
          <div className="bg-[#253d3d] rounded-xl p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">Order Number</span>
              <span className="text-white">#{Math.floor(Math.random() * 100000)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-neutral-600">
              <span className="text-white">Total Paid</span>
              <span className="text-white text-xl">${total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-sm text-neutral-300">
            Your order will be shipped within 2-3 business days
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2d4a4a] text-white rounded-2xl max-w-md w-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full" />
            <span className="text-lg tracking-wider">{brandName.toUpperCase()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl text-neutral-200">Complete your order</h1>
          <div className="text-5xl">${total.toFixed(2)}</div>
          <p className="text-neutral-300">
            {product.name} • Size {initialSize} • Qty {initialQuantity}
          </p>
        </div>

        <div className="bg-[#3a5757] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg mb-1">{product.name}</h3>
              <p className="text-neutral-300 text-sm">
                Size: {initialSize} • Quantity: {initialQuantity}
              </p>
            </div>
            <div className="text-lg">${subtotal.toFixed(2)}</div>
          </div>

          <div className="border-t border-neutral-600" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpressShipping(!expressShipping)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  expressShipping ? 'bg-neutral-500' : 'bg-neutral-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    expressShipping ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[#ff6b52]">Save ${expressSavings}</span>
                <span className="text-neutral-300">with express shipping</span>
              </div>
            </div>
            <div className="text-sm">+${shippingCost.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-lg">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {!showPromoInput ? (
          <button
            onClick={() => setShowPromoInput(true)}
            className="text-white underline text-left"
          >
            Add promotion code
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="w-full px-4 py-3 bg-[#3a5757] border border-neutral-600 rounded-lg text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => setShowPromoInput(false)}
              className="text-sm text-neutral-400 underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Tax</span>
            <Info className="w-4 h-4 text-neutral-400" />
          </div>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-xl pt-2">
          <span>Total due today</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full bg-white hover:bg-neutral-100 disabled:bg-neutral-300 text-[#2d4a4a] py-4 rounded-2xl transition-colors text-lg font-medium"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#2d4a4a] border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            'Complete Purchase'
          )}
        </button>

        <div className="text-center text-sm text-neutral-400 pt-4">
          <p>
            ©2024 All rights reserved{' '}
            <button className="underline hover:text-neutral-300">Terms</button>{' '}
            <button className="underline hover:text-neutral-300">Privacy</button>
          </p>
        </div>
      </div>
    </div>
  );
}
