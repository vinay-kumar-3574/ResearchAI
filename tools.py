from langchain.tools import tool
import requests
import re
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os 
from dotenv import load_dotenv
from rich import print

load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

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

print(web_scrapper.invoke("https://en.wikipedia.org/wiki/Artificial_intelligence"))


