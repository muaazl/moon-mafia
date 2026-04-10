import { useMemo, useRef, useEffect, memo } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";

interface PriceChartProps {
  history?: number[];       // actual profit/loss values
}

const Y_LABELS = 5;       // number of Y-axis ticks
const X_PAD = 52;         // left padding for Y-axis labels
const Y_PAD_TOP = 8;
const Y_PAD_BOTTOM = 24;  // room for X labels if needed

// BOLT OPTIMIZATION: Memoize PriceChart to prevent expensive canvas redraws on every game tick.
export const PriceChart = memo(function PriceChart({
  history = [],
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derive Y-axis dollar labels from profit/loss history
  const yLabels = useMemo(() => {
    const data = history.length > 0 ? history : [0];
    const min = Math.min(0, ...data);
    const max = Math.max(0, ...data);
    const range = Math.max(100, max - min);
    const pad = range * 0.1;
    let lo = min - pad;
    let hi = max + pad;
    
    // Ensure 0 is centered if min=0, max=0
    if (min === 0 && max === 0) { 
      lo = -500; hi = 500; 
    }
    
    const stepRaw = (hi - lo) / Y_LABELS;
    const magnitude = Math.pow(10, Math.floor(Math.log10(stepRaw || 1)));
    const normalizedStep = stepRaw / magnitude;
    const stepMultiplier = normalizedStep > 5 ? 5 : normalizedStep > 2 ? 2 : 1;
    const step = magnitude * stepMultiplier;
    
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    
    const ticks: number[] = [];
    for (let v = lo; v <= hi + step/2; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [history]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { highQuality } = useSettingsStore.getState();
    const dpr = highQuality ? (window.devicePixelRatio || 1) : 1;
    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W <= 0 || H <= 0) return;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const plotW = W - X_PAD;
    const plotH = H - Y_PAD_TOP - Y_PAD_BOTTOM;
    const plotX = X_PAD;
    const plotY = Y_PAD_TOP;

    const yMin = yLabels[0];
    const yMax = yLabels[yLabels.length - 1];

    // X-axis minimum representation of 10 rounds to prevent single points stretching full width
    const maxPts = Math.max(10, history.length - 1);
    
    const toCanvasX = (i: number) => plotX + (i / maxPts) * plotW;
    const toCanvasY = (val: number) => plotY + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

    // Draw Y grid lines & labels
    ctx.font = `bold 9px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    yLabels.forEach((val) => {
      const cy = toCanvasY(val);
      // Grid line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(148,163,184,0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.moveTo(plotX, cy);
      ctx.lineTo(W, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle = "rgba(156,163,175,0.8)";
      const label = val === 0 ? "$0" : `${val > 0 ? '+' : '-'}$${(Math.abs(val) / 1000).toFixed(1)}k`;
      ctx.fillText(label, X_PAD - 6, cy);
    });

    // Breakeven (0) line
    const breakevenY = toCanvasY(0);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(plotX, breakevenY);
    ctx.lineTo(W, breakevenY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (history.length === 0) return;

    // Determine if trend is positive or negative
    const last = history[history.length - 1];
    const isPositive = last >= 0;
    const lineColor = isPositive ? "#34d399" : "#f87171";

    // Build path points
    const pts = history.map((v, i) => ({
      x: toCanvasX(i),
      y: toCanvasY(v),
    }));

    // Filled area
    const grad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
    grad.addColorStop(0, isPositive ? "rgba(52,211,153,0.30)" : "rgba(248,113,113,0.25)");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    // Connect to bottom
    ctx.lineTo(pts[pts.length - 1].x, plotY + plotH);
    ctx.lineTo(pts[0].x, plotY + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Endpoint dot
    const endPt = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    // Outer glow ring
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = lineColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Draw X-axis rounds
    ctx.font = `600 9px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "rgba(156,163,175,0.6)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Draw 0, mid, max round points
    ctx.fillText("0", toCanvasX(0), plotY + plotH + 8);
    const mid = Math.floor(maxPts / 2);
    ctx.fillText(mid.toString(), toCanvasX(mid), plotY + plotH + 8);
    ctx.fillText(maxPts.toString(), toCanvasX(maxPts), plotY + plotH + 8);
  };

  // Redraw on history or container size change
  useEffect(() => {
    drawChart();
  }, [history, yLabels]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => drawChart());
    observer.observe(container);
    return () => observer.disconnect();
  }, [history, yLabels]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
});
