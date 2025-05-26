'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CpuIcon } from "lucide-react";

interface SinglePlayerCardProps {
  onPlay: () => void;
}

export function SinglePlayerCard({ onPlay }: SinglePlayerCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow w-full md:w-[300px] h-[250px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 text-xl">
          <CpuIcon className="h-6 w-6" />
          Single Player
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-blue-600 mb-4 text-sm">Play against our AI opponent with adjustable difficulty levels.</p>
        <div className="mt-auto">
          <button
            onClick={onPlay}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-base font-semibold"
          >
            Play vs AI
          </button>
        </div>
      </CardContent>
    </Card>
  );
} 