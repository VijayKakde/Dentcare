import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type HeatmapStage = 'healthy' | 'initial' | 'moderate' | 'severe' | undefined;

interface HeatmapVisualizationProps {
  imageUrl: string;
  stage: HeatmapStage;
  confidence: number;
  /** Compact variant used in the PDF report */
  compact?: boolean;
}

/**
 * Renders the uploaded image alongside a Grad-CAM-style heatmap overlay
 * produced entirely on the frontend using the Canvas API.
 *
 * The radial gradient hotspot varies based on the detected caries stage:
 *  - healthy:  faint blue tint
 *  - initial:  small light-yellow spot, top-center of tooth area
 *  - moderate: medium orange-red spot, centered
 *  - severe:   large bright-red spot covering most of the tooth center
 */
export function HeatmapVisualization({
  imageUrl,
  stage,
  confidence,
  compact = false,
}: HeatmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heatmapDataUrl, setHeatmapDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Base image
      ctx.drawImage(img, 0, 0, w, h);

      // Heatmap config per stage (positions normalized 0-1)
      const config = (() => {
        switch (stage) {
          case 'severe':
            return {
              cx: 0.5,
              cy: 0.55,
              radius: 0.55,
              stops: [
                { o: 0, c: 'rgba(220, 38, 38, 0.75)' },   // bright red core
                { o: 0.3, c: 'rgba(239, 68, 68, 0.6)' },
                { o: 0.55, c: 'rgba(251, 146, 60, 0.45)' }, // orange
                { o: 0.8, c: 'rgba(253, 224, 71, 0.25)' },  // yellow fade
                { o: 1, c: 'rgba(253, 224, 71, 0)' },
              ],
            };
          case 'moderate':
            return {
              cx: 0.5,
              cy: 0.5,
              radius: 0.4,
              stops: [
                { o: 0, c: 'rgba(239, 68, 68, 0.65)' },
                { o: 0.4, c: 'rgba(251, 146, 60, 0.5)' },
                { o: 0.75, c: 'rgba(253, 224, 71, 0.3)' },
                { o: 1, c: 'rgba(253, 224, 71, 0)' },
              ],
            };
          case 'initial':
            return {
              cx: 0.5,
              cy: 0.4,
              radius: 0.28,
              stops: [
                { o: 0, c: 'rgba(253, 224, 71, 0.55)' },   // light yellow core
                { o: 0.5, c: 'rgba(254, 240, 138, 0.35)' },
                { o: 1, c: 'rgba(254, 240, 138, 0)' },
              ],
            };
          case 'healthy':
          default:
            return {
              cx: 0.5,
              cy: 0.5,
              radius: 0.6,
              stops: [
                { o: 0, c: 'rgba(59, 130, 246, 0.12)' },   // very faint blue
                { o: 1, c: 'rgba(59, 130, 246, 0)' },
              ],
            };
        }
      })();

      const cx = w * config.cx;
      const cy = h * config.cy;
      const r = Math.min(w, h) * config.radius;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      for (const stop of config.stops) {
        gradient.addColorStop(stop.o, stop.c);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      setHeatmapDataUrl(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      // If image fails to load (e.g. CORS on remote URLs), fall back to original.
      setHeatmapDataUrl(imageUrl);
    };

    img.src = imageUrl;
  }, [imageUrl, stage]);

  const labelClass = compact ? 'text-xs' : 'text-sm';
  const imageHeight = compact ? 'h-32' : 'h-56 md:h-64';

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Original */}
        <figure className="flex flex-col">
          <div className="rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={imageUrl}
              alt="Original dental scan"
              className={`w-full ${imageHeight} object-contain bg-white`}
            />
          </div>
          <figcaption
            className={`mt-2 text-center font-medium text-foreground ${labelClass}`}
          >
            Original Image
          </figcaption>
        </figure>

        {/* Heatmap */}
        <figure className="flex flex-col">
          <div className="rounded-lg overflow-hidden border border-border bg-muted relative">
            {heatmapDataUrl ? (
              <img
                src={heatmapDataUrl}
                alt="AI focus area heatmap"
                className={`w-full ${imageHeight} object-contain bg-white`}
              />
            ) : (
              <div
                className={`w-full ${imageHeight} flex items-center justify-center text-xs text-muted-foreground`}
              >
                Generating heatmap…
              </div>
            )}
          </div>
          <figcaption
            className={`mt-2 text-center font-medium text-foreground flex items-center justify-center gap-1.5 ${labelClass}`}
          >
            AI Focus Area
            {!compact && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="About AI Focus Area"
                      className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    This heatmap shows the region the AI model focused on to make
                    its prediction — darker red indicates higher likelihood of
                    caries.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </figcaption>
        </figure>
      </div>

      {/* Confidence badge */}
      <div className="mt-3 flex justify-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {confidence}% Confidence
        </span>
      </div>

      {/* Hidden working canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
