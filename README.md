# sports-data-app
Technical Challenge


# Plan 

1) supabase backend first :

## setup CLI , project

1) DB schema setup  
 * sources
 * articles
 * teams



- Needs two edge functions 
2) RSS ingestion - xml parsing maybe try RSS to JSON see if it works out of the gate to save some time and operational efficiency, if not maybe write a parser for the XML 

3) Process articles - 

- Retrieve article data, ID and content 
- moderate the content i think the moderation API from oAI will suffice
{ prompt should include below - start simple iterate after test, request json explicitly if using rss2json
- classify content
- sentiment 
- Identify teams
}
- update databases respectively


#######frontend####

React
ShadCN

