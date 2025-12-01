import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

    let systemPrompt = '';
    let userPrompt = '';

    // Configure prompts based on mode
    switch (mode) {
      case 'summarize':
        systemPrompt = documentId && documentId !== 'all'
          ? 'You are a research assistant. Provide a comprehensive summary of the research document, including: 1) Main objectives, 2) Methodology, 3) Key findings, 4) Conclusions, 5) Implications. Be detailed but concise.'
          : 'You are a research assistant. Provide a comprehensive summary synthesizing all uploaded research documents. Identify common themes, methodologies, and key findings across the papers.';
        userPrompt = 'Please provide a detailed summary of the document(s).';
        break;

      case 'key-findings':
        systemPrompt = documentId && documentId !== 'all'
          ? 'You are a research assistant. Extract and list the key findings from the research document. Focus on: 1) Main discoveries, 2) Statistical significance, 3) Novel contributions, 4) Practical implications. Use bullet points for clarity.'
          : 'You are a research assistant. Extract and synthesize key findings across all research documents. Identify patterns, contradictions, and consensus findings.';
        userPrompt = 'Please extract the key findings from the document(s).';
        break;

      case 'compare':
        if (!documentIds || documentIds.length < 2) {
          throw new Error('At least 2 documents required for comparison');
        }
        systemPrompt = 'You are a research assistant performing comparative analysis. Compare the selected research documents focusing on: 1) Research objectives and questions, 2) Methodologies used, 3) Key findings and results, 4) Conclusions and implications, 5) Strengths and limitations. Highlight similarities, differences, and complementary insights.';
        userPrompt = `Please provide a detailed comparative analysis of ${documentIds.length} research documents.`;
        break;

      case 'meta-analysis':
        if (!documentIds || documentIds.length < 2) {
          throw new Error('At least 2 documents required for meta-analysis');
        }
        systemPrompt = `You are a research meta-analyst. Analyze the ${documentIds.length} selected documents as a cohesive body of research and generate a comprehensive meta-analysis report with the following structure:

## Executive Summary
Provide a high-level overview of the collective research

## Research Overview
- Total number of studies analyzed
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
- Temporal trends in the research
- Geographical or contextual patterns
- Evolution of findings over time

## Limitations and Gaps
- Common limitations across studies
- Research gaps identified
- Areas requiring further investigation

## Practical Implications
- Real-world applications
- Recommendations for practitioners
- Policy implications

## Conclusion
Synthesize the overall contribution of this body of research`;
        userPrompt = `Please generate a comprehensive meta-analysis report for these ${documentIds.length} research documents.`;
        break;

      case 'chat':
      default:
        if (!message) {
          throw new Error('Message is required for chat mode');
        }
        systemPrompt = documentId && documentId !== 'all'
          ? 'You are a helpful research assistant. Answer questions about the specific research document the user is asking about. Be precise and cite relevant sections when possible.'
          : 'You are a helpful research assistant. Answer questions by synthesizing information across all uploaded research documents. Provide comprehensive answers and cite which documents you are referencing when relevant.';
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
        max_tokens: 2000
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