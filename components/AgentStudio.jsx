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

  const handleSendMessage = () => {
    if (!editPrompt.trim()) return;

    const lowerPrompt = editPrompt.toLowerCase();

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: editPrompt,
      timestamp: new Date(),
    };

    let aiResponse = "";
    let updates = {};
    let nextStep = conversationStep;

    if (isEmptyAgent || conversationStep < 5) {
      if (conversationStep === 0) {
        const words = editPrompt.split(" ");
        const capitalizedWords = words.filter(
          (w) => w[0] && w[0] === w[0].toUpperCase() && w.length > 1,
        );
        const brandName = capitalizedWords.slice(-1)[0] || "Your Brand";

        updates.brandName = brandName;
        updates.agentType =
          lowerPrompt.includes("ecommerce") || lowerPrompt.includes("store")
            ? "eCommerce"
            : "Business";
        aiResponse = `Great! ${brandName} sounds perfect. ✨\n\nNow let's create your hero section:\n• What's your main headline? (e.g., "Premium Fashion for Modern Living")\n• What's your subheader? (e.g., "20% off - Limited Time")`;
        nextStep = 1;
      } else if (conversationStep === 1) {
        const lines = editPrompt.split("\n").filter((l) => l.trim());
        updates.heroHeader = lines[0]?.trim() || editPrompt.trim();
        updates.heroSubheader = lines[1]?.trim() || "";
        aiResponse = `Perfect! Your hero section is set. 🎯\n\nNow add your products:\nShare product names and prices\n\nExample: "T-Shirt $29, Hoodie $65, Cap $15"`;
        nextStep = 2;
      } else if (conversationStep === 2) {
        const productMatches = Array.from(
          editPrompt.matchAll(
            /([A-Za-z][A-Za-z0-9\s&'-]*?)(?:\s*:?\s*\$?\s*)(\d+(?:\.\d{2})?)/g,
          ),
        );
        const newProducts = [];

        productMatches.forEach((match, index) => {
          const name = match[1].trim();
          const price = parseFloat(match[2]);
          const id = `product-${Date.now()}-${index}`;
          const image = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400";
          newProducts.push({ id, name, price, image });
        });

        const newPills = newProducts.map((product) => ({
          name: product.name,
          image: product.image,
        }));

        updates.products = newProducts;
        updates.productPills = newPills;
        aiResponse = `Excellent! ${newProducts.length} products added. 🛍️\n\nNext, let's set a background image for your agent:\nPaste an image URL or type "skip" for default background\n\nExample: https://images.unsplash.com/photo-...`;
        nextStep = 3;
      } else if (conversationStep === 3) {
        if (
          lowerPrompt === "skip" ||
          lowerPrompt.includes("default") ||
          lowerPrompt.includes("no background")
        ) {
          updates.backgroundImage = "";
        } else if (lowerPrompt.includes("http")) {
          const urlMatch = editPrompt.match(/(https?:\/\/[^\s]+)/);
          updates.backgroundImage = urlMatch ? urlMatch[1] : "";
        } else {
          updates.backgroundImage = "";
        }

        aiResponse = `Great! Background set. 🎨\n\nLast step - choose your agent's tone:\n• Friendly\n• Professional\n• Casual\n• Luxury`;
        nextStep = 4;
      } else if (conversationStep === 4) {
        let tone = "friendly";
        if (lowerPrompt.includes("professional")) tone = "professional";
        else if (lowerPrompt.includes("casual")) tone = "casual";
        else if (lowerPrompt.includes("luxury")) tone = "luxury";

        updates.salesTone = tone;
        aiResponse = `🎉 Congratulations! Your ${agentData.brandName} agent is ready!\n\nYour agent URL: 31labs.com/${agentData.brandName?.toLowerCase().replace(/\s/g, "-")}\n\nYou can continue editing anytime using prompts like:\n• "hero: New Text"\n• "add product pill Accessories"\n• "make it more professional"`;
        nextStep = 5;
      }
    } else {
      if (
        lowerPrompt.includes("hero") &&
        !lowerPrompt.includes("subheader") &&
        !lowerPrompt.includes("subtitle")
      ) {
        const match = editPrompt.match(/hero.*?(?:to|:|is|=)?\s*(.+?)$/i);
        if (match) {
          const newText = match[1].replace(/^["']|["']$/g, "").trim();
          if (newText && newText.length > 0) {
            updates.heroHeader = newText;
            aiResponse = `✅ ${agentData.heroHeader ? "Updated" : "Added"} hero header to "${newText}"`;
          }
        }
        if (!aiResponse) {
          aiResponse =
            "I can update the hero text. Try: 'hero Your New Text' or 'add hero: Premium Collection'";
        }
      } else if (
        lowerPrompt.includes("subheader") ||
        lowerPrompt.includes("subtitle") ||
        lowerPrompt.includes("sub header") ||
        lowerPrompt.includes("sub-header")
      ) {
        const match = editPrompt.match(
          /(?:subheader|subtitle|sub[\s-]?header).*?(?:to|:|is|=)?\s*(.+?)$/i,
        );
        if (match) {
          const newText = match[1].replace(/^["']|["']$/g, "").trim();
          if (newText && newText.length > 0) {
            updates.heroSubheader = newText;
            aiResponse = `✅ ${agentData.heroSubheader ? "Updated" : "Added"} subheader to "${newText}"`;
          }
        }
        if (!aiResponse) {
          aiResponse =
            "I can update the subheader. Try: 'subheader Your New Text' or 'add subheader: Discover our collection'";
        }
      } else if (lowerPrompt.includes("brand")) {
        const match = editPrompt.match(/brand.*?(?:to|:|is|=)?\s*(.+?)$/i);
        if (match) {
          const newText = match[1].replace(/^["']|["']$/g, "").trim();
          if (newText && newText.length > 0) {
            updates.brandName = newText;
            aiResponse = `✅ Updated brand name to "${newText}"`;
          }
        }
        if (!aiResponse) {
          aiResponse =
            "I can update the brand name. Try: 'brand YourBrand' or 'brand: LUXE'";
        }
      } else if (
        (lowerPrompt.includes("add") && lowerPrompt.includes("product")) ||
        (lowerPrompt.includes("product") && lowerPrompt.includes("pill")) ||
        (lowerPrompt.includes("add") && lowerPrompt.includes("category"))
      ) {
        const match =
          editPrompt.match(/(?:add|pill|category).*?["'](.+?)["']/i) ||
          editPrompt.match(/(?:add|pill|category)\s+(\w+.*?)$/i);
        if (match) {
          const newPillName = match[1].trim();
          const newPill = {
            name: newPillName,
            image:
              agentData.productPills[0]?.image ||
              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400",
          };
          updates.productPills = [...(agentData.productPills || []), newPill];
          aiResponse = `✅ Added "${newPillName}" to product pills`;
        } else {
          aiResponse =
            "I can add product pills. Try: 'add product pill Hoodies' or 'add category Accessories'";
        }
      } else if (
        lowerPrompt.includes("tone") ||
        lowerPrompt.includes("friendly") ||
        lowerPrompt.includes("professional") ||
        lowerPrompt.includes("casual")
      ) {
        let tone = "";
        if (lowerPrompt.includes("friendly")) tone = "friendly";
        else if (lowerPrompt.includes("professional")) tone = "professional";
        else if (lowerPrompt.includes("casual")) tone = "casual";

        if (tone) {
          updates.salesTone = tone;
          aiResponse = `✅ Updated sales tone to ${tone}`;
        } else {
          aiResponse =
            "I can update the tone. Try: 'make it more friendly' or 'professional tone'";
        }
      } else {
        aiResponse = `I can help you:\n• "brand: YourBrand" - Change brand name\n• "hero: Your New Hero" - Add/change hero text\n• "subheader: Your subtitle" - Add/change subheader\n• "add product pill Hoodies" - Add product category\n• "make it friendly" - Change tone`;
      }
    }

    if (Object.keys(updates).length > 0 && onUpdateAgent) {
      onUpdateAgent(updates);
    }

    setConversationStep(nextStep);

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage, aiMessage]);
    setEditPrompt("");
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