-- ============================================================
-- ResearchAI — Database Views
-- ============================================================
-- Run this AFTER schema.sql.
-- These views simplify common frontend queries by pre-joining
-- related tables.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- VIEW 1: Dashboard Stats
-- ────────────────────────────────────────────────────────────
-- Returns aggregated statistics for the authenticated user's
-- dashboard: total sessions, average score, this month count,
-- and latest research info.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
    rs.user_id,
    COUNT(*)::INTEGER                                           AS total_researches,
    ROUND(AVG(rs.overall_score), 1)                             AS average_score,
    COUNT(*) FILTER (
        WHERE rs.created_at >= date_trunc('month', now())
    )::INTEGER                                                  AS this_month_count,
    MAX(rs.created_at)                                          AS last_research_date,
    (
        SELECT topic
        FROM public.research_sessions sub
        WHERE sub.user_id = rs.user_id
        ORDER BY sub.created_at DESC
        LIMIT 1
    )                                                           AS last_research_topic
FROM public.research_sessions rs
WHERE rs.status = 'completed'
GROUP BY rs.user_id;

COMMENT ON VIEW public.dashboard_stats IS 'Aggregated dashboard statistics per user (total, average score, this month, latest)';


-- ────────────────────────────────────────────────────────────
-- VIEW 2: Research History (with report preview)
-- ────────────────────────────────────────────────────────────
-- Returns a list of all research sessions with a short
-- preview of the report content, used for the history page
-- and recent research cards on the dashboard.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.research_history AS
SELECT
    rs.id,
    rs.user_id,
    rs.topic,
    rs.status,
    rs.overall_score,
    rs.created_at,
    rs.updated_at,
    LEFT(rr.report_content, 200)                                AS report_preview
FROM public.research_sessions rs
LEFT JOIN public.research_reports rr ON rr.session_id = rs.id
ORDER BY rs.created_at DESC;

COMMENT ON VIEW public.research_history IS 'Research sessions with report preview snippet for history/dashboard display';


-- ────────────────────────────────────────────────────────────
-- VIEW 3: Full Research Detail
-- ────────────────────────────────────────────────────────────
-- Returns complete research session data with the report
-- and critic review joined in, used for the Research Detail
-- page (/research/:id).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.research_detail AS
SELECT
    rs.id                           AS session_id,
    rs.user_id,
    rs.topic,
    rs.status,
    rs.overall_score,
    rs.search_completed_at,
    rs.scrape_completed_at,
    rs.report_completed_at,
    rs.critique_completed_at,
    rs.created_at,

    -- Report data
    rr.report_content,

    -- Scraped content
    sc.source_url                   AS scraped_url,
    sc.content                      AS scraped_content,

    -- Critic review data
    cr.clarity_score,
    cr.research_depth_score,
    cr.accuracy_score,
    cr.analysis_insights_score,
    cr.structure_score,
    cr.source_quality_score,
    cr.strengths,
    cr.weaknesses,
    cr.missing_opportunities,
    cr.specific_improvements,
    cr.final_verdict,
    cr.full_review

FROM public.research_sessions rs
LEFT JOIN public.research_reports  rr ON rr.session_id = rs.id
LEFT JOIN public.scraped_contents  sc ON sc.session_id = rs.id
LEFT JOIN public.critic_reviews    cr ON cr.session_id = rs.id;

COMMENT ON VIEW public.research_detail IS 'Full research session with report, scraped content, and critic review joined';
