import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Home,
  Settings,
  Package,
  Palette,
  BarChart3,
  Rocket,
  Plus,
  Share2,
  Edit,
  ArrowUp,
  RotateCcw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AgentPreview } from "./AgentPreview";
import { AddProductModal } from "./AddProductModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function AgentStudio({
  initialChatHistory = [],
  agentData: initialAgentData,
  onBack,
  onUpdateAgent,
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [editPrompt, setEditPrompt] = useState("");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Initialize agentData with default values
  const [agentData, setAgentData] = useState({
    brandName: "",
    heroHeader: "",
    heroSubheader: "",
    products: [],
    productPills: [],
    backgroundImage: "",
    salesTone: "friendly",
    agentType: "eCommerce",
    ...initialAgentData
  });
  
  const [chatMessages, setChatMessages] = useState(
    initialChatHistory.length > 0 ? initialChatHistory : [
      {
        id: "1",
        role: "assistant",
        content: "Welcome to 31Labs! 🚀 I'm here to help you build your business agent.\n\nTell me about your business idea - what would you like to sell or what service do you want to offer?",
        timestamp: new Date(),
      },
    ]
  );

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load existing context if available
        loadUserContext(user.id);
      }
    };
    getUser();
  }, []);

  // Load user's existing context
  const loadUserContext = async (uid) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/builder/context/${uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.context) {
          // Update agent data from saved context
          const ctx = data.context;
          setAgentData({
            brandName: ctx.brand_name || "",
            heroHeader: ctx.hero_header || "",
            heroSubheader: ctx.hero_subheader || "",
            products: ctx.products || [],
            productPills: ctx.product_pills || [],
            backgroundImage: ctx.background_image || "",
            salesTone: ctx.sales_tone || "friendly",
            agentType: ctx.agent_type || "eCommerce",
          });
          
          // Restore conversation history
          if (ctx.conversation_history && ctx.conversation_history.length > 0) {
            setChatMessages(ctx.conversation_history.map((msg, idx) => ({
              id: idx.toString(),
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || Date.now())
            })));
          }
        }
      }
    } catch (error) {
      console.error("Error loading context:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!editPrompt.trim() || !userId || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: editPrompt,
      timestamp: new Date(),
    };

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessage]);
    setEditPrompt("");
    setIsLoading(true);

    try {
      // Call the new AI builder endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/builder/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: editPrompt
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add AI response to chat
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiMessage]);

        // Update agent data with new context
        if (data.context) {
          setAgentData(data.context);
          // Notify parent component of updates
          if (onUpdateAgent) {
            onUpdateAgent(data.context);
          }
        }

        // If specific fields were updated, you could highlight them
        if (data.updated_fields) {
          // Optional: Add visual feedback for updated fields
          console.log("Updated fields:", data.updated_fields);
        }
      } else {
        // Handle error
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I had trouble understanding that. Could you try rephrasing?",
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having connection issues. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!userId) return;
    
    const confirmed = window.confirm("Are you sure you want to start over? This will clear your current progress.");
    if (!confirmed) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/builder/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (response.ok) {
        // Reset local state
        setAgentData({
          brandName: "",
          heroHeader: "",
          heroSubheader: "",
          products: [],
          productPills: [],
          backgroundImage: "",
          salesTone: "friendly",
          agentType: "eCommerce",
        });
        
        setChatMessages([
          {
            id: "1",
            role: "assistant",
            content: "Let's start fresh! 🚀 Tell me about your business idea - what would you like to sell or what service do you want to offer?",
            timestamp: new Date(),
          }
        ]);
      }
    } catch (error) {
      console.error("Error resetting:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isAgentReady = !!(
    agentData.brandName &&
    agentData.heroHeader &&
    agentData.products.length > 0
  );

  const handlePublish = () => {
    if (!isAgentReady) {
      alert("Please complete your agent setup before publishing.");
      return;
    }
    
    const agentUrl = `31labs.com/${agentData.brandName?.toLowerCase().replace(/\s+/g, "-")}`;
    alert(`🎉 Your agent will be published at: ${agentUrl}`);
  };

  const handleAddProduct = (newProduct) => {
    const updatedProducts = [...agentData.products, {
      id: `product-${Date.now()}`,
      ...newProduct
    }];
    
    const updatedPills = [...agentData.productPills, {
      name: newProduct.name,
      image: newProduct.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400"
    }];
    
    setAgentData(prev => ({
      ...prev,
      products: updatedProducts,
      productPills: updatedPills
    }));
    
    if (onUpdateAgent) {
      onUpdateAgent({
        ...agentData,
        products: updatedProducts,
        productPills: updatedPills
      });
    }
  };

  const handleEditProduct = (editedProduct) => {
    const updatedProducts = agentData.products.map(p =>
      p.id === editedProduct.id ? editedProduct : p
    );
    
    setAgentData(prev => ({
      ...prev,
      products: updatedProducts
    }));
    
    if (onUpdateAgent) {
      onUpdateAgent({
        ...agentData,
        products: updatedProducts
      });
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Sidebar with Tabs */}
      <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 gap-6 border-r border-zinc-800">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab("home")}
                className={`p-3 rounded-lg transition-colors ${
                  activeTab === "home"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Home size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Agent Home</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab("products")}
                className={`p-3 rounded-lg transition-colors ${
                  activeTab === "products"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Package size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Products</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab("style")}
                className={`p-3 rounded-lg transition-colors ${
                  activeTab === "style"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Palette size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Style & Theme</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`p-3 rounded-lg transition-colors ${
                  activeTab === "analytics"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <BarChart3 size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Analytics</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="mt-auto flex flex-col gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`p-3 rounded-lg transition-colors ${
                    activeTab === "settings"
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Settings size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button
            onClick={handleLogout}
            className="p-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* AI Builder Chat Panel */}
      <div className="w-96 bg-zinc-900 flex flex-col border-r border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">AI Builder</h2>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Start Over"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <p className="text-sm text-zinc-400">
            Build your agent with natural language
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-100 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse delay-75"></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse delay-150"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-zinc-800">
          <div className="relative">
            <Input
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your business or make changes..."
              className="pr-12 py-6 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              className="absolute right-2 top-2 p-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
              disabled={isLoading || !editPrompt.trim()}
            >
              <ArrowUp size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="flex-1 bg-zinc-950 relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            onClick={() => setIsAddProductModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white gap-2"
          >
            <Plus size={16} />
            Add Product
          </Button>
          
          {isAgentReady && (
            <Button
              onClick={handlePublish}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              <Rocket size={16} />
              Publish Agent
            </Button>
          )}
        </div>

        <AgentPreview 
          agentData={agentData} 
          onUpdateAgent={(updates) => {
            setAgentData(prev => ({ ...prev, ...updates }));
            if (onUpdateAgent) {
              onUpdateAgent({ ...agentData, ...updates });
            }
          }}
        />
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setEditingProduct(null);
        }}
        onAdd={editingProduct ? handleEditProduct : handleAddProduct}
        editingProduct={editingProduct}
      />
    </div>
  );
}
