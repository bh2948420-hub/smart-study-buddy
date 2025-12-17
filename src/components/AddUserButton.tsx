import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

const AddUserButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddUser = async () => {
    setLoading(true);
    
    try {
      const testUser = {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user')
        .insert([testUser])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "تم بنجاح! ✓",
        description: `تمت إضافة المستخدم: ${testUser.name}`,
      });
      
      console.log('User added:', data);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المستخدم",
        variant: "destructive",
      });
      console.error('Error adding user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAddUser} 
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {loading ? 'جاري الإضافة...' : 'Add Test User'}
    </Button>
  );
};

export default AddUserButton;
