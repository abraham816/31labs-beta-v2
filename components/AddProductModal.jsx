import { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function AddProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  editingProduct, 
  existingProducts = [] 
}) {
  const [view, setView] = useState(existingProducts.length > 0 && !editingProduct ? 'list' : 'form');
  const [productName, setProductName] = useState(editingProduct?.name || '');
  const [productPrice, setProductPrice] = useState(editingProduct?.price.toString() || '');
  const [productImage, setProductImage] = useState(editingProduct?.image || '');
  const [imageMethod, setImageMethod] = useState('upload');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!productName.trim() || !productPrice.trim()) return;

    const product = {
      id: editingProduct?.id || `product-${Date.now()}`,
      name: productName.trim(),
      price: parseFloat(productPrice),
      image: productImage || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    };

    onSave(product);
    handleClose();
  };

  const handleClose = () => {
    setProductName('');
    setProductPrice('');
    setProductImage('');
    setView(existingProducts.length > 0 ? 'list' : 'form');
    onClose();
  };

  const handleEditProduct = (product) => {
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductImage(product.image);
    setView('form');
  };

  const handleDeleteProduct = (productId) => {
    if (onDelete) {
      onDelete(productId);
      if (existingProducts.length <= 1) {
        setView('form');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-neutral-900">
            {view === 'list' ? 'Products' : editingProduct ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors text-neutral-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-600">
                  {existingProducts.length} {existingProducts.length === 1 ? 'product' : 'products'} in stock
                </p>
                <Button
                  onClick={() => setView('form')}
                  className="bg-[#2a2a2a] hover:bg-[#2a2a2a]/90 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {existingProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-neutral-900 truncate">{product.name}</h3>
                      <p className="text-sm text-neutral-600">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleEditProduct(product)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Classic T-Shirt"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="bg-neutral-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productPrice">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">$</span>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="pl-7 bg-neutral-50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Product Image</Label>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setImageMethod('upload')}
                    variant={imageMethod === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    className={imageMethod === 'upload' ? 'bg-[#2a2a2a] text-white' : ''}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setImageMethod('url')}
                    variant={imageMethod === 'url' ? 'default' : 'outline'}
                    size="sm"
                    className={imageMethod === 'url' ? 'bg-[#2a2a2a] text-white' : ''}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Image URL
                  </Button>
                </div>

                {imageMethod === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                    <p className="text-sm text-neutral-600 mb-1">Click to upload image</p>
                    <p className="text-xs text-neutral-400">PNG, JPG, WEBP up to 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    className="bg-neutral-50"
                  />
                )}

                {productImage && (
                  <div className="mt-4">
                    <p className="text-xs text-neutral-600 mb-2">Preview</p>
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200">
                      <ImageWithFallback
                        src={productImage}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {view === 'form' && (
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between gap-3">
            <Button
              onClick={() => {
                if (existingProducts.length > 0) {
                  setView('list');
                  setProductName('');
                  setProductPrice('');
                  setProductImage('');
                } else {
                  handleClose();
                }
              }}
              variant="outline"
            >
              {existingProducts.length > 0 ? 'Back to List' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!productName.trim() || !productPrice.trim()}
              className="bg-[#ff5436] hover:bg-[#ff5436]/90 text-white"
            >
              {editingProduct ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
