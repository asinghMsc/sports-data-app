import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from "https://deno.land/x/openai@v4.68.1/mod.ts";

// supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY - Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY);

//init OAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

//serve

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not Allowed', { status: 405 });
  }

  try {
    const { article_id, article_content } = await req.json();

    if (!article_id || !article_content) {
      return new Response(JSON.stringify({error: 'Missing article_id or article_content'}), { status: 400 });
    }

    let updateData: {
      category?: string;
      sentiment?: string;
      teams_mentioned?: string[];
      is_flagged?: boolean;
      moderation_categories?: record<string, number>;
    } = {};

    // content moderation 
    try {
      const moderationResponse = await.openai.moderations.create({
        input: article_content,
      });
      const result - moderationResponse.results[0];

      // flag but then killl it or just proceed for now? since it's a demo hm - proceed for now
      if (result.flagged) {
        console.warn(`Article ${article_id} flagged for moderation. Categories:`, result.categories)
        updateData.is_flagged = true;
        updateData.moderation_categories = result.categories;
      } else {
        updateData.is_flagged = false;
        updateData.moderation_cateogires = {};
      }
    } catch (moderationError) {
      console.error('Error with openAI moderation API for article', article_id, ':', moderationError);
      // don't fail , just log and continue
    }

    // classify, sentiment, team extraction 
    const classificationPrompt = `Analyse the following Football (not soccer) article and provide a JSON response.
    1. Classify its type as 'News', 'Opinion', or 'Banter'.
    2. DEtermine its sentiment as 'Positive', 'Negative', or 'Neutral'.
    3. List all specific football team names mentioned. If no teams are mentioned, use an empty array.

    Format your output as a JSON object with keys 'type', 'sentiment', and 'teams'.

    Article:
    ${article_content}
    
    `;


  }




})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-article-ai' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/