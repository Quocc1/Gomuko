/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useContext } from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { PLAYER, Position, GameState } from "@/types";
import { createEmptyBoard, checkWin } from "@/components/game/game-logic";
import { GameBoard } from "@/components/game/game-board";
import { GameInfo } from "@/components/game/game-info";
import { GameControls } from "@/components/game/game-controls";
import { ConfigDialog } from "@/components/dialogs/config-dialog";
import { SurrenderDialog } from "@/components/dialogs/surrender-dialog";
import { WinDialog } from "@/components/dialogs/win-dialog";
import { useGameConfig } from "@/store/game-config";
import useSound from "use-sound";
import AblyContext from "@/contexts/ably-context";
import { ROLE } from "@/types";
import { useDeleteRoom } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface GomokuBoardProps {
  roomId: string;
  role: (typeof ROLE)[keyof typeof ROLE];
  channel?: any;
  members: any[];
}

export default function GomokuBoard({
  roomId,
  role,
  channel,
  members,
}: GomokuBoardProps) {
  const router = useRouter();
  const client = useContext(AblyContext);
  const { boardSize, gameRules, setBoardSize, setGameRules } = useGameConfig();
  const [isWaiting, setIsWaiting] = useState(false);

  // Sound hooks
  const [playMove] = useSound("/sounds/move.mp3", { volume: 0.5 });
  const [playWin] = useSound("/sounds/win.mp3", { volume: 0.5 });

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(boardSize),
    currentPlayer: PLAYER.BLACK,
    winner: null,
    winningCells: [],
    gameOver: false,
    lastMove: null,
  });

  // UI state
  const [showConfirmSurrender, setShowConfirmSurrender] = useState(false);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [hoverPosition] = useState<Position | null>(null);
  const [showPlayAgainRequest, setShowPlayAgainRequest] = useState(false);
  const [playAgainRequested, setPlayAgainRequested] = useState(false);

  // Check for waiting state
  useEffect(() => {
    const players = members.filter(
      (m) =>
        m.data?.role === ROLE.PLAYER_BLACK ||
        m.data?.role === ROLE.PLAYER_WHITE
    );
    const playerCount = players.length;
    console.log("[GomokuBoard] Current members:", members);
    console.log("[GomokuBoard] Filtered players:", players);
    console.log("[GomokuBoard] Player count:", playerCount);

    if (playerCount === 1) {
      console.log("[GomokuBoard] Waiting for another player...");
      setIsWaiting(true);
      // Reset game state when opponent leaves
      setGameState({
        board: createEmptyBoard(boardSize),
        currentPlayer: PLAYER.BLACK,
        winner: null,
        winningCells: [],
        gameOver: false,
        lastMove: null,
      });
      setShowWinDialog(false);
      setShowPlayAgainRequest(false);
      setPlayAgainRequested(false);
    } else if (playerCount >= 2) {
      console.log("[GomokuBoard] Game is ready to play!");
      setIsWaiting(false);
    }
  }, [members, boardSize]);

  // Subscribe to presence updates
  useEffect(() => {
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);
    if (!gameChannel) return;

    let isSubscribed = true;

    const initPresence = async () => {
      try {
        console.log("[GomokuBoard] Initializing presence...");
        // Wait for channel to be ready
        if (gameChannel.state !== "attached") {
          console.log("[GomokuBoard] Waiting for channel to attach...");
          await gameChannel.attach();
        }

        // Enter presence with role
        console.log("[GomokuBoard] Entering presence with role:", role);
        await gameChannel.presence.enter({ role });

        // Wait a moment for presence to be registered
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Get initial presence data
        const members = await gameChannel.presence.get();
        console.log("[GomokuBoard] Initial presence members:", members);
        
        if (!isSubscribed) return;

        const players = members.filter(
          (m: any) =>
            m.data?.role === ROLE.PLAYER_BLACK ||
            m.data?.role === ROLE.PLAYER_WHITE
        );
        const playerCount = players.length;
        console.log("[GomokuBoard] Initial player count:", playerCount);

        if (playerCount === 0) {
          console.log("[GomokuBoard] No players in room, cleaning up...");
          await cleanupRoom();
          router.push("/");
          return;
        }

        if (playerCount === 1) {
          console.log("[GomokuBoard] Waiting for another player...");
          setIsWaiting(true);
        } else if (playerCount >= 2) {
          console.log("[GomokuBoard] Game is ready to play!");
          setIsWaiting(false);
        }

        // If we're a spectator, request current game state
        if (role === ROLE.SPECTATOR) {
          console.log("[GomokuBoard] Requesting current game state as spectator");
          gameChannel.publish("request-game-state", {
            requesterId: client?.auth.clientId,
          });
        }
      } catch (error) {
        console.error("[GomokuBoard] Error initializing presence:", error);
      }
    };

    const handlePresenceUpdate = async () => {
      if (!isSubscribed) return;
      console.log("[GomokuBoard] Presence update received");
      
      try {
        const members = await gameChannel.presence.get();
        console.log("[GomokuBoard] Presence members:", members);
        
        const players = members.filter(
          (m: any) =>
            m.data?.role === ROLE.PLAYER_BLACK ||
            m.data?.role === ROLE.PLAYER_WHITE
        );
        const playerCount = players.length;
        console.log("[GomokuBoard] Presence player count:", playerCount);

        if (playerCount === 0) {
          console.log("[GomokuBoard] No players left in room, cleaning up...");
          await cleanupRoom();
          router.push("/");
          return;
        }

        if (playerCount === 1) {
          console.log("[GomokuBoard] Opponent left, waiting for new player...");
          setIsWaiting(true);
          // Reset game state when opponent leaves
          setGameState({
            board: createEmptyBoard(boardSize),
            currentPlayer: PLAYER.BLACK,
            winner: null,
            winningCells: [],
            gameOver: false,
            lastMove: null,
          });
          setShowWinDialog(false);
          setShowPlayAgainRequest(false);
          setPlayAgainRequested(false);
        } else if (playerCount >= 2) {
          console.log("[GomokuBoard] Game is ready to play!");
          setIsWaiting(false);
        }
      } catch (error) {
        console.error("[GomokuBoard] Error handling presence update:", error);
      }
    };

    console.log("[GomokuBoard] Setting up presence...");
    initPresence();
    gameChannel.presence.subscribe(handlePresenceUpdate);

    return () => {
      console.log("[GomokuBoard] Cleaning up presence...");
      isSubscribed = false;
      gameChannel.presence.unsubscribe(handlePresenceUpdate);
    };
  }, [channel, client, roomId, boardSize, role, router]);

  // Remove the members prop effect since we're handling it in presence
  useEffect(() => {
    if (members.length > 0) {
      console.log("[GomokuBoard] Members prop updated:", members);
    }
  }, [members]);

  // Subscribe to game state updates
  useEffect(() => {
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);
    if (!gameChannel) return;

    console.log("[GomokuBoard] Setting up game message subscriptions");

    // Subscribe to board updates
    const handleBoardUpdate = (message: any) => {
      console.log("[GomokuBoard] Received board update:", message.data);
      const { board, currentPlayer, lastMove } = message.data;
      setGameState((prev) => ({
        ...prev,
        board,
        currentPlayer,
        lastMove,
      }));
    };

    // Subscribe to game over events
    const handleGameOver = (message: any) => {
      console.log("[GomokuBoard] Received game over:", message.data);
      const { winner, winningCells, lastMove, board } = message.data;
      setGameState((prev) => ({
        ...prev,
        winner,
        winningCells,
        gameOver: true,
        lastMove,
        board: board || prev.board,
        currentPlayer: prev.currentPlayer,
      }));
      setShowWinDialog(true);
      playWin();
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
      });
    };

    // Subscribe to game state requests
    const handleGameStateRequest = (message: any) => {
      console.log("[GomokuBoard] Received game state request:", message.data);
      const { requesterId } = message.data;
      if (requesterId !== client?.auth.clientId) {
        // Send current game state to the requester
        gameChannel.publish("board-update", {
          board: gameState.board,
          currentPlayer: gameState.currentPlayer,
          lastMove: gameState.lastMove,
        });
      }
    };

    // Subscribe to play again requests
    const handlePlayAgainRequest = (message: any) => {
      console.log("[GomokuBoard] Received play again request:", message.data);
      const { requesterId } = message.data;
      if (requesterId !== client?.auth.clientId) {
        setShowPlayAgainRequest(true);
      }
    };

    // Subscribe to play again responses
    const handlePlayAgainResponse = (message: any) => {
      console.log("[GomokuBoard] Received play again response:", message.data);
      const { accepted, responderId } = message.data;
      if (accepted) {
        // Hide both dialogs when both players agree
        setShowPlayAgainRequest(false);
        setShowWinDialog(false);
        resetGame();
      } else {
        if (responderId === client?.auth.clientId) {
          // If we're the one who declined, clean up and leave
          cleanupAndLeave();
        } else {
          // If we're the one who requested, just reset the play again state
          setPlayAgainRequested(false);
          setShowWinDialog(false);
          alert("Other player declined to play again");
        }
      }
    };

    // Subscribe to all events
    gameChannel.subscribe("board-update", handleBoardUpdate);
    gameChannel.subscribe("game-over", handleGameOver);
    gameChannel.subscribe("play-again-request", handlePlayAgainRequest);
    gameChannel.subscribe("play-again-response", handlePlayAgainResponse);
    gameChannel.subscribe("request-game-state", handleGameStateRequest);

    return () => {
      console.log("[GomokuBoard] Cleaning up game message subscriptions");
      gameChannel.unsubscribe("board-update", handleBoardUpdate);
      gameChannel.unsubscribe("game-over", handleGameOver);
      gameChannel.unsubscribe("play-again-request", handlePlayAgainRequest);
      gameChannel.unsubscribe("play-again-response", handlePlayAgainResponse);
      gameChannel.unsubscribe("request-game-state", handleGameStateRequest);
    };
  }, [channel, client, roomId, playWin, router, gameState]);

  const handleCellClick = (row: number, col: number) => {
    if (
      gameState.board[row][col] !== PLAYER.NONE ||
      gameState.gameOver ||
      (role !== ROLE.PLAYER_BLACK && role !== ROLE.PLAYER_WHITE)
    ) {
      return;
    }

    // Check if it's the player's turn
    const isBlackTurn = gameState.currentPlayer === PLAYER.BLACK;
    const isPlayerBlack = role === ROLE.PLAYER_BLACK;
    if (isBlackTurn !== isPlayerBlack) {
      alert("Not your turn");
      return;
    }

    const newBoard = gameState.board.map((rowArray) => [...rowArray]);
    newBoard[row][col] = gameState.currentPlayer;

    // Update local state immediately to show the move
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      lastMove: { row, col }
    }));

    playMove();

    const winResult = checkWin(
      newBoard,
      row,
      col,
      gameState.currentPlayer,
      boardSize,
      gameRules.exactlyFiveRule,
      gameRules.noBlockedWinsRule
    );

    // Use the channel passed from parent, or fallback to creating one
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);

    if (winResult.isWin) {
      gameChannel?.publish("game-over", {
        winner: gameState.currentPlayer,
        winningCells: winResult.winningCells,
        lastMove: { row, col },
        board: newBoard,
      });
    } else {
      gameChannel?.publish("board-update", {
        board: newBoard,
        currentPlayer:
          gameState.currentPlayer === PLAYER.BLACK
            ? PLAYER.WHITE
            : PLAYER.BLACK,
        lastMove: { row, col },
      });
    }
  };

  const requestPlayAgain = () => {
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);
    gameChannel?.publish("play-again-request", {
      requesterId: client?.auth.clientId,
    });
    setPlayAgainRequested(true);
    setShowWinDialog(false);
  };

  const handlePlayAgainResponse = (accepted: boolean) => {
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);
    gameChannel?.publish("play-again-response", {
      accepted,
      responderId: client?.auth.clientId,
    });
    // Don't hide the dialog here, let the response handler do it
    if (!accepted) {
      setShowPlayAgainRequest(false);
    }
  };

  const resetGame = () => {
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);
    const newGameState = {
      board: createEmptyBoard(boardSize),
      currentPlayer: PLAYER.BLACK,
      winner: null,
      winningCells: [],
      gameOver: false,
      lastMove: null,
    };

    // Update local state
    setGameState(newGameState);
    setPlayAgainRequested(false);
    setShowPlayAgainRequest(false);
    setShowWinDialog(false);

    // Switch roles in localStorage
    const currentRole = localStorage.getItem(`room:${roomId}:role`);
    if (currentRole) {
      const newRole =
        currentRole === ROLE.PLAYER_BLACK
          ? ROLE.PLAYER_WHITE
          : ROLE.PLAYER_BLACK;
      localStorage.setItem(`room:${roomId}:role`, newRole);
    }

    // Notify other players
    gameChannel?.publish("board-update", {
      board: newGameState.board,
      currentPlayer: newGameState.currentPlayer,
      lastMove: null,
    });
  };

  const handleBoardSizeChange = (newSize: number) => {
    setBoardSize(newSize);
    resetGame();
  };

  const handleSurrender = () => {
    const gameChannel = channel || client?.channels.get(`game:${roomId}`);
    // The winner is the other player, regardless of whose turn it is
    const winner = role === ROLE.PLAYER_BLACK ? PLAYER.WHITE : PLAYER.BLACK;
    gameChannel?.publish("game-over", {
      winner,
      winningCells: [],
    });
    setShowConfirmSurrender(false);
  };

  const cleanupAndLeave = () => {
    // Clear game state
    setGameState({
      board: createEmptyBoard(boardSize),
      currentPlayer: PLAYER.BLACK,
      winner: null,
      winningCells: [],
      gameOver: false,
      lastMove: null,
    });

    // Clear UI state
    setShowConfirmSurrender(false);
    setShowWinDialog(false);
    setConfigOpen(false);
    setShowPlayAgainRequest(false);
    setPlayAgainRequested(false);

    // Clear localStorage
    localStorage.removeItem(`room:${roomId}:role`);

    // Redirect to home
    router.push("/");
  };

  const { mutateAsync: deleteRoomMutation } = useDeleteRoom();

  const cleanupRoom = async () => {
    try {
      console.log("[GomokuBoard] Cleaning up room:", roomId);
      // Clear localStorage role
      localStorage.removeItem(`room:${roomId}:role`);
      console.log("[GomokuBoard] Cleared role from localStorage");

      // Leave presence
      const gameChannel = channel || client?.channels.get(`game:${roomId}`);
      if (gameChannel) {
        await gameChannel.presence.leave();
        console.log("[GomokuBoard] Left presence");
      }

      // Delete room from API and get updated room list
      await deleteRoomMutation(roomId);
      console.log("[GomokuBoard] Room deleted successfully");

      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("[GomokuBoard] Error cleaning up room:", error);
    }
  };

  if (isWaiting) {
    return (
      <div className="min-h-screen w-full">
        <Button
          className="absolute top-4 left-4"
          onClick={() => router.push("/")}
        >
          Back to Main Menu
        </Button>
        <Card className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="h-6 w-6" />
              Waiting for Opponent
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
              </div>
              <p className="text-blue-800 font-medium">
                Waiting for another player to join...
              </p>
              <p className="text-sm text-blue-600">Room Code: {roomId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 w-full max-w-full overflow-hidden">
      <GameInfo
        currentPlayer={gameState.currentPlayer}
        gameOver={gameState.gameOver}
        aiThinking={false}
      />

      <GameControls
        gameOver={gameState.gameOver}
        aiThinking={false}
        onBackToMenu={cleanupAndLeave}
        onSurrender={() => setShowConfirmSurrender(true)}
        onReset={resetGame}
        onOpenConfig={() => setConfigOpen(true)}
        onRedo={() => {}} // Disable redo for online games
        canRedo={false}
        canReset={false} // Disable reset for online games
        canConfig={gameState.gameOver} // Only enable config when game is over
        canSurrender={role !== ROLE.SPECTATOR} // Disable surrender for spectators
      />

      <div className="w-full max-w-[min(100vw-2rem,600px)] aspect-square">
        <GameBoard
          board={gameState.board}
          boardSize={boardSize}
          winningCells={gameState.winningCells}
          hoverPosition={hoverPosition}
          onCellClick={handleCellClick}
          lastMove={gameState.lastMove}
        />
      </div>

      <ConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        boardSize={boardSize}
        onBoardSizeChange={handleBoardSizeChange}
        gameRules={gameRules}
        onRulesChange={setGameRules}
        isAIGame={false}
        aiPlayer={PLAYER.WHITE}
        onAiPlayerChange={() => {}}
        onReset={resetGame}
      />

      <SurrenderDialog
        open={showConfirmSurrender}
        onOpenChange={setShowConfirmSurrender}
        onConfirm={handleSurrender}
      />

      <WinDialog
        open={showWinDialog}
        onOpenChange={setShowWinDialog}
        winner={gameState.winner}
        onPlayAgain={requestPlayAgain}
      />

      <Dialog
        open={showPlayAgainRequest}
        onOpenChange={setShowPlayAgainRequest}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Play Again?</DialogTitle>
            <DialogDescription>
              The other player wants to play again. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handlePlayAgainResponse(false)}
            >
              Decline
            </Button>
            <Button onClick={() => handlePlayAgainResponse(true)}>
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {playAgainRequested && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full shadow-lg">
          Waiting for other player to accept...
        </div>
      )}
    </div>
  );
}
