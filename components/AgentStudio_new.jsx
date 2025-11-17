import { useState } from "react";
import { supabase } from "@/lib/supabase";
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
