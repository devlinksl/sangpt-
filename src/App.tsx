import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Explore from "./pages/Explore";
import Help from "./pages/Help";
import { Account } from "./pages/Account";
import { TextSelection } from "./pages/TextSelection";
import ImageGeneration from "./pages/ImageGeneration";
import DeepResearch from "./pages/DeepResearch";
import CreatePodcast from "./pages/CreatePodcast";
import InteractiveQuiz from "./pages/InteractiveQuiz";
import SummarizeText from "./pages/SummarizeText";
import CodeHelper from "./pages/CodeHelper";
import CreativeWriting from "./pages/CreativeWriting";
import Contact from "./pages/Contact";
import EmailWriter from "./pages/EmailWriter";
import VideoScript from "./pages/VideoScript";
import SocialMediaPost from "./pages/SocialMediaPost";
import LanguageTranslator from "./pages/LanguageTranslator";
import MathSolver from "./pages/MathSolver";
import DataAnalyzer from "./pages/DataAnalyzer";
import ResumeBuilder from "./pages/ResumeBuilder";
import BusinessPlan from "./pages/BusinessPlan";
import SEOOptimizer from "./pages/SEOOptimizer";
import MusicComposer from "./pages/MusicComposer";
import RecipeGenerator from "./pages/RecipeGenerator";
import FitnessPlanner from "./pages/FitnessPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/help" element={<Help />} />
              <Route path="/account" element={<Account />} />
              <Route path="/text-selection" element={<TextSelection />} />
              <Route path="/image-generation" element={<ImageGeneration />} />
              <Route path="/deep-research" element={<DeepResearch />} />
              <Route path="/create-podcast" element={<CreatePodcast />} />
              <Route path="/interactive-quiz" element={<InteractiveQuiz />} />
              <Route path="/summarize-text" element={<SummarizeText />} />
              <Route path="/code-helper" element={<CodeHelper />} />
              <Route path="/creative-writing" element={<CreativeWriting />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/email-writer" element={<EmailWriter />} />
              <Route path="/video-script" element={<VideoScript />} />
              <Route path="/social-media-post" element={<SocialMediaPost />} />
              <Route path="/language-translator" element={<LanguageTranslator />} />
              <Route path="/math-solver" element={<MathSolver />} />
              <Route path="/data-analyzer" element={<DataAnalyzer />} />
              <Route path="/resume-builder" element={<ResumeBuilder />} />
              <Route path="/business-plan" element={<BusinessPlan />} />
              <Route path="/seo-optimizer" element={<SEOOptimizer />} />
              <Route path="/music-composer" element={<MusicComposer />} />
              <Route path="/recipe-generator" element={<RecipeGenerator />} />
              <Route path="/fitness-planner" element={<FitnessPlanner />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;