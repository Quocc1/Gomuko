import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Player, PLAYER } from "@/types";

interface WinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winner: Player | null;
  onPlayAgain: () => void;
}

export function WinDialog({
  open,
  onOpenChange,
  winner,
  onPlayAgain,
}: WinDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Game Over!</AlertDialogTitle>
          <AlertDialogDescription>
            {winner === PLAYER.BLACK ? "Black" : "White"} player wins!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Close
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onPlayAgain}
            className="bg-green-500 hover:bg-green-600"
          >
            Play Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
