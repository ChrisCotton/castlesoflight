import { useEffect, useRef } from "react";

/**
 * AsciiBackground — Ghostty-inspired dense ASCII canvas animation.
 *
 * Renders a full-coverage canvas of monospace characters that:
 *  - Slowly drift and morph through a pool of terminal-style glyphs
 *  - Glow in the site's amber / cyan / violet palette
 *  - Fade to near-black at the bottom so hero text remains legible
 *  - Run at ~30 fps on a requestAnimationFrame loop
 */

const CHARS =
  "▓▒░█▄▀■□▪▫╔╗╚╝╠╣╦╩╬═║┌┐└┘├┤┬┴┼─│" +
  "01001011010101110100101001101001010" +
  "$%#@&*+=<>{}[]|\\^~`" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "abcdefghijklmnopqrstuvwxyz" +
  "0123456789";

// Palette: amber, cyan, violet, green — matching site tokens
const PALETTE = [
  // amber
  "rgba(255,185,50,",
  // cyan
  "rgba(80,220,220,",
  // violet
  "rgba(160,100,255,",
  // green (SYS.ONLINE)
  "rgba(80,220,140,",
  // dim white
  "rgba(180,190,210,",
];

interface Cell {
  char: string;
  colorIdx: number;
  alpha: number;
  targetAlpha: number;
  changeTimer: number;
  changePeriod: number;
}

export default function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const cellsRef = useRef<Cell[][]>([]);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FONT_SIZE = 15;
    const FONT = `${FONT_SIZE}px 'JetBrains Mono', 'Courier New', monospace`;
    ctx.font = FONT;
    const charW = ctx.measureText("M").width;
    const charH = FONT_SIZE * 1.2; // Tighter line height for better density

    function buildGrid() {
      const cv = canvasRef.current;
      if (!cv) return;
      const cols = Math.ceil(cv.width / charW) + 1;
      const rows = Math.ceil(cv.height / charH) + 1;
      const grid: Cell[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: Cell[] = [];
        for (let c = 0; c < cols; c++) {
          const baseAlpha = Math.random() * 0.2 + 0.02;
          row.push({
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            colorIdx: Math.floor(Math.random() * PALETTE.length),
            alpha: baseAlpha,
            targetAlpha: baseAlpha,
            changeTimer: Math.random() * 120,
            changePeriod: 40 + Math.random() * 160,
          });
        }
        grid.push(row);
      }
      cellsRef.current = grid;
    }

    function resize() {
      const cv = canvasRef.current;
      if (!cv) return;
      cv.width = cv.offsetWidth;
      cv.height = cv.offsetHeight;
      buildGrid();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw(ts: number) {
      const c = canvasRef.current;
      if (!ctx || !c) return;
      
      // Target ~24fps for better performance on Intel Macs
      if (ts - lastFrameRef.current < 40) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = ts;

      ctx.clearRect(0, 0, c.width, c.height);
      ctx.font = FONT;

      const grid = cellsRef.current;
      const rows = grid.length;
      const cols = grid[0]?.length ?? 0;

      for (let r = 0; r < rows; r++) {
        // Vertical fade calculation moved outside column loop
        const rowFrac = r / rows;
        let vertFade = 1;
        if (rowFrac > 0.4) {
          vertFade = Math.max(0, 1 - (rowFrac - 0.4) / 0.6);
        }

        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];

          // Tick change timer
          cell.changeTimer--;
          if (cell.changeTimer <= 0) {
            cell.changeTimer = cell.changePeriod * (0.8 + Math.random() * 0.4);
            cell.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            
            if (Math.random() < 0.1) {
              cell.colorIdx = Math.floor(Math.random() * PALETTE.length);
            }

            const roll = Math.random();
            if (roll < 0.015) {
              cell.targetAlpha = 0.4 + Math.random() * 0.3; // bright flash
            } else {
              cell.targetAlpha = 0.03 + Math.random() * 0.08;
            }
          }

          // Lerp alpha toward target
          cell.alpha += (cell.targetAlpha - cell.alpha) * 0.05;

          const finalAlpha = cell.alpha * vertFade;
          if (finalAlpha < 0.02) continue; // Aggressive skip for dim cells

          // Use template literal instead of toFixed for speed
          ctx.fillStyle = `${PALETTE[cell.colorIdx]}${finalAlpha})`;
          ctx.fillText(cell.char, c * charW, r * charH + FONT_SIZE);
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
