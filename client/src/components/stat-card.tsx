import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className,
  iconClassName
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn(
            "rounded-full p-3",
            iconClassName || "bg-primary bg-opacity-10"
          )}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm text-neutral-800">{title}</p>
            <h3 className="text-2xl font-semibold">{value}</h3>
          </div>
        </div>
        
        {trend && (
          <div className={cn(
            "mt-3 text-xs flex items-center",
            trend.isPositive ? "text-success" : "text-error"
          )}>
            {trend.isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
