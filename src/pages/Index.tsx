import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { OverviewSection } from "@/components/OverviewSection";
import { TimelineSection } from "@/components/TimelineSection";
import { TeamSection } from "@/components/TeamSection";
import { TechStackSection } from "@/components/TechStackSection";
import { RiskSection } from "@/components/RiskSection";
import { MilestonesSection } from "@/components/MilestonesSection";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
              Teams
            </TabsTrigger>
            <TabsTrigger value="tech" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
              Tech Stack
            </TabsTrigger>
            <TabsTrigger value="risks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
              Risks
            </TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
              Milestones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-fade-in">
            <OverviewSection />
          </TabsContent>

          <TabsContent value="timeline" className="animate-fade-in">
            <TimelineSection />
          </TabsContent>

          <TabsContent value="teams" className="animate-fade-in">
            <TeamSection />
          </TabsContent>

          <TabsContent value="tech" className="animate-fade-in">
            <TechStackSection />
          </TabsContent>

          <TabsContent value="risks" className="animate-fade-in">
            <RiskSection />
          </TabsContent>

          <TabsContent value="milestones" className="animate-fade-in">
            <MilestonesSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
