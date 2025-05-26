import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GameRules, Player } from "@/types";
import { BOARD_SIZES } from "@/constants/index";

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardSize: number;
  onBoardSizeChange: (size: number) => void;
  gameRules: GameRules;
  onRulesChange: (rules: GameRules) => void;
  isAIGame: boolean;
  aiPlayer: Player;
  onAiPlayerChange: (player: Player) => void;
  onReset: () => void;
}

export function ConfigDialog({
  open,
  onOpenChange,
  boardSize,
  onBoardSizeChange,
  gameRules,
  onRulesChange,
}: ConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game Rules</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="board-size" className="font-medium">
                Board Size
              </Label>
              <select
                id="board-size"
                className="w-full mt-1 rounded-md border border-gray-300 p-2"
                value={boardSize}
                onChange={(e) => onBoardSizeChange(Number(e.target.value))}
              >
                {BOARD_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="exactly-five" className="font-medium">
                Exactly Five Rule
              </Label>
              <p className="text-sm text-gray-500">
                Only exactly 5 stones in a row wins (more than 5 is invalid)
              </p>
            </div>
            <Switch
              id="exactly-five"
              checked={gameRules.exactlyFiveRule}
              onCheckedChange={(checked) =>
                onRulesChange({ ...gameRules, exactlyFiveRule: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="no-blocked-wins" className="font-medium">
                No Blocked Wins Rule
              </Label>
              <p className="text-sm text-gray-500">
                Five in a row with both ends blocked is invalid
              </p>
            </div>
            <Switch
              id="no-blocked-wins"
              checked={gameRules.noBlockedWinsRule}
              onCheckedChange={(checked) =>
                onRulesChange({ ...gameRules, noBlockedWinsRule: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
