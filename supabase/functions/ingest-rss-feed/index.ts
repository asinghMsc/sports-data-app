import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// supabse and serve

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST'){
    return new Response('Method not Allowed',
      { status: 405 });
  }

  try {
    // Read the raw request body as text first to inspect it
    const rawBody = await req.text();
    console.log('Received raw request body:', rawBody); 

    // Attempt to parse the raw text body as JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (jsonError) {
      console.error('Failed to parse JSON body:', jsonError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON format in request body',
        details: jsonError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { url: rssUrl, sourceId } = parsedBody;

    if (!rssUrl || !sourceId) {
      // Handle missing parameters with an error response
      console.error('Missing rssUrl or sourceId in request body');
      return new Response(JSON.stringify({
        error: 'Missing required parameters: url and sourceId',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // The rest of the function logic now proceeds only if url and sourceId are present

    //try rss2json api
    const rssToJsonApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const rssResponse = await fetch(rssToJsonApiUrl);
    const rssData = await rssResponse.json()

    if (rssData.status !== 'ok') {
      console.error('Failed to parse RSS:', rssData.message);
      // {{change 1}}
      return new Response(JSON.stringify({ error: `Failed to parse RSS: ${rssData.message}` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    let insertedCount = 0;
    for (const item of rssData.items) {
      try{
        const { data, error:insertError } = await supabase
          .from('articles')
          .insert({
            source_id: sourceId,
            title: item.title,
            link: item.link,
            published_at: new Date(item.pubDate).toISOString(),
            content: item.description || item.content,
          })
          .select();

        if (insertError) {
          if (insertError.code == 23505) {
            console.log(`skipping duplicate article for source ${sourceId}:${item.link}`);
            continue;
          }
          throw insertError;
        }

        
        insertedCount++;
        const newArticle = data[0];

        //trigger ai processing for every new article, auth here for process article ai if we make private

        await supabase.functions.invoke('process-article-ai', {
          body: { article_id: newArticle.id, article_content: newArticle.content },
        });

      } catch (articleProcessError){
        console.error('Error processing single article:', articleProcessError);
      }
    }

    await supabase.from('sources')
        .update({ last_crawled_at: new Date().toISOString() })
        .eq( 'id', sourceId);

    return new Response(JSON.stringify({ success: true, count: insertedCount }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
      status: 200,
    });

  } catch (error) {
    console.error('Ingestion Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
      status: 500,
    });
  }

});