import React from 'react';
import { Card } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function MetricCard({ title, value, change, isPositive }) {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-bold text-foreground truncate max-w-[60%]">{value}</h3>
        <div className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${
          isPositive ? 'text-[#22C55E] bg-green-50' : 'text-[#EF4444] bg-red-50'
        }`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {change}
        </div>
      </div>
    </Card>
  );
}
