import { Leaf, Calendar, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Cannabis ERP MVP</h1>
              <p className="text-sm text-muted-foreground">40-Day Development Plan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>40 Days</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>3 Teams</span>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Metrc Ready
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
