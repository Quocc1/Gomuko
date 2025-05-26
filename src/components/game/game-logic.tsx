import { Board, Player, Position, WinResult, PLAYER } from "@/types";

export function createEmptyBoard(size: number): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => PLAYER.NONE)
  );
}

export function checkWin(
  board: Board,
  row: number,
  col: number,
  player: Player,
  boardSize: number,
  exactlyFiveRule: boolean,
  noBlockedWinsRule: boolean
): WinResult {
  const directions = [
    { row: 0, col: 1 }, // horizontal
    { row: 1, col: 0 }, // vertical
    { row: 1, col: 1 }, // diagonal down-right
    { row: 1, col: -1 }, // diagonal down-left
  ];

  for (const direction of directions) {
    let count = 1;
    const winningCells: Position[] = [{ row, col }];

    // Count in the positive direction
    let r = row + direction.row;
    let c = col + direction.col;
    while (
      r >= 0 &&
      r < boardSize &&
      c >= 0 &&
      c < boardSize &&
      board[r][c] === player
    ) {
      count++;
      winningCells.push({ row: r, col: c });
      r += direction.row;
      c += direction.col;
    }

    // Store the end position for blocked win check
    const endPos = { row: r, col: c };

    // Count in the negative direction
    r = row - direction.row;
    c = col - direction.col;
    while (
      r >= 0 &&
      r < boardSize &&
      c >= 0 &&
      c < boardSize &&
      board[r][c] === player
    ) {
      count++;
      winningCells.push({ row: r, col: c });
      r -= direction.row;
      c -= direction.col;
    }

    // Store the start position for blocked win check
    const startPos = { row: r, col: c };

    // Check if win according to rules
    if (exactlyFiveRule && count !== 5) {
      continue; // Not a win if not exactly 5 with exactlyFiveRule
    }

    if (count === 5) {
      if (noBlockedWinsRule) {
        // Check if both ends are blocked
        const isStartBlocked =
          startPos.row >= 0 &&
          startPos.row < boardSize &&
          startPos.col >= 0 &&
          startPos.col < boardSize &&
          board[startPos.row][startPos.col] !== PLAYER.NONE &&
          board[startPos.row][startPos.col] !== player;

        const isEndBlocked =
          endPos.row >= 0 &&
          endPos.row < boardSize &&
          endPos.col >= 0 &&
          endPos.col < boardSize &&
          board[endPos.row][endPos.col] !== PLAYER.NONE &&
          board[endPos.row][endPos.col] !== player;

        if (isStartBlocked && isEndBlocked) {
          continue; // Not a win if both ends are blocked with noBlockedWinsRule
        }
      }
      return { isWin: true, winningCells };
    }
  }

  return { isWin: false, winningCells: [] };
}

export function checkDraw(board: Board): boolean {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === PLAYER.NONE) {
        return false;
      }
    }
  }
  return true;
}
