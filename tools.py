from langchain.tools import tool
import requests
import re
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os 
from dotenv import load_dotenv
from rich import print
from exa_py import Exa
from firecrawl import Firecrawl

load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

exa_key = os.getenv("EXA_API_KEY")
exa = Exa(api_key=exa_key) if exa_key else None

fc_key = os.getenv("FIRECRAWL_API_KEY")
firecrawl = Firecrawl(api_key=fc_key) if fc_key else None

@tool
def web_search(query:str)->str:
    """
    Perform a web search for recent and reliable information on the topic.Returns Titles,URLs and snippets of the search results
    """
    try:
        response = tavily.search(query=query,max_results=5)
        out=[]
        for r in response['results']:
            out.append(f"Title: {r['title']}\nURL: {r['url']}\n Content: {r['content'][:500]}")
        return "\n".join(out)
        
    except Exception as e:  
        return f"Error: {str(e)}"
    

# print(web_search.invoke("What is the current stock price of Google today? "))


@tool
def web_scrapper(url:str)->str:
    """
    Scrape and retrun clean text content from given URL for deeper reading.
    """
    try:
        response = requests.get(url,timeout=8,headers={"User-Agent":"Mozilla/5.0"})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)[:3000]
    except requests.RequestException as e:
        return f"Error fetching URL: {e}"
    except Exception as e:
        return f"Error parsing content: {e}"

# Debug call removed — was firing on every import
# print(web_scrapper.invoke("https://en.wikipedia.org/wiki/Artificial_intelligence"))


@tool
def exa_search(query: str, academic: bool = False) -> str:
    """
    Perform a deep web search using Exa. 
    Set academic=True ONLY if searching for academic papers.
    """
    try:
        if not exa:
            return "Exa API key not configured."
        kwargs = {
            "type": "auto",
            "num_results": 5,
            "contents": {"highlights": True}
        }
        if academic:
            kwargs["include_domains"] = ["arxiv.org", "pubmed.ncbi.nlm.nih.gov", "researchgate.net", "nature.com"]
            
        response = exa.search(query, **kwargs)
        out = []
        for r in response.results:
            highlights = " ".join(r.highlights) if r.highlights else ""
            out.append(f"Title: {r.title}\nURL: {r.url}\nHighlights: {highlights}")
        return "\n".join(out)
    except Exception as e:
        return f"Error with Exa Search: {str(e)}"


@tool
def firecrawl_scraper(url: str) -> str:
    """
    Scrape javascript-rendered and dynamic websites using Firecrawl.
    Returns clean markdown content. Always try this first for modern websites.
    """
    try:
        if not firecrawl:
            raise ValueError("Firecrawl API key not configured.")
        result = firecrawl.scrape(url)
        content = getattr(result, "markdown", None)
        if not content:
            raise ValueError("Empty content from Firecrawl")
        return content
    except Exception as e:
        print(f"Firecrawl failed ({e}), falling back to BeautifulSoup...")
        fallback_content = web_scrapper.invoke({"url": url})
        return f"Firecrawl failed, fallback to BeautifulSoup used.\n\n{fallback_content}"

