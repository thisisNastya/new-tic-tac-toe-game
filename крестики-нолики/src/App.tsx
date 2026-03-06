/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Hash, Zap, Trash2, Info } from 'lucide-react';

type Player = 'X' | 'O';

interface Piece {
  id: string;
  player: Player;
  r: number;
  c: number;
}

type Board = Piece[][][];

const WIN_LINES = [
  [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]], // Rows
  [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]], // Cols
  [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]], // Diagonals
];

const PLAYER_PIECE_LIMIT = 3;
const CELL_COLLAPSE_LIMIT = 4;

interface CellProps {
  stack: Piece[];
  onClick: () => void;
  disabled: boolean;
  currentPlayer: Player;
  isCollapsing: boolean;
  playerHistory: { X: Piece[], O: Piece[] };
}

const Cell: React.FC<CellProps> = ({ stack, onClick, disabled, currentPlayer, isCollapsing, playerHistory }) => {
  const height = stack.length;
  const topPiece = stack.length > 0 ? stack[stack.length - 1] : null;
  const scale = height === 0 ? 1 : height === 1 ? 1 : height === 2 ? 1.12 : 1.25;

  // Calculate how many moves this player has left before this specific piece evaporates
  const turnsLeft = topPiece 
    ? playerHistory[topPiece.player].findIndex(p => p.id === topPiece.id) + 1 
    : null;

  // Color logic for lifetime indicator
  const getLifetimeColor = (turns: number) => {
    if (turns === 1) return 'bg-red-500/20 border-red-500/50 text-red-400';
    if (turns === 2) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    return 'bg-green-500/20 border-green-500/50 text-green-400';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-24 h-24 sm:w-28 sm:h-28 rounded-[1.75rem] flex items-center justify-center
        bg-zinc-900/90 border border-white/5 transition-all duration-300
        ${!disabled && 'hover:bg-zinc-800 hover:border-white/20 active:scale-95 cursor-pointer'}
        ${isCollapsing ? 'z-50' : 'z-0'}
      `}
    >
      {/* Lifetime Indicator (Bottom Right) */}
      <AnimatePresence>
        {turnsLeft !== null && !isCollapsing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`
              absolute bottom-2 right-2 z-30 flex items-center justify-center
              w-5 h-5 rounded-full text-[10px] font-black border
              ${getLifetimeColor(turnsLeft)}
            `}
            title={`Эта фишка исчезнет через ${turnsLeft} ход(а) игрока ${topPiece?.player}`}
          >
            {turnsLeft}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Height Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i <= height 
                ? (stack[i-1]?.player === 'X' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]')
                : 'bg-white/5'
            }`}
          />
        ))}
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {stack.map((piece, index) => {
            const isTop = index === stack.length - 1;
            if (!isTop) return null;

            return (
              <motion.div
                key={piece.id}
                initial={{ y: -50, opacity: 0, scale: 0.5 }}
                animate={{ 
                  y: isCollapsing ? [0, -5, 5, -5, 5, 0] : 0,
                  opacity: 1, 
                  scale: scale,
                }}
                exit={{ 
                  scale: 0,
                  opacity: 0,
                  transition: { duration: 0.3 }
                }}
                transition={{
                  y: isCollapsing ? { repeat: Infinity, duration: 0.1 } : { type: 'spring', damping: 15 },
                  scale: { type: 'spring', stiffness: 300, damping: 20 },
                }}
                className={`
                  text-5xl font-black select-none absolute
                  ${piece.player === 'X' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]'}
                `}
              >
                {piece.player}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Collapse Particles */}
      <AnimatePresence>
        {isCollapsing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 150, 
                  y: (Math.random() - 0.5) * 150, 
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.5 }}
                className="absolute w-2 h-2 bg-white rounded-full"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {!disabled && height < 4 && (
        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className={`text-4xl font-black opacity-20 ${currentPlayer === 'X' ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {currentPlayer}
          </span>
        </div>
      )}
    </button>
  );
};

export default function App() {
  const [board, setBoard] = useState<Board>(
    Array(3).fill(null).map(() => Array(3).fill(null).map(() => []))
  );
  const [playerHistory, setPlayerHistory] = useState<{ X: Piece[], O: Piece[] }>({ X: [], O: [] });
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [collapsingCell, setCollapsingCell] = useState<{ r: number, c: number } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const checkWinner = (currentBoard: Board): Player | null => {
    for (const line of WIN_LINES) {
      const symbols = line.map(([r, c]) => {
        const stack = currentBoard[r][c];
        return stack.length > 0 ? stack[stack.length - 1].player : null;
      });
      if (symbols[0] && symbols[0] === symbols[1] && symbols[0] === symbols[2]) {
        return symbols[0] as Player;
      }
    }
    return null;
  };

  const handleCellClick = async (r: number, c: number) => {
    if (isGameOver || collapsingCell) return;

    let newBoard = board.map(row => row.map(cell => [...cell]));
    let newHistory = { X: [...playerHistory.X], O: [...playerHistory.O] };

    // 1. Create new piece
    const newPiece: Piece = {
      id: Math.random().toString(36).substr(2, 9),
      player: currentPlayer,
      r, c
    };

    // 2. Player Piece Limit (3 pieces max)
    // If player already has 3 pieces, remove the oldest one from the board
    if (newHistory[currentPlayer].length >= PLAYER_PIECE_LIMIT) {
      const oldest = newHistory[currentPlayer].shift()!;
      const stackAtOldest = newBoard[oldest.r][oldest.c];
      
      // NEW RULE: If the evaporating piece is the TOP of a height-3 stack, the whole cell collapses
      const isTopAtHeight3 = stackAtOldest.length === 3 && stackAtOldest[stackAtOldest.length - 1].id === oldest.id;
      
      if (isTopAtHeight3) {
        // Trigger collapse for the entire cell
        const piecesInCell = [...stackAtOldest];
        // Remove all pieces in this cell from both players' histories
        newHistory.X = newHistory.X.filter(p => !piecesInCell.find(cp => cp.id === p.id));
        newHistory.O = newHistory.O.filter(p => !piecesInCell.find(cp => cp.id === p.id));
        newBoard[oldest.r][oldest.c] = [];
        
        // Visual feedback for this "evaporation-collapse"
        setCollapsingCell({ r: oldest.r, c: oldest.c });
        setTimeout(() => setCollapsingCell(null), 600);
      } else {
        // Standard evaporation: just remove the one piece
        newBoard[oldest.r][oldest.c] = stackAtOldest.filter(p => p.id !== oldest.id);
      }
    }

    // 3. Add new piece to board and history
    newBoard[r][c].push(newPiece);
    newHistory[currentPlayer].push(newPiece);

    // 4. Cell Collapse Check (4 pieces in a cell)
    if (newBoard[r][c].length >= CELL_COLLAPSE_LIMIT) {
      setCollapsingCell({ r, c });
      setBoard(newBoard);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Remove all pieces in this cell from both players' histories
      const piecesInCell = newBoard[r][c];
      newHistory.X = newHistory.X.filter(p => !piecesInCell.find(cp => cp.id === p.id));
      newHistory.O = newHistory.O.filter(p => !piecesInCell.find(cp => cp.id === p.id));
      
      newBoard[r][c] = [];
      setCollapsingCell(null);
    }

    setBoard(newBoard);
    setPlayerHistory(newHistory);

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
      setIsGameOver(true);
      setScores(prev => ({ ...prev, [gameResult]: prev[gameResult] + 1 }));
    } else {
      setCurrentPlayer(prev => (prev === 'X' ? 'O' : 'X'));
    }
  };

  const resetGame = () => {
    setBoard(Array(3).fill(null).map(() => Array(3).fill(null).map(() => [])));
    setPlayerHistory({ X: [], O: [] });
    setCurrentPlayer('X');
    setWinner(null);
    setIsGameOver(false);
    setCollapsingCell(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Header */}
      <div className="relative z-10 w-full max-w-md mb-8 flex flex-col items-center">
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-4 text-center leading-none">
          КРЕСТИКИ<br />НОЛИКИ
        </h1>
        <div className="flex gap-4 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-amber-400" />
            <span>Лимит 3 фишки</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trash2 size={10} className="text-rose-400" />
            <span>Обвал башни</span>
          </div>
        </div>
        
        {/* Scoreboard */}
        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
          <div className={`p-4 rounded-[1.5rem] border transition-all duration-500 ${currentPlayer === 'X' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900/50 border-white/5 opacity-40'}`}>
            <div className="text-[10px] font-display font-black text-emerald-400 mb-1 uppercase tracking-widest">ИГРОК X</div>
            <div className="text-3xl font-black">{scores.X}</div>
            <div className="flex gap-1 mt-2">
              {[...Array(PLAYER_PIECE_LIMIT)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < playerHistory.X.length ? 'bg-emerald-400' : 'bg-white/5'}`} />
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-[1.5rem] border transition-all duration-500 ${currentPlayer === 'O' ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-zinc-900/50 border-white/5 opacity-40'}`}>
            <div className="text-[10px] font-display font-black text-cyan-400 mb-1 uppercase tracking-widest">ИГРОК O</div>
            <div className="text-3xl font-black">{scores.O}</div>
            <div className="flex gap-1 mt-2">
              {[...Array(PLAYER_PIECE_LIMIT)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < playerHistory.O.length ? 'bg-cyan-400' : 'bg-white/5'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="relative z-10 grid grid-cols-3 gap-3 bg-zinc-900/40 p-3 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              stack={cell}
              currentPlayer={currentPlayer}
              playerHistory={playerHistory}
              isCollapsing={collapsingCell?.r === r && collapsingCell?.c === c}
              onClick={() => handleCellClick(r, c)}
              disabled={isGameOver}
            />
          ))
        )}
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={resetGame}
          className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-[1.25rem] font-black text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-xl uppercase"
        >
          <RotateCcw size={16} />
          ЗАНОВО
        </button>
        <button
          onClick={() => setShowRules(true)}
          className="flex items-center gap-3 bg-zinc-800 text-white px-8 py-4 rounded-[1.25rem] font-black text-sm hover:bg-zinc-700 transition-all active:scale-95 shadow-xl uppercase border border-white/10"
        >
          <Info size={16} />
          ПРАВИЛА
        </button>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-y-auto max-h-[80vh]"
            >
              <h2 className="text-3xl font-black mb-6 tracking-tighter uppercase text-center">ПРАВИЛА ИГРЫ</h2>
              <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">1. Лимит фишек</h3>
                  <p>У каждого игрока одновременно на поле может быть только <span className="text-emerald-400 font-bold">3 фишки</span>. При постановке 4-й фишки, ваша самая первая (старая) фишка исчезает.</p>
                </section>
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">2. Индикатор жизни</h3>
                  <p>Число в углу фишки показывает, через сколько ходов она исчезнет. <span className="text-red-400">1</span> — исчезнет следующим ходом.</p>
                </section>
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">3. Обвал башни</h3>
                  <p>Если в ячейке накапливается <span className="text-rose-400 font-bold">4 фишки</span>, вся башня обваливается и ячейка становится пустой. Также башня обваливается, если исчезающая по лимиту фишка была на вершине башни высотой 3.</p>
                </section>
                <section>
                  <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest">4. Победа</h3>
                  <p>Для победы нужно выстроить 3 своих символа в ряд, но учитываются только <span className="text-white font-bold">верхние</span> фишки в каждой ячейке.</p>
                </section>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="w-full bg-white text-black py-4 rounded-[1.25rem] font-black text-lg hover:bg-zinc-200 mt-8 uppercase"
              >
                ПОНЯТНО
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-10 rounded-[3rem] max-w-sm w-full text-center"
            >
              <Trophy className="mx-auto mb-6 text-amber-400" size={64} />
              <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">ПОБЕДА!</h2>
              <p className="text-zinc-500 mb-8 font-medium uppercase tracking-widest text-[10px]">Игрок {winner} одержал победу</p>
              <button
                onClick={resetGame}
                className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-lg hover:bg-zinc-200 uppercase"
              >
                ИГРАТЬ СНОВА
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

