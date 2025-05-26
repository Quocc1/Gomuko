'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon } from "lucide-react";

interface TwoPlayersCardProps {
  onPlay: () => void;
}

export function TwoPlayersCard({ onPlay }: TwoPlayersCardProps) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow w-full md:w-[300px] h-[250px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 text-xl">
          <UserIcon className="h-6 w-6" />
          Two Players
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-green-600 mb-4 text-sm">Play against a friend on the same device.</p>
        <div className="mt-auto">
          <button
            onClick={onPlay}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-base font-semibold"
          >
            Play Local
          </button>
        </div>
      </CardContent>
    </Card>
  );
} 