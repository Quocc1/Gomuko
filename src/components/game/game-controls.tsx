import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, RotateCcw, Flag, ArrowLeft } from "lucide-react";

interface GameControlsProps {
  gameOver: boolean;
  aiThinking: boolean;
  onBackToMenu: () => void;
  onSurrender: () => void;
  onReset: () => void;
  onOpenConfig: () => void;
  onRedo: () => void;
  canRedo: boolean;
  canReset: boolean;
  canConfig: boolean;
  canSurrender: boolean;
}

export function GameControls({
  gameOver,
  aiThinking,
  onBackToMenu,
  onSurrender,
  onReset,
  onOpenConfig,
  onRedo,
  canRedo,
  canReset,
  canConfig,
  canSurrender,
}: GameControlsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant="outline"
        onClick={onBackToMenu}
        className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button
        variant="outline"
        onClick={onReset}
        disabled={!canReset || aiThinking}
        className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
      <Button
        variant="outline"
        onClick={onRedo}
        disabled={!canRedo || aiThinking}
        className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4 rotate-180" />
        Undo
      </Button>
      <Button
        variant="outline"
        onClick={onSurrender}
        disabled={!canSurrender || gameOver || aiThinking}
        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 disabled:opacity-50"
      >
        <Flag className="h-4 w-4" />
        Surrender
      </Button>
      <Button
        variant="outline"
        onClick={onOpenConfig}
        disabled={!canConfig || aiThinking}
        className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 disabled:opacity-50"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>
    </div>
  );
}
