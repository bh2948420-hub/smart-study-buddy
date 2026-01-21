import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple PDF text extraction using pdf-lib for basic text and regex for embedded text
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    // Convert bytes to string to find text content
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfBytes);
    
    // Extract text between BT (Begin Text) and ET (End Text) markers
    const textBlocks: string[] = [];
    
    // Method 1: Extract from text objects
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    
    while ((match = btEtRegex.exec(pdfString)) !== null) {
      const block = match[1];
      
      // Extract text from Tj and TJ operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const text = tjMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (text.trim()) {
          textBlocks.push(text);
        }
      }
      
      // Extract from TJ arrays
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let tjArrayMatch;
      while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
        const arrayContent = tjArrayMatch[1];
        const stringRegex = /\((.*?)\)/g;
        let stringMatch;
        let lineText = '';
        while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
          lineText += stringMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, ' ')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
        }
        if (lineText.trim()) {
          textBlocks.push(lineText);
        }
      }
    }
    
    // Method 2: Look for stream content with readable text
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const content = match[1];
      // Only process if it looks like it contains text operators
      if (content.includes('Tj') || content.includes('TJ')) {
        const tjRegex = /\((.*?)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(content)) !== null) {
          const text = tjMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')');
          if (text.trim() && text.length > 2) {
            textBlocks.push(text);
          }
        }
      }
    }
    
    // Clean and deduplicate
    const uniqueTexts = [...new Set(textBlocks)];
    let extractedText = uniqueTexts.join(' ').trim();
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F]/g, '') // Keep ASCII and Arabic
      .trim();
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('filePath is required');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('study-materials')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file');
    }

    // Convert to bytes
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // Extract text
    const extractedText = await extractTextFromPDF(pdfBytes);

    // If extraction yielded little text, provide a fallback message
    if (extractedText.length < 50) {
      return new Response(
        JSON.stringify({
          success: true,
          text: '',
          message: 'Could not extract sufficient text from PDF. The PDF may be image-based or encrypted.',
          extracted: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText.substring(0, 15000), // Limit to 15k chars for API
        charCount: extractedText.length,
        extracted: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract text';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        extracted: false
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
