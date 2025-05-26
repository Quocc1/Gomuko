"use client";
import Board from "@/components/board";
import { PLAYER } from "@/types";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CpuIcon } from "lucide-react";

export default function AIGamePage() {
  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Board isAIGame={true} aiPlayer={PLAYER.WHITE} />
          </div>
        </div>
      </div>
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen w-full">
      <Card className="min-h-screen w-full bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CpuIcon className="h-6 w-6" />
            AI Game
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-green-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
            </div>
            <p className="text-green-800 font-medium">Loading AI Game...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
