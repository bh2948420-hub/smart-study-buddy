import { useState, useRef, useEffect } from 'react';
import { MindMapData, MindMapNode } from '@/hooks/useMindMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapViewerProps {
  data: MindMapData;
  onClose?: () => void;
  onNodeClick?: (node: MindMapNode) => void;
  selectedNodeId?: string | null;
}

const nodeTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  concept: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  definition: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' },
  example: { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  rule: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-400', text: 'text-red-700 dark:text-red-300' },
  detail: { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
};

const nodeTypeIcons: Record<string, string> = {
  concept: '💡',
  definition: '📖',
  example: '📝',
  rule: '⚡',
  detail: '🔍',
};

export const MindMapViewer = ({ data, onClose, onNodeClick, selectedNodeId }: MindMapViewerProps) => {
  const { language } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const rootNode = data.nodes[0];
  const isAr = language === 'ar';

  // Build tree structure
  const getChildren = (nodeId: string): MindMapNode[] => {
    const node = data.nodes.find(n => n.id === nodeId);
    if (!node?.children) return [];
    return node.children.map(cId => data.nodes.find(n => n.id === cId)).filter(Boolean) as MindMapNode[];
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mind-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const renderNode = (node: MindMapNode, level: number, index: number) => {
    const colors = nodeTypeColors[node.type] || nodeTypeColors.detail;
    const children = getChildren(node.id);
    const isSelected = selectedNodeId === node.id;
    const isRoot = level === 0;

    return (
      <div key={node.id} className="flex flex-col items-center gap-2">
        {/* Node */}
        <button
          className={cn(
            "mind-node relative px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer max-w-[200px]",
            "hover:scale-105 hover:shadow-lg",
            colors.bg, colors.border,
            isSelected && "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg",
            isRoot && "px-6 py-4 max-w-[280px] border-3"
          )}
          onClick={() => onNodeClick?.(node)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{nodeTypeIcons[node.type] || '📌'}</span>
            <span className={cn("font-semibold text-sm", colors.text, isRoot && "text-base")}>
              {node.label}
            </span>
          </div>
          {isSelected && node.summary && (
            <p className="text-xs text-muted-foreground mt-2 animate-fade-in">
              {node.summary}
            </p>
          )}
        </button>

        {/* Children */}
        {children.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Connector line */}
            <div className="w-0.5 h-4 bg-border" />
            <div className="flex gap-4 flex-wrap justify-center">
              {children.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-border" />
                  {renderNode(child, level + 1, i)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{data.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? 'اضغط على أي عقدة لرؤية التفاصيل' : 'Click any node to see details'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {Object.entries(nodeTypeIcons).map(([type, icon]) => (
              <span key={type} className="flex items-center gap-1">
                {icon} {isAr ? { concept: 'مفهوم', definition: 'تعريف', example: 'مثال', rule: 'قاعدة', detail: 'تفصيل' }[type] : type}
              </span>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative overflow-auto bg-muted/30 rounded-xl border min-h-[400px] max-h-[600px] cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="p-8 flex justify-center transition-transform"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center top',
            }}
          >
            {rootNode && renderNode(rootNode, 0, 0)}
          </div>
        </div>

        {/* Selected node detail panel */}
        {selectedNodeId && (() => {
          const node = data.nodes.find(n => n.id === selectedNodeId);
          if (!node) return null;
          const colors = nodeTypeColors[node.type] || nodeTypeColors.detail;
          return (
            <div className={cn("mt-4 p-4 rounded-xl border-2 animate-fade-in", colors.bg, colors.border)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{nodeTypeIcons[node.type]}</span>
                <h4 className={cn("font-bold", colors.text)}>{node.label}</h4>
                <Badge variant="outline" className="text-xs">{node.type}</Badge>
              </div>
              <p className="text-sm text-foreground/80">{node.summary}</p>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};
