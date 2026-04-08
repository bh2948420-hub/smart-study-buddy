import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MindMapNode {
  id: string;
  label: string;
  type: 'concept' | 'definition' | 'example' | 'rule' | 'detail';
  children: string[];
  summary: string;
}

export interface MindMapData {
  title: string;
  nodes: MindMapNode[];
}

export const useMindMap = () => {
  const [mindMap, setMindMap] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  const generateMindMap = useCallback(async (materialId?: number, content?: string, language: string = 'en') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mindmap', {
        body: { materialId, content, language },
      });

      if (error) throw error;
      setMindMap(data);
      return data;
    } catch (err: any) {
      console.error('Mind map generation error:', err);
      toast.error(language === 'ar' ? 'فشل في إنشاء الخريطة الذهنية' : 'Failed to generate mind map');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mindMap,
    loading,
    selectedNode,
    setSelectedNode,
    generateMindMap,
    clearMindMap: () => { setMindMap(null); setSelectedNode(null); },
  };
};
