import { useState } from "react";
import {
  User,
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
  X,
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
  agentData,
  onBack,
  onUpdateAgent,
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [editPrompt, setEditPrompt] = useState("");
  const [conversationStep, setConversationStep] = useState(0);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const isEmptyAgent =
    !agentData.brandName &&
    !agentData.heroHeader &&
    agentData.products.length === 0;

  const isAgentReady =
    conversationStep >= 4 &&
    !!(
      agentData.brandName &&
      agentData.heroHeader &&
      agentData.heroSubheader &&
      agentData.products.length > 0
    );

  const [chatMessages, setChatMessages] = useState(
    isEmptyAgent
      ? [
          {
            id: "1",
            role: "assistant",
            content: `Welcome to 31Labs! 🚀 Let's build your business agent together.\n\nFirst, tell me about your business:\n• What type of business is it? (e.g., eCommerce store, service business, portfolio)\n• What's your brand name?`,
            timestamp: new Date(),
          },
        ]
      : [
          {
            id: "1",
            role: "assistant",
            content:
              "Perfect! 🎉 Your agent is ready. You can now publish it or continue editing using prompts below.",
            timestamp: new Date(),
          },
        ],
  );

  const handleSendMessage = async () => {
  if (!editPrompt.trim()) return;

  const userMessage = {
    id: Date.now().toString(),
    role: "user",
    content: editPrompt,
    timestamp: new Date(),
  };

  setChatMessages([...chatMessages, userMessage]);
  setEditPrompt("");

  try {
    // Build context for Claude about current build stage
    let buildContext = "";
    if (conversationStep === 0) {
      buildContext = "User is starting to build their agent. Extract business type and brand name from their message.";
    } else if (conversationStep === 1) {
      buildContext = "User is providing hero header and subheader. Parse both lines.";
    } else if (conversationStep === 2) {
      buildContext = "User is adding products with names and prices. Parse all products mentioned.";
    } else if (conversationStep === 3) {
      buildContext = "User is providing background image URL or choosing to skip.";
    } else if (conversationStep === 4) {
      buildContext = "User is selecting sales tone (friendly, professional, casual, luxury).";
    } else {
      buildContext = "Agent is already built. User wants to edit specific elements.";
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: editPrompt,
        agentData: { ...agentData, buildStep: conversationStep },
        conversationHistory: chatMessages.slice(-4),
        buildContext: buildContext
      })
    });

    const data = await response.json();
    
    // Parse and update based on step
    let updates = {};
    let nextStep = conversationStep;

    if (conversationStep === 0) {
      const words = editPrompt.split(" ");
      const capitalizedWords = words.filter(w => w[0] && w[0] === w[0].toUpperCase() && w.length > 1);
      updates.brandName = capitalizedWords.slice(-1)[0] || "Your Brand";
      nextStep = 1;
    } else if (conversationStep === 1) {
      const lines = editPrompt.split("\n").filter(l => l.trim());
      updates.heroHeader = lines[0]?.trim() || editPrompt.trim();
      updates.heroSubheader = lines[1]?.trim() || "";
      nextStep = 2;
    } else if (conversationStep === 2) {
      // Parse products
      const productMatches = Array.from(editPrompt.matchAll(/([A-Za-z][A-Za-z0-9\s&'-]*?)(?:\s*:?\s*[\$£]?\s*)(\d+(?:\.\d{2})?)/g));
      const newProducts = productMatches.map((match, index) => ({
        id: `product-${Date.now()}-${index}`,
        name: match[1].trim(),
        price: parseFloat(match[2]),
        image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400"
      }));
      
      if (newProducts.length > 0) {
        updates.products = newProducts;
        updates.productPills = newProducts.map(p => ({ name: p.name, image: p.image }));
        nextStep = 3;
      }
    } else if (conversationStep === 3) {
      const urlMatch = editPrompt.match(/(https?:\/\/[^\s]+)/);
      updates.backgroundImage = urlMatch ? urlMatch[1] : "";
      nextStep = 4;
    } else if (conversationStep === 4) {
      const lowerPrompt = editPrompt.toLowerCase();
      let tone = "friendly";
      if (lowerPrompt.includes("professional")) tone = "professional";
      else if (lowerPrompt.includes("casual")) tone = "casual";
      else if (lowerPrompt.includes("luxury")) tone = "luxury";
      updates.salesTone = tone;
      nextStep = 5;
    }

    if (Object.keys(updates).length > 0 && onUpdateAgent) {
      onUpdateAgent(updates);
    }

    setConversationStep(nextStep);

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: data.response,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, aiMessage]);
  } catch (error) {
    console.error('Error:', error);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveProduct = (product) => {
    if (onUpdateAgent) {
      const existingProducts = agentData.products || [];
      const existingIndex = existingProducts.findIndex((p) => p.id === product.id);

      let updatedProducts;
      if (existingIndex >= 0) {
        updatedProducts = [...existingProducts];
        updatedProducts[existingIndex] = product;
      } else {
        updatedProducts = [...existingProducts, product];
      }

      const updatedPills = updatedProducts.map((p) => ({
        name: p.name,
        image: p.image,
      }));

      onUpdateAgent({
        products: updatedProducts,
        productPills: updatedPills,
      });
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId) => {
    if (onUpdateAgent) {
      const updatedProducts = agentData.products.filter((p) => p.id !== productId);
      const updatedPills = updatedProducts.map((p) => ({
        name: p.name,
        image: p.image,
      }));

      onUpdateAgent({
        products: updatedProducts,
        productPills: updatedPills,
      });
    }
  };

  const handlePublish = () => {
    if (isAgentReady) {
      const agentUrl = `31labs.com/${agentData.brandName?.toLowerCase().replace(/\s/g, "-")}`;
      window.open(`https://${agentUrl}`, "_blank");
    }
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-neutral-100">
        <div className="bg-neutral-100 px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-neutral-900 font-bold text-2xl">31Labs</div>
              <span className="text-neutral-500 text-xs">BETA*</span>
            </div>

            <div className="flex items-center gap-4">
              <h3 className="text-neutral-900 font-medium">Agent Studio</h3>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-200 transition-colors text-neutral-600 hover:text-neutral-900">
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={onBack}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-200 transition-colors text-neutral-600 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 bg-white border-r border-neutral-200 flex flex-col">
            <div className="flex-1 overflow-y-auto mx-[-14px] my-[0px] mx-[1px] px-[26px] py-[25px]">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex justify-start px-[-10px] mx-[-14px] rounded-[10px] px-[-9px] py-[4px] mx-[-16px] my-[-3px]"
                  >
                    <div
                      className={`w-[92%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-[#2a2a2a] text-white"
                          : "bg-neutral-50 text-neutral-900 border border-neutral-200"
                      }`}
                    >
                      <p
                        className={`text-xs whitespace-pre-wrap ${message.role === "assistant" ? "font-medium" : ""}`}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200">
              <div className="bg-[#2a2a2a] rounded-2xl p-1.5 shadow-lg">
                <div className="flex items-end gap-1.5">
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Any changes?"
                    rows={1}
                    className="flex-1 bg-transparent border-none text-white placeholder:text-neutral-500 px-4 py-3 rounded-xl resize-none focus:outline-none min-h-[48px] max-h-[120px] text-sm"
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const target = e.target;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!editPrompt.trim()}
                    className={`${
                      editPrompt.trim()
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-neutral-700"
                    } disabled:cursor-not-allowed text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-105 disabled:hover:scale-100 flex-shrink-0`}
                  >
                    <ArrowUp className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-neutral-50">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="h-full">
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-neutral-200 h-full">
                  <AgentPreview agentData={agentData} onUpdateAgent={onUpdateAgent} />
                </div>
              </div>
            </div>
          </div>

          <div className="w-20 bg-white border-l border-neutral-200 flex flex-col">
            <div className="flex-1 p-4">
              <nav className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("home")}
                      className={`w-full h-12 flex items-center justify-center rounded-xl transition-colors ${
                        activeTab === "home"
                          ? "bg-[#ff5436] text-white"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Home className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Home</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className={`w-full h-12 flex items-center justify-center rounded-xl transition-colors ${
                        activeTab === "settings"
                          ? "bg-[#ff5436] text-white"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Agent Settings</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("products")}
                      className={`w-full h-12 flex items-center justify-center rounded-xl transition-colors ${
                        activeTab === "products"
                          ? "bg-[#ff5436] text-white"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Products</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("design")}
                      className={`w-full h-12 flex items-center justify-center rounded-xl transition-colors ${
                        activeTab === "design"
                          ? "bg-[#ff5436] text-white"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Palette className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Design</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className={`w-full h-12 flex items-center justify-center rounded-xl transition-colors ${
                        activeTab === "analytics"
                          ? "bg-[#ff5436] text-white"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Analytics</p>
                  </TooltipContent>
                </Tooltip>

                <div className="border-t border-neutral-200 my-4" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsAddProductModalOpen(true)}
                      className="w-full h-12 flex items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Add Products</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-full h-12 flex items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-50 transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Edit Design</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-full h-12 flex items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-50 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Share Preview</p>
                  </TooltipContent>
                </Tooltip>
              </nav>
            </div>

            <div className="p-4 border-t border-neutral-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handlePublish}
                    disabled={!isAgentReady}
                    className={`w-full h-12 flex items-center justify-center rounded-xl transition-all ${
                      isAgentReady
                        ? "bg-[#ff5436] hover:bg-[#ff5436]/90 text-white cursor-pointer"
                        : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    <Rocket className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>
                    {isAgentReady ? "Publish Agent" : "Complete all fields to publish"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => {
            setIsAddProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          editingProduct={editingProduct}
          existingProducts={agentData.products}
        />
      </div>
    </TooltipProvider>
  );
}
export default AgentStudio;