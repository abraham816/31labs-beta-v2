import { useState, useRef, useEffect } from "react";
import { ArrowUp, X, Upload, Link as LinkIcon } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductCarousel } from "./ProductCarousel";
import { ProductDetail } from "./ProductDetail";
import { CheckoutCard } from "./CheckoutCard";


const getImageBrightness = (imageSrc, callback) => {
  if (!imageSrc) { callback("dark"); return; }
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageSrc;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let brightness = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      brightness += (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
    }
    brightness = brightness / (imageData.data.length / 4);
    callback(brightness > 127 ? "light" : "dark");
  };
  img.onerror = () => callback("dark");
};

const DEFAULT_MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Product 1",
    price: 49.0,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
  },
  {
    id: "mock-2",
    name: "Product 2",
    price: 59.0,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
  },
  {
    id: "mock-3",
    name: "Product 3",
    price: 39.0,
    image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400",
  },
  {
    id: "mock-4",
    name: "Product 4",
    price: 69.0,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  },
  {
    id: "mock-5",
    name: "Product 5",
    price: 79.0,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  },
];

export function AgentPreview({ agentData, onUpdateAgent }) {
  const {
    brandName,
    heroHeader,
    heroSubheader,
    productPills,
    products,
    salesTone,
    backgroundImage,
  } = agentData;

  const displayPills =
    productPills && productPills.length > 0
      ? productPills
      : products && products.length > 0
        ? products.map((p) => ({ name: p.name, image: p.image }))
        : DEFAULT_MOCK_PRODUCTS.map((p) => ({ name: p.name, image: p.image }));

  const [prompt, setPrompt] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const displayProducts =
    products && products.length > 0 ? products : DEFAULT_MOCK_PRODUCTS;

  const PRODUCT_DETAILS = {};
  displayProducts.forEach((product) => {
    PRODUCT_DETAILS[product.id] = {
      ...product,
      category: "PRODUCT",
      fit: "Standard Fit",
      fabric: "Premium quality materials",
      details: [
        "High-quality construction",
        "Comfortable and durable",
        "Perfect for everyday use",
        "Available in multiple sizes",
      ],
    };
  });

  const generateAIResponse = async (userPrompt) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userPrompt,
          agentData: agentData 
        })
      });
      
      const data = await response.json();
      
      return {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        type: "text",
      };
    } catch (error) {
      return {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        type: "text",
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setTimeout(async () => {
      const aiMessage = await generateAIResponse(currentPrompt);
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setMessages([]);
    setPrompt("");
    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: suggestion,
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(async () => {
      const aiMessage = await generateAIResponse(suggestion);
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleProductClick = (product) => {
    const productDetail = PRODUCT_DETAILS[product.id];
    if (productDetail) {
      const detailMessage = {
        id: Date.now().toString(),
        role: "assistant",
        timestamp: new Date(),
        type: "product-detail",
        productDetail: productDetail,
      };
      setMessages((prev) => [...prev, detailMessage]);
    }
  };

  const handleBuyNow = (product, quantity, size) => {
    const checkoutMessage = {
      id: Date.now().toString(),
      role: "assistant",
      timestamp: new Date(),
      type: "checkout",
      checkoutProduct: {
        product,
        quantity,
        size,
      },
    };
    setMessages((prev) => [...prev, checkoutMessage]);
  };

  const handleEditField = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveField = () => {
    if (onUpdateAgent && editingField && editValue.trim()) {
      const updates = {};

      switch (editingField) {
        case "brandName":
          updates.brandName = editValue.trim();
          break;
        case "heroHeader":
          updates.heroHeader = editValue.trim();
          break;
        case "heroSubheader":
          updates.heroSubheader = editValue.trim();
          break;
        case "backgroundImage":
          updates.backgroundImage = editValue.trim();
          break;
      }

      onUpdateAgent(updates);
    }
    setEditingField(null);
    setEditValue("");
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpdateAgent) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateAgent({
          backgroundImage: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="h-full flex flex-col relative"
      style={{
        backgroundColor: "#f5f5f5",
        backgroundImage: "none",
        backgroundSize: backgroundImage ? "cover" : "auto",
        backgroundPosition: backgroundImage ? "center" : "0% 0%",
        backgroundRepeat: backgroundImage ? "no-repeat" : "repeat",
      }}
    >
      <div
        className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: backgroundImage ? "rgba(245, 245, 245, 0.95)" : "#f5f5f5",
          backdropFilter: backgroundImage ? "blur(10px)" : "none",
        }}
      >
        <div className="flex items-center justify-center flex-1">
          {brandName ? (
            <button
              onClick={() => handleEditField("brandName", brandName)}
              className="text-neutral-900 text-sm tracking-wider hover:opacity-70 transition-opacity cursor-pointer"
            >
              {brandName}
            </button>
          ) : (
            <button
              onClick={() => handleEditField("brandName", "")}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div className="w-6 h-6 rounded-full bg-neutral-200 border border-dashed border-neutral-300 flex items-center justify-center">
                <span className="text-neutral-400 text-xs">●</span>
              </div>
              <span className="text-neutral-400 text-xs">Brand Name</span>
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 transition-colors text-neutral-600 hover:text-neutral-900"
            aria-label="Back to home"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto relative"
        style={
          messages.length > 0 && backgroundImage
            ? {
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(4px)",
              }
            : {}
        }
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-full">
            <div className="w-full flex flex-col items-center">
              {heroHeader ? (
                <div
                  className="text-center mb-3 px-2 max-w-2xl cursor-pointer group"
                  onClick={() => handleEditField("heroHeader", heroHeader)}
                >
                  <h1 className="text-neutral-900 mb-2 text-xl sm:text-2xl tracking-wide uppercase leading-tight group-hover:opacity-70 transition-opacity" style={{textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 4px rgba(255,255,255,0.8)"}}>
                    {heroHeader}
                  </h1>
                </div>
              ) : (
                <div className="text-center mb-3 px-2 max-w-2xl">
                  <button
                    onClick={() => handleEditField("heroHeader", "")}
                    className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">1</span>
                    </div>
                    <p className="text-neutral-400 text-xs">Hero header will appear here</p>
                  </button>
                </div>
              )}

              {heroSubheader ? (
                <div
                  className="text-center mb-6 sm:mb-8 px-2 max-w-2xl cursor-pointer group"
                  onClick={() => handleEditField("heroSubheader", heroSubheader)}
                >
                  <p className="text-neutral-700 text-xs sm:text-sm group-hover:opacity-70 transition-opacity" style={{textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 4px rgba(255,255,255,0.8)"}}>
                    {heroSubheader}
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6 sm:mb-8 px-2 max-w-2xl">
                  <button
                    onClick={() => handleEditField("heroSubheader", "")}
                    className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">2</span>
                    </div>
                    <p className="text-neutral-400 text-xs">Subheader will appear here</p>
                  </button>
                </div>
              )}

              {productPills.length > 0 || products.length > 0 ? (
                <div className="w-full mb-6 px-4 min-h-[160px]">
                  <div className="max-w-[500px] mx-auto overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 sm:gap-4 items-start justify-start">
                      {displayPills.slice(0, 5).map((pill, index) => (
                        <button
                          key={`pill-${index}-${pill.name}`}
                          type="button"
                          onClick={() => handleSuggestionClick(`Show me ${pill.name}`)}
                          className="flex flex-col items-center gap-2 group w-16 sm:w-20 flex-shrink-0"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-neutral-50 border-2 border-neutral-300 transition-all group-hover:shadow-lg group-hover:scale-105">
                            <ImageWithFallback
                              src={pill.image}
                              alt={pill.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-neutral-900 text-center w-full block leading-tight">
                            {pill.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full mb-6 px-4 min-h-[160px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                      <span className="text-neutral-400 text-sm">3</span>
                    </div>
                    <p className="text-neutral-400 text-xs">Product categories will appear here</p>
                  </div>
                </div>
              )}

              {!backgroundImage &&
                heroHeader &&
                heroSubheader &&
                (products.length > 0 || productPills.length > 0) && (
                  <div className="w-full mb-6 px-4 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                          <span className="text-neutral-400 text-sm">4</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 flex items-center justify-center transition-colors"
                            title="Upload from computer"
                          >
                            <Upload className="w-4 h-4 text-neutral-600" />
                          </button>
                          <button
                            onClick={() => handleEditField("backgroundImage", "")}
                            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 flex items-center justify-center transition-colors"
                            title="Add image URL"
                          >
                            <LinkIcon className="w-4 h-4 text-neutral-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-neutral-400 text-xs">Background image (optional)</p>
                    </div>
                  </div>
                )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />

              <div className="w-full px-4 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                  <div className="bg-[#2a2a2a] rounded-2xl p-1.5 shadow-lg">
                    <div className="flex items-end gap-1.5">
                      <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="How can I help you"
                        rows={1}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none text-white placeholder:text-neutral-500 px-3 py-2 sm:px-4 sm:py-3 rounded-xl resize-none focus:outline-none min-h-[40px] sm:min-h-[48px] max-h-[120px] disabled:opacity-50 text-xs sm:text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                        style={{ height: "auto" }}
                        onInput={(e) => {
                          const target = e.target;
                          target.style.height = "auto";
                          target.style.height = target.scrollHeight + "px";
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!prompt.trim() || isLoading}
                        className={`${
                          prompt.trim() && !isLoading
                            ? "bg-white/20 hover:bg-white/30"
                            : "bg-neutral-700"
                        } disabled:cursor-not-allowed text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg transition-all hover:scale-105 disabled:hover:scale-100 flex-shrink-0`}
                      >
                        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3 sm:px-4 pt-3 pb-24">
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.type === "text" || !message.type ? (
                    <div
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                          message.role === "user"
                            ? "bg-[#2a2a2a] text-white"
                            : "bg-white text-neutral-900 border border-neutral-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-xs sm:text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : message.type === "products" && message.products ? (
                    <div className="space-y-2">
                      {message.content && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 bg-white text-neutral-900 border border-neutral-200">
                            <p className="text-xs sm:text-sm">{message.content}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-start">
                        <div className="max-w-full">
                          <ProductCarousel
                            products={message.products}
                            onProductClick={handleProductClick}
                          />
                        </div>
                      </div>
                    </div>
                  ) : message.type === "product-detail" && message.productDetail ? (
                    <div className="flex justify-start">
                      <ProductDetail product={message.productDetail} onBuyNow={handleBuyNow} />
                    </div>
                  ) : message.type === "checkout" && message.checkoutProduct ? (
                    <div className="flex justify-start w-full">
                      <CheckoutCard
                        product={message.checkoutProduct.product}
                        initialQuantity={message.checkoutProduct.quantity}
                        initialSize={message.checkoutProduct.size}
                        brandName={brandName}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 bg-white border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div
          className="px-3 sm:px-4 py-3 border-t flex-shrink-0"
          style={{
            backgroundColor: backgroundImage ? "rgba(0, 0, 0, 0.9)" : "#f5f5f5",
            borderColor: backgroundImage ? "rgba(255, 255, 255, 0.1)" : "#e5e5e5",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="bg-[#2a2a2a] rounded-2xl p-1.5 shadow-lg">
                <div className="flex items-end gap-1.5">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none text-white placeholder:text-neutral-500 px-3 py-2 sm:px-4 sm:py-3 rounded-xl resize-none focus:outline-none min-h-[40px] sm:min-h-[48px] max-h-[120px] disabled:opacity-50 text-xs sm:text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const target = e.target;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    className={`${
                      prompt.trim() && !isLoading
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-neutral-700"
                    } disabled:cursor-not-allowed text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg transition-all hover:scale-105 disabled:hover:scale-100 flex-shrink-0`}
                  >
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-neutral-900 mb-2">
                Edit{" "}
                {editingField === "brandName"
                  ? "Brand Name"
                  : editingField === "heroHeader"
                    ? "Hero Header"
                    : editingField === "heroSubheader"
                      ? "Subheader"
                      : "Background Image URL"}
              </h3>
              <p className="text-xs text-neutral-500">
                {editingField === "backgroundImage" ? "Enter image URL" : "Enter text"}
              </p>
            </div>

            {editingField === "backgroundImage" ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5436] text-sm text-neutral-900 placeholder:text-neutral-400"
                autoFocus
              />
            ) : editingField === "brandName" ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter brand name..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5436] text-sm text-neutral-900 placeholder:text-neutral-400"
                autoFocus
              />
            ) : (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={
                  editingField === "heroHeader" ? "Enter hero header..." : "Enter subheader..."
                }
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5436] resize-none text-sm !text-neutral-900 placeholder:text-neutral-400"
                autoFocus
              />
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingField(null);
                  setEditValue("");
                }}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors text-sm text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                disabled={!editValue.trim()}
                className="flex-1 px-4 py-2 bg-[#ff5436] text-white rounded-xl hover:bg-[#ff5436]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}