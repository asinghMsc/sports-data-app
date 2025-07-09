import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// supabse and serve

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY - Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST'){
    return new Response('Method not Allowed', 
      { status: 405 });
  }

  try {
    const { url: rssUrl, sourceId } = await req.json();

    if (!rssUrl || !sourceId) {
      return new Response(JSON.stringify({
        error: 'Missing RSS URL or Source ID',
        { status: 400 };
      }))
    }

    //try rss2json api
    const rssToJsonApiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}';
    const rssResponse = await fetch(rssToJsonApiUrl);
    const rssData = await rssResponse.json()

    if (rssData.status !=='ok'){
      console.error('RSS2JSON API ERROR:', rssData.message);
      return new Response(JSON.stringify({ error: 'Failed to parse RSS: ${rssData.message'}),
    { status: 500 });

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
            console.log('skipping duplicate article for source ${sourceId}:${item.link}');
            continue;
          }
          throw insertError;
        }

        insertedcount++;
        const newArticle = data[0];

        //trigger ai processing for every new article, auth here for process article ai if we make private

        await supabase.functions.invoke('process-article-ai', {
          body: { article_id: newArticle.id, article_content: newArticle.content },
        });

      } catch (articleProcessError){
        console.error('ERror processing single article:', articleProcessError);
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
      headers: { 'Content-Type': 'application/json', 'Access-Controle-Allow-Origin': '*'},
      status: 500,
    });
  }

});