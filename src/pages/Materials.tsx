import { useState, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useMindMap } from '@/hooks/useMindMap';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

// Material components
import { MaterialsIntro } from '@/components/materials/MaterialsIntro';
import { MaterialsUploadZone } from '@/components/materials/MaterialsUploadZone';
import { MaterialsBySubject } from '@/components/materials/MaterialsBySubject';
import { MaterialPreviewDialog } from '@/components/materials/MaterialPreviewDialog';
import { QuizGeneratorDialog } from '@/components/materials/QuizGeneratorDialog';
import { MultiQuizGeneratorDialog } from '@/components/materials/MultiQuizGeneratorDialog';
import { MindMapViewer } from '@/components/mindmap/MindMapViewer';

const Materials = () => {
  const { language, dir } = useLanguage();
  const { materials, loading, uploading, uploadMaterial, deleteMaterial, downloadFile } = useMaterials();
  const { mindMap, loading: mindMapLoading, selectedNode, setSelectedNode, generateMindMap, clearMindMap } = useMindMap();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [quizMaterial, setQuizMaterial] = useState<Material | null>(null);
  
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [showMultiQuizDialog, setShowMultiQuizDialog] = useState(false);

  const t = {
    search: language === 'ar' ? 'بحث في الملفات...' : 'Search files...',
  };

  // Filter materials by search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    
    const query = searchQuery.toLowerCase();
    return materials.filter(m => 
      m.file_name.toLowerCase().includes(query) ||
      m.subject?.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    );
  }, [materials, searchQuery]);

  // Handlers
  const handleDownload = async (material: Material) => {
    try {
      await downloadFile(material.file_path, material.file_name);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = (id: number, filePath: string) => {
    deleteMaterial(id, filePath);
    // Also remove from selection if selected
    setSelectedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
  };

  const handleGenerateQuiz = (material: Material) => {
    setQuizMaterial(material);
  };

  const handleGenerateMindMap = async (material: Material) => {
    await generateMindMap(material.id, undefined, language);
  };

  // Multi-select handlers
  const handleToggleSelect = useCallback((material: Material) => {
    setSelectedMaterials(prev => {
      const isSelected = prev.some(m => m.id === material.id);
      if (isSelected) {
        return prev.filter(m => m.id !== material.id);
      } else {
        return [...prev, material];
      }
    });
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      // Clear selection when exiting selection mode
      setSelectedMaterials([]);
    }
  }, [selectionMode]);

  const handleGenerateCombinedQuiz = useCallback(() => {
    if (selectedMaterials.length >= 2) {
      setShowMultiQuizDialog(true);
    }
  }, [selectedMaterials]);

  const handleClearSelection = useCallback(() => {
    setSelectedMaterials([]);
    setSelectionMode(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <Navbar />
      
      <main className="container py-8 space-y-8">
        {/* Intro Section */}
        <MaterialsIntro />

        {/* Upload Zone */}
        <MaterialsUploadZone 
          uploading={uploading}
          onUpload={uploadMaterial}
        />

        {/* Search Bar */}
        {materials.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Materials List with Selection Support */}
        <MaterialsBySubject
          materials={filteredMaterials}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onGenerateQuiz={handleGenerateQuiz}
          onPreview={handlePreview}
          onGenerateMindMap={handleGenerateMindMap}
          selectionMode={selectionMode}
          selectedMaterials={selectedMaterials}
          onToggleSelect={handleToggleSelect}
          onToggleSelectionMode={handleToggleSelectionMode}
          onGenerateCombinedQuiz={handleGenerateCombinedQuiz}
        />

        {/* Mind Map Viewer */}
        {(mindMap || mindMapLoading) && (
          <div className="animate-fade-in">
            {mindMapLoading ? (
              <div className="flex items-center justify-center p-12 bg-muted/30 rounded-xl border">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'جاري إنشاء الخريطة الذهنية...' : 'Generating mind map...'}
                  </p>
                </div>
              </div>
            ) : mindMap ? (
              <MindMapViewer
                data={mindMap}
                onClose={clearMindMap}
                onNodeClick={setSelectedNode}
                selectedNodeId={selectedNode?.id || null}
              />
            ) : null}
          </div>
        )}
      </main>

      {/* Preview Dialog */}
      <MaterialPreviewDialog
        material={previewMaterial}
        open={!!previewMaterial}
        onOpenChange={(open) => !open && setPreviewMaterial(null)}
        onDownload={handleDownload}
        onGenerateQuiz={handleGenerateQuiz}
      />

      {/* Single Quiz Generator Dialog */}
      <QuizGeneratorDialog
        material={quizMaterial}
        open={!!quizMaterial}
        onOpenChange={(open) => !open && setQuizMaterial(null)}
      />

      {/* Multi-Material Quiz Generator Dialog */}
      <MultiQuizGeneratorDialog
        materials={selectedMaterials}
        open={showMultiQuizDialog}
        onOpenChange={setShowMultiQuizDialog}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
};

export default Materials;
