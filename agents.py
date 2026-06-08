from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from  langchain_core.output_parsers import StrOutputParser
from tools import web_search,web_scrapper

import os
from dotenv import load_dotenv


load_dotenv()
llm = ChatGroq(
    model="qwen/qwen3-32b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.2
)



def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search]
    )


def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[web_scrapper]

    )

# writer chain 

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

#critic chain

critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are a senior research reviewer with expertise in academic writing,
fact-checking, and analytical reporting.

Your task is to critically evaluate research reports.

Be rigorous, objective, and specific.
Do not give inflated scores.
A report should only receive:
- 9-10 if it is exceptional and publication-ready
- 7-8 if it is strong but has notable weaknesses
- 5-6 if it is average
- Below 5 if it lacks depth, evidence, structure, or accuracy

Evaluate:
1. Clarity and readability
2. Depth of research
3. Accuracy and factual consistency
4. Quality of insights and analysis
5. Structure and organization
6. Coverage of important aspects
7. Source quality and credibility
8. Missing information or weaknesses

Provide actionable feedback that can improve the report.
"""
    ),
    (
        "human",
        """
Review the research report below and evaluate it thoroughly.

REPORT:
{report}

Return your response in EXACTLY this format:

Overall Score: X/10

Category Scores:
- Clarity: X/10
- Research Depth: X/10
- Accuracy: X/10
- Analysis & Insights: X/10
- Structure: X/10
- Source Quality: X/10

Strengths:
- Point 1
- Point 2
- Point 3

Weaknesses:
- Point 1
- Point 2
- Point 3

Missing Opportunities:
- Point 1
- Point 2

Specific Improvements:
1. ...
2. ...
3. ...

Final Verdict:
A concise 2-3 sentence assessment of the report's overall quality and readiness.
"""
    ),
])

critic_chain = critic_prompt | llm | StrOutputParser()

 