import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { useAmbientSounds, SoundType } from '@/hooks/useAmbientSounds';
import { cn } from '@/lib/utils';

interface AmbientSoundPlayerProps {
  className?: string;
}

export const AmbientSoundPlayer = ({ className }: AmbientSoundPlayerProps) => {
  const { language } = useLanguage();
  const { activeSound, volume, isPlaying, sounds, toggleSound, updateVolume, stopSound } = useAmbientSounds();

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {language === 'ar' ? 'أصوات الخلفية' : 'Ambient Sounds'}
        </h3>
        {isPlaying && (
          <Button variant="ghost" size="sm" onClick={stopSound} className="h-8 px-2">
            <VolumeX className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sounds.map((sound) => (
          <Button
            key={sound.id}
            variant={activeSound === sound.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleSound(sound.id)}
            className={cn(
              'gap-2 transition-all',
              activeSound === sound.id && 'ring-2 ring-primary/50'
            )}
          >
            <span>{sound.icon}</span>
            <span>{language === 'ar' ? sound.nameAr : sound.name}</span>
          </Button>
        ))}
      </div>

      {isPlaying && (
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={(value) => updateVolume(value[0] / 100)}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-10 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
