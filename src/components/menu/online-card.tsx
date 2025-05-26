'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function OnlineCard() {
  const router = useRouter();

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow w-full md:w-[300px] h-[250px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 text-xl">
          <GlobeIcon className="h-6 w-6" />
          Online Play
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-purple-600 mb-4 text-sm">Play against players from around the world.</p>
        <div className="mt-auto space-y-3">
          <button
            onClick={() => router.push('/play/online/create')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-base font-semibold"
          >
            Create Room
          </button>
          <button
            onClick={() => router.push('/play/online/join')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-base font-semibold"
          >
            Join Room
          </button>
        </div>
      </CardContent>
    </Card>
  );
} 