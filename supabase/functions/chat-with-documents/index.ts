import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, documentId, documentIds, conversationHistory, mode = 'chat' } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch document info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch document details for context
    let documentContext = '';
    let documentNames: string[] = [];
    
    if (documentIds && documentIds.length > 0) {
      const { data: docs } = await supabase
        .from('uploaded_documents')
        .select('id, filename')
        .in('id', documentIds);
      
      if (docs && docs.length > 0) {
        documentNames = docs.map(d => d.filename);
        documentContext = `\n\nDocuments being analyzed:\n${documentNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`;
      }
    } else if (documentId && documentId !== 'all') {
      const { data: doc } = await supabase
        .from('uploaded_documents')
        .select('id, filename')
        .eq('id', documentId)
        .single();
      
      if (doc) {
        documentNames = [doc.filename];
        documentContext = `\n\nDocument being analyzed: ${doc.filename}`;
      }
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Configure prompts based on mode
    switch (mode) {
      case 'summarize':
        systemPrompt = `You are a research assistant specializing in biomedical and pharmaceutical research analysis. Provide a comprehensive, well-structured summary using clear markdown formatting.${documentContext}

Format your response using:
- Clear section headers (##)
- Bullet points for key items
- Bold text for emphasis on important terms
- Numbered lists for sequential information`;
        
        userPrompt = documentId && documentId !== 'all'
          ? `Please provide a detailed summary of the document "${documentNames[0] || 'selected document'}". Include: main objectives, methodology, key findings, conclusions, and implications.`
          : 'Please provide a comprehensive summary synthesizing all uploaded research documents. Identify common themes, methodologies, and key findings across the papers.';
        break;

      case 'key-findings':
        systemPrompt = `You are a research assistant specializing in extracting and synthesizing key findings from biomedical research. Present findings in a clear, structured format using markdown.${documentContext}

Format your response using:
- Numbered or bullet lists for findings
- Bold text for key discoveries
- Clear categorization of findings by type`;
        
        userPrompt = documentId && documentId !== 'all'
          ? `Extract and list the key findings from "${documentNames[0] || 'the selected document'}". Focus on: main discoveries, statistical significance, novel contributions, and practical implications.`
          : 'Extract and synthesize key findings across all research documents. Identify patterns, contradictions, and consensus findings.';
        break;

      case 'compare':
        if (!documentIds || documentIds.length < 2) {
          throw new Error('At least 2 documents required for comparison');
        }
        systemPrompt = `You are a research analyst performing comparative analysis of biomedical research papers. Provide detailed, structured comparisons using clear markdown formatting.${documentContext}

Structure your analysis with clear sections:
## Research Objectives Comparison
## Methodology Comparison  
## Key Findings Comparison
## Conclusions & Implications
## Strengths & Limitations

Use tables where appropriate, bullet points for clarity, and bold text for emphasis.`;
        
        userPrompt = `Perform a detailed comparative analysis of these ${documentNames.length} research documents: ${documentNames.join(', ')}. 

Compare their:
1. Research objectives and hypotheses
2. Methodological approaches and study designs
3. Key findings and results
4. Conclusions and implications
5. Relative strengths and limitations

Highlight key similarities, differences, and complementary insights.`;
        break;

      case 'meta-analysis':
        if (!documentIds || documentIds.length < 2) {
          throw new Error('At least 2 documents required for meta-analysis');
        }
        systemPrompt = `You are a senior research meta-analyst specializing in biomedical and pharmaceutical research synthesis. Generate comprehensive meta-analysis reports with proper academic structure and formatting.${documentContext}

Use proper markdown formatting throughout:
- ## for main sections
- ### for subsections
- Bullet points and numbered lists
- Bold and italic for emphasis
- Tables where data comparison is needed`;
        
        userPrompt = `Generate a comprehensive meta-analysis report for these ${documentNames.length} research documents: ${documentNames.join(', ')}.

Structure the report as follows:

## Executive Summary
High-level overview of the collective research body

## Research Overview
- Number of studies analyzed
- Research timeframe and contexts
- Primary research domains and themes

## Methodology Analysis
- Common methodological approaches
- Sample sizes and study designs
- Data collection methods

## Key Findings Synthesis
- Convergent findings across studies
- Divergent or conflicting results
- Statistical significance patterns
- Effect sizes and outcomes

## Trends and Patterns
- Temporal trends
- Geographical or contextual patterns
- Evolution of findings

## Limitations and Gaps
- Common limitations
- Research gaps identified
- Areas requiring further investigation

## Practical Implications
- Real-world applications
- Recommendations for practitioners
- Policy implications

## Conclusion
Overall contribution of this body of research`;
        break;

      case 'chat':
      default:
        if (!message) {
          throw new Error('Message is required for chat mode');
        }
        systemPrompt = `You are a helpful research assistant specializing in biomedical and pharmaceutical research. Answer questions clearly and cite relevant information when possible. Use markdown formatting for clarity.${documentContext}`;
        userPrompt = message;
        break;
    }

    // Build messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userPrompt }
    ];

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I couldn\'t generate a response.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-documents:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});