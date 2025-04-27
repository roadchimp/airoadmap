--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Homebrew)
-- Dumped by pg_dump version 15.12 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_capabilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_capabilities (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    implementation_effort text,
    business_value text,
    ease_score text,
    value_score text
);


ALTER TABLE public.ai_capabilities OWNER TO postgres;

--
-- Name: ai_capabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_capabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_capabilities_id_seq OWNER TO postgres;

--
-- Name: ai_capabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_capabilities_id_seq OWNED BY public.ai_capabilities.id;


--
-- Name: ai_tools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_tools (
    tool_id integer NOT NULL,
    tool_name text NOT NULL,
    description text,
    website_url text,
    license_type text,
    primary_category text,
    tags jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tools OWNER TO postgres;

--
-- Name: ai_tools_tool_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_tools_tool_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_tools_tool_id_seq OWNER TO postgres;

--
-- Name: ai_tools_tool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_tools_tool_id_seq OWNED BY public.ai_tools.tool_id;


--
-- Name: assessment_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_responses (
    response_id integer NOT NULL,
    assessment_id integer NOT NULL,
    user_id integer NOT NULL,
    question_identifier text NOT NULL,
    response_text text,
    response_numeric numeric,
    response_boolean boolean,
    response_json jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assessment_responses OWNER TO postgres;

--
-- Name: assessment_responses_response_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_responses_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assessment_responses_response_id_seq OWNER TO postgres;

--
-- Name: assessment_responses_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_responses_response_id_seq OWNED BY public.assessment_responses.response_id;


--
-- Name: assessment_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_results (
    result_id integer NOT NULL,
    assessment_id integer NOT NULL,
    identified_themes jsonb,
    ranked_priorities jsonb,
    recommended_capabilities jsonb,
    capability_rationale jsonb,
    existing_tool_analysis text,
    recommended_tools jsonb,
    rollout_commentary text,
    heatmap_data jsonb,
    processing_status text DEFAULT 'Pending'::text NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.assessment_results OWNER TO postgres;

--
-- Name: assessment_results_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_results_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assessment_results_result_id_seq OWNER TO postgres;

--
-- Name: assessment_results_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_results_result_id_seq OWNED BY public.assessment_results.result_id;


--
-- Name: assessment_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_scores (
    id integer NOT NULL,
    wizard_step_id text NOT NULL,
    time_savings numeric NOT NULL,
    quality_impact numeric NOT NULL,
    strategic_alignment numeric NOT NULL,
    data_readiness numeric NOT NULL,
    technical_feasibility numeric NOT NULL,
    adoption_risk numeric NOT NULL,
    value_potential_total numeric NOT NULL,
    ease_of_implementation_total numeric NOT NULL,
    total_score numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.assessment_scores OWNER TO postgres;

--
-- Name: assessment_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assessment_scores_id_seq OWNER TO postgres;

--
-- Name: assessment_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_scores_id_seq OWNED BY public.assessment_scores.id;


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessments (
    id integer NOT NULL,
    title text NOT NULL,
    organization_id integer NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    step_data jsonb
);


ALTER TABLE public.assessments OWNER TO postgres;

--
-- Name: assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assessments_id_seq OWNER TO postgres;

--
-- Name: assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessments_id_seq OWNED BY public.assessments.id;


--
-- Name: capability_tool_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capability_tool_mapping (
    mapping_id integer NOT NULL,
    capability_id integer NOT NULL,
    tool_id integer NOT NULL,
    notes text
);


ALTER TABLE public.capability_tool_mapping OWNER TO postgres;

--
-- Name: capability_tool_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.capability_tool_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.capability_tool_mapping_mapping_id_seq OWNER TO postgres;

--
-- Name: capability_tool_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.capability_tool_mapping_mapping_id_seq OWNED BY public.capability_tool_mapping.mapping_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: job_descriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_descriptions (
    id integer NOT NULL,
    title text NOT NULL,
    company text,
    location text,
    job_board text NOT NULL,
    source_url text NOT NULL,
    raw_content text NOT NULL,
    processed_content jsonb,
    keywords text[],
    date_scraped timestamp without time zone DEFAULT now() NOT NULL,
    date_processed timestamp without time zone,
    status text DEFAULT 'raw'::text NOT NULL,
    error text
);


ALTER TABLE public.job_descriptions OWNER TO postgres;

--
-- Name: job_descriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_descriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_descriptions_id_seq OWNER TO postgres;

--
-- Name: job_descriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_descriptions_id_seq OWNED BY public.job_descriptions.id;


--
-- Name: job_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_roles (
    id integer NOT NULL,
    title text NOT NULL,
    department_id integer NOT NULL,
    description text,
    key_responsibilities text[],
    ai_potential text
);


ALTER TABLE public.job_roles OWNER TO postgres;

--
-- Name: job_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_roles_id_seq OWNER TO postgres;

--
-- Name: job_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_roles_id_seq OWNED BY public.job_roles.id;


--
-- Name: job_scraper_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_scraper_configs (
    id integer NOT NULL,
    name text NOT NULL,
    target_website text NOT NULL,
    keywords text[],
    location text,
    is_active boolean DEFAULT true NOT NULL,
    cron_schedule text DEFAULT '0 0 * * *'::text NOT NULL,
    last_run timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.job_scraper_configs OWNER TO postgres;

--
-- Name: job_scraper_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_scraper_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_scraper_configs_id_seq OWNER TO postgres;

--
-- Name: job_scraper_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_scraper_configs_id_seq OWNED BY public.job_scraper_configs.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name text NOT NULL,
    industry text NOT NULL,
    size text NOT NULL,
    description text
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organizations_id_seq OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    generated_at timestamp without time zone DEFAULT now() NOT NULL,
    executive_summary text,
    prioritization_data jsonb,
    ai_suggestions jsonb,
    performance_impact jsonb,
    consultant_commentary text
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'consultant'::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ai_capabilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_capabilities ALTER COLUMN id SET DEFAULT nextval('public.ai_capabilities_id_seq'::regclass);


--
-- Name: ai_tools tool_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_tools ALTER COLUMN tool_id SET DEFAULT nextval('public.ai_tools_tool_id_seq'::regclass);


--
-- Name: assessment_responses response_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_responses ALTER COLUMN response_id SET DEFAULT nextval('public.assessment_responses_response_id_seq'::regclass);


--
-- Name: assessment_results result_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results ALTER COLUMN result_id SET DEFAULT nextval('public.assessment_results_result_id_seq'::regclass);


--
-- Name: assessment_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_scores ALTER COLUMN id SET DEFAULT nextval('public.assessment_scores_id_seq'::regclass);


--
-- Name: assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments ALTER COLUMN id SET DEFAULT nextval('public.assessments_id_seq'::regclass);


--
-- Name: capability_tool_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capability_tool_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.capability_tool_mapping_mapping_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: job_descriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_descriptions ALTER COLUMN id SET DEFAULT nextval('public.job_descriptions_id_seq'::regclass);


--
-- Name: job_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_roles ALTER COLUMN id SET DEFAULT nextval('public.job_roles_id_seq'::regclass);


--
-- Name: job_scraper_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_scraper_configs ALTER COLUMN id SET DEFAULT nextval('public.job_scraper_configs_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: ai_capabilities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_capabilities (id, name, category, description, implementation_effort, business_value, ease_score, value_score) FROM stdin;
\.


--
-- Data for Name: ai_tools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_tools (tool_id, tool_name, description, website_url, license_type, primary_category, tags, created_at, updated_at) FROM stdin;
1	Google Cloud Natural Language API	Google Cloud Natural Language API uses machine learning to understand text and extract information about people, places, and events. It provides features like sentiment analysis, entity analysis, and syntax analysis, enabling applications to understand the context and meaning of text.	https://cloud.google.com/natural-language	Commercial	NLP	["NLP", "machine learning", "text analysis", "Google Cloud"]	2025-04-25 16:16:25.41386	2025-04-25 16:16:25.41386
2	IBM Watson Natural Language Understanding	IBM Watson Natural Language Understanding is a cloud-native product that uses deep learning to analyze text for concepts, entities, keywords, categories, sentiment, emotion, and more. It helps businesses to understand complex text and make better data-driven decisions.	https://www.ibm.com/cloud/watson-natural-language-understanding	Commercial	NLP	["NLP", "IBM Watson", "text analytics", "sentiment analysis"]	2025-04-25 16:16:25.426463	2025-04-25 16:16:25.426463
3	spaCy	spaCy is an open-source software library for advanced natural language processing, designed specifically for production use. It supports over 60 languages and offers features like tokenization, named entity recognition, part of speech tagging, and dependency parsing.	https://spacy.io	Open Source	NLP	["NLP", "open source", "text processing", "language models"]	2025-04-25 16:16:25.432167	2025-04-25 16:16:25.432167
4	OpenAI GPT-3	GPT-3, developed by OpenAI, is one of the most powerful language processing AI models available. It excels in understanding and generating human-like text, enabling applications to perform tasks like translation, summarization, and question answering.	https://openai.com/gpt-3	Commercial	NLP	["NLP", "OpenAI", "language model", "text generation"]	2025-04-25 16:16:25.437739	2025-04-25 16:16:25.437739
5	Hugging Face Transformers	Transformers library by Hugging Face provides state-of-the-art general-purpose architectures for natural language understanding and generation. It includes thousands of pre-trained models, including models for text response generation like BERT, GPT-2, and RoBERTa, which can be fine-tuned for specific tasks.	https://huggingface.co/transformers	Open Source	NLP	["AI", "NLP", "machine learning", "Hugging Face", "Transformers", "text generation"]	2025-04-25 16:16:25.448468	2025-04-25 16:16:25.448468
6	IBM Watson Assistant	IBM Watson Assistant is a conversational AI platform designed to generate human-like text responses in various applications, such as customer service bots. It uses natural language understanding and machine learning to interpret user inputs and generate relevant responses.	https://www.ibm.com/cloud/watson-assistant	Commercial	NLP	["AI", "NLP", "IBM Watson", "chatbot", "customer service"]	2025-04-25 16:16:25.485764	2025-04-25 16:16:25.485764
7	Google Cloud Natural Language AI	Google Cloud Natural Language AI provides a suite of language understanding technologies, including an API that can be used for generating text responses. It leverages Google's machine learning technology to understand and generate human-like text for a variety of applications.	https://cloud.google.com/natural-language	Commercial	NLP	["AI", "NLP", "Google Cloud", "text generation", "machine learning"]	2025-04-25 16:16:25.498752	2025-04-25 16:16:25.498752
8	Elasticsearch	Elasticsearch is a distributed, RESTful search and analytics engine capable of addressing a large number of use cases, including knowledge base integration. It allows users to store, search, and analyze big volumes of data quickly and in near real time. Elasticsearch is commonly used to enable search capabilities over documents and content within a knowledge base.	https://www.elastic.co/elasticsearch/	Open Source	Search Engine	["search engine", "analytics", "big data", "real-time"]	2025-04-25 16:16:25.504825	2025-04-25 16:16:25.504825
9	Algolia	Algolia provides a hosted search API that enables developers to integrate search functionality into their applications and knowledge bases. It offers a powerful, fast, and scalable search experience with features like typo tolerance, filters, and synonyms that enhance the retrieval of information from knowledge repositories.	https://www.algolia.com/	Freemium	Search API	["hosted API", "search", "scalable", "typo tolerance"]	2025-04-25 16:16:25.510543	2025-04-25 16:16:25.510543
10	Apache Solr	Apache Solr is an open-source search platform built on Apache Lucene. It is highly reliable, scalable, and fault tolerant, providing distributed indexing, replication, and load-balanced querying with a centralized configuration. Solr is widely used for enterprise search and analytics use cases, including integrating with knowledge bases to facilitate information retrieval.	https://solr.apache.org/	Open Source	Search Platform	["enterprise search", "indexing", "Apache Lucene", "scalable"]	2025-04-25 16:16:25.516246	2025-04-25 16:16:25.516246
11	Microsoft Azure Cognitive Search	Azure Cognitive Search is a cloud search service with built-in AI capabilities that enrich all types of information to easily identify and explore relevant content at scale. It supports integration with knowledge bases, providing capabilities such as natural language processing, AI-powered insights, and complex search queries over structured and unstructured data.	https://azure.microsoft.com/en-us/services/search/	Commercial	Cloud Search Service	["cloud service", "AI capabilities", "NLP", "data insights"]	2025-04-25 16:16:25.521408	2025-04-25 16:16:25.521408
12	RFPIO	RFPIO is a response management platform that uses AI to help streamline the process of responding to RFPs (Request for Proposals). It features advanced capabilities to automatically extract questions from RFP documents and uses a content library to generate accurate and relevant draft responses. This helps organizations save time and improve the quality of their proposal submissions.	https://www.rfpio.com	Commercial	Document Processing	["RFP", "automation", "document processing", "AI", "proposal management"]	2025-04-25 16:16:25.526035	2025-04-25 16:16:25.526035
13	Loopio	Loopio is a platform designed to help businesses manage RFP responses more efficiently. It leverages machine learning to automatically extract questions from RFPs and populate answers using a pre-built library. Loopio also facilitates collaboration among team members, making it easier to craft tailored responses to complex RFPs.	https://www.loopio.com	Commercial	Document Processing	["RFP", "response automation", "collaboration", "machine learning"]	2025-04-25 16:16:25.541738	2025-04-25 16:16:25.541738
14	Qvidian	Qvidian by Upland Software offers automated RFP and proposal generation tools that help organizations increase efficiency in their sales cycles. The tool uses AI to analyze RFP documents, extract pertinent questions, and assist in creating detailed, customized responses based on a centralized content database.	https://uplandsoftware.com/qvidian/	Commercial	Document Processing	["RFP", "proposal automation", "sales enablement", "content management"]	2025-04-25 16:16:25.546978	2025-04-25 16:16:25.546978
15	Tableau	Tableau is a powerful data visualization tool that allows users to create interactive and shareable dashboards. It helps in analyzing sales data by providing features like trend analysis, forecasting, and segmentation, which can be used to identify patterns and opportunities in sales data.	https://www.tableau.com	Commercial	Data Visualization	["data visualization", "sales analysis", "trend analysis", "forecasting"]	2025-04-25 16:16:25.551657	2025-04-25 16:16:25.551657
81	Seismic	Seismic is a sales enablement platform that leverages AI to personalize sales materials and automate the preparation process. It ensures that sales teams are equipped with the right information and strategies throughout the sales cycle.	https://www.seismic.com	Commercial	Sales Enablement	["Sales Content Management", "AI", "Personalization", "Sales Automation"]	2025-04-25 16:16:25.845396	2025-04-25 16:16:25.845396
16	Microsoft Power BI	Microsoft Power BI is a suite of business analytics tools that deliver insights throughout your organization. It enables users to connect to hundreds of data sources, simplify data prep, and drive ad hoc analysis for sales data. Power BI provides robust analytics and reporting features to help identify trends and opportunities in sales.	https://powerbi.microsoft.com	Freemium	Business Intelligence	["business intelligence", "data analysis", "reporting", "sales data"]	2025-04-25 16:16:25.555055	2025-04-25 16:16:25.555055
17	Looker	Looker is a business intelligence software and big data analytics platform that helps you explore, analyze and share real-time business analytics easily. It facilitates the analysis of sales data through its robust data modeling and visualization capabilities, helping businesses uncover trends and make data-driven decisions.	https://looker.com	Commercial	Business Intelligence	["business intelligence", "data analytics", "visualization", "sales trends"]	2025-04-25 16:16:25.558406	2025-04-25 16:16:25.558406
18	Sisense	Sisense empowers analysts and business users to simplify complex data and provide insights using powerful dashboarding and data analytics tools. It supports sales data analysis by allowing users to merge data from different sources and visualize data to identify trends and generate actionable insights.	https://www.sisense.com	Commercial	Business Intelligence	["data integration", "analytics", "dashboard", "sales insights"]	2025-04-25 16:16:25.561255	2025-04-25 16:16:25.561255
19	Qlik Sense	Qlik Sense is a self-service data analytics and visualization tool that uses an associative analytics engine, sophisticated AI, and high performance cloud platform to help users make data-driven decisions. It is particularly effective in analyzing sales data, offering dynamic visualizations and interactive dashboards for spotting trends and opportunities.	https://www.qlik.com	Commercial	Data Visualization	["data visualization", "self-service analytics", "AI", "sales data analysis"]	2025-04-25 16:16:25.564006	2025-04-25 16:16:25.564006
20	Jasper	Jasper is an AI-powered content generation tool that helps users create high-quality content for blogs, social media, websites, and more. It uses machine learning to understand context and generate relevant and engaging content.	https://www.jasper.ai	Commercial	Content Creation	["content marketing", "AI writer", "blogging tool", "content automation"]	2025-04-25 16:16:25.570417	2025-04-25 16:16:25.570417
21	Writesonic	Writesonic is an AI tool designed to help with marketing content creation, including ads, emails, and blog posts. It uses artificial intelligence to generate creative and compelling text that captures attention and engages readers.	https://writesonic.com	Freemium	Content Creation	["digital marketing", "AI content generator", "copywriting tool", "content creation"]	2025-04-25 16:16:25.573426	2025-04-25 16:16:25.573426
22	CopyAI	CopyAI is an automated copywriting tool that uses AI to help users generate marketing copy instantly. It's designed to produce various types of content such as social media posts, blog posts, and email newsletters.	https://www.copy.ai	Freemium	Content Creation	["AI copywriting", "content generation", "marketing tool", "AI marketing"]	2025-04-25 16:16:25.576304	2025-04-25 16:16:25.576304
23	Clari	Clari uses AI to enhance visibility into the sales process, helping sales teams to forecast and manage quotas more effectively. It provides real-time insights into sales performance and predictive analytics to guide sales strategies, ensuring quota achievement.	https://www.clari.com/	Commercial	Sales Performance Management	["AI", "Sales Forecasting", "Quota Management", "Predictive Analytics"]	2025-04-25 16:16:25.579539	2025-04-25 16:16:25.579539
24	Xactly	Xactly offers a comprehensive suite of AI-driven sales performance management tools that help in setting, tracking, and analyzing sales quotas. It uses data-driven insights to optimize sales strategies and improve quota attainment.	https://www.xactlycorp.com/	Commercial	Sales Performance Management	["Sales Management", "Performance Tracking", "AI", "Quota Achievement"]	2025-04-25 16:16:25.582311	2025-04-25 16:16:25.582311
25	Anaplan	Anaplan's Connected Planning platform leverages AI to help sales teams manage and achieve their quotas. It provides tools for sales planning, forecasting, and scenario analysis, which help in making informed decisions to meet sales targets.	https://www.anaplan.com/	Commercial	Business Planning	["Sales Planning", "AI", "Forecasting", "Quota Management"]	2025-04-25 16:16:25.584811	2025-04-25 16:16:25.584811
26	Persado	Persado uses AI to generate persuasive language for communications tailored to audience segments. This tool leverages natural language processing and machine learning to craft messages that effectively communicate the value propositions of products or services to different customer profiles.	https://www.persado.com	Commercial	Marketing Automation	["AI Marketing", "NLP", "Machine Learning", "Value Proposition", "Customer Engagement"]	2025-04-25 16:16:25.588907	2025-04-25 16:16:25.588907
27	Phrasee	Phrasee uses AI to power its language generation for marketing copy, focusing on creating brand-consistent, engaging content that communicates a product’s value proposition effectively. It analyzes existing marketing language and audience reactions to tailor messages that resonate with specific customer segments.	https://www.phrasee.co	Commercial	Content Generation	["Content Marketing", "AI Writing", "Email Marketing", "Personalization", "Value Communication"]	2025-04-25 16:16:25.591895	2025-04-25 16:16:25.591895
28	Copy.ai	Copy.ai is an AI-powered tool that assists in generating marketing copy, including value propositions. It uses advanced algorithms to understand the product features and benefits, tailoring the communication to meet the specific needs of the target audience.	https://www.copy.ai	Freemium	AI Writing Assistant	["Copywriting", "AI Tool", "Marketing", "Value Proposition", "Automation"]	2025-04-25 16:16:25.594525	2025-04-25 16:16:25.594525
29	Salesforce Einstein	Salesforce Einstein is an AI layer integrated within the Salesforce platform that enhances CRM capabilities by providing AI-driven insights, predictions, and recommendations. It helps sales leaders by analyzing customer data to offer guidance on the most effective sales strategies and personalizing customer interactions to drive sales.	https://www.salesforce.com/products/einstein/overview/	Commercial	CRM AI	["AI", "CRM", "sales automation", "customer insights", "sales leadership"]	2025-04-25 16:16:25.597665	2025-04-25 16:16:25.597665
30	Outreach	Outreach is a sales engagement platform that leverages AI to optimize customer interactions. It assists sales leaders by automating routine tasks, providing actionable insights, and enabling personalized communication strategies that can influence sales outcomes.	https://www.outreach.io/	Commercial	Sales Engagement	["sales automation", "AI", "customer engagement", "sales productivity"]	2025-04-25 16:16:25.602781	2025-04-25 16:16:25.602781
31	Drift	Drift is an AI-powered conversational marketing platform that engages with potential customers at the early stages of the sales cycle. It provides personalized chatbot interactions that can demonstrate products, answer queries, and guide users through initial sales processes, effectively enhancing client understanding and engagement.	https://www.drift.com	Commercial	Conversational AI	["AI chatbot", "sales support", "customer engagement", "conversational marketing"]	2025-04-25 16:16:25.605447	2025-04-25 16:16:25.605447
98	x.ai	x.ai is an AI-powered tool that helps users schedule meetings effortlessly. It integrates with calendars to find the best times for meetings, coordinates with other parties, and automatically handles the booking process.	https://x.ai	Freemium	Productivity	["AI scheduling", "meeting coordination", "calendar integration"]	2025-04-25 16:16:25.979133	2025-04-25 16:16:25.979133
32	Salesforce Sales Cloud	Salesforce Sales Cloud provides advanced AI capabilities through its Einstein AI platform, which includes features for collaborative territory management. It allows sales teams to plan and optimize territories based on historical data and predictive analytics, enhancing collaboration and strategic decision-making.	https://www.salesforce.com/products/sales-cloud/overview/	Commercial	CRM	["collaborative territory management", "sales optimization", "predictive analytics", "CRM"]	2025-04-25 16:16:25.612583	2025-04-25 16:16:25.612583
33	Zoho CRM	Zoho CRM offers territory management that helps businesses design and manage multiple territories by analyzing sales performance and potential. It features collaborative tools that enable teams to work together in real-time, ensuring efficient territory alignment and maximizing sales opportunities.	https://www.zoho.com/crm/	Freemium	CRM	["territory management", "real-time collaboration", "sales analytics", "CRM"]	2025-04-25 16:16:25.6152	2025-04-25 16:16:25.6152
34	Microsoft Dynamics 365 Sales	Microsoft Dynamics 365 Sales integrates AI-driven insights to facilitate collaborative territory management. It helps in defining and managing territories, using AI to forecast sales and identify high-potential accounts within those territories. The platform supports collaboration across teams, ensuring aligned goals and strategies.	https://dynamics.microsoft.com/en-us/sales/overview/	Commercial	CRM	["AI insights", "territory management", "forecasting", "collaboration"]	2025-04-25 16:16:25.617628	2025-04-25 16:16:25.617628
35	Crayon	Crayon provides a competitive intelligence platform that enables businesses to track, analyze, and act on everything happening outside their four walls. Its features include capturing and analyzing competitor data which can be used to highlight a product's competitive advantages in demonstrations.	https://www.crayon.co	Commercial	Competitive Intelligence	["competitive analysis", "market intelligence", "product demonstration"]	2025-04-25 16:16:25.620307	2025-04-25 16:16:25.620307
36	Kompyte	Kompyte helps companies track their competitors in real-time and automatically reacts to their moves. It provides insights and analytics that can be used to demonstrate a product's superiority over competitors during sales pitches and marketing campaigns.	https://www.kompyte.com	Commercial	Competitive Intelligence	["real-time tracking", "competitive analysis", "sales enablement"]	2025-04-25 16:16:25.623109	2025-04-25 16:16:25.623109
37	Prisync	Prisync is a competitor price tracking and monitoring software for all sizes of e-commerce companies worldwide. It helps businesses to demonstrate competitive pricing strategies by providing detailed comparisons and analytics, which can be used to highlight cost advantages in product demonstrations.	https://www.prisync.com	Commercial	Pricing Intelligence	["price tracking", "e-commerce", "competitive pricing"]	2025-04-25 16:16:25.625572	2025-04-25 16:16:25.625572
38	Owler	Owler offers news alerts, company profiles, and polls about competitors, which can be leveraged to understand and demonstrate a product's unique position and advantages in the market.	https://www.owler.com	Freemium	Business Intelligence	["company news", "competitive insights", "market trends"]	2025-04-25 16:16:25.628665	2025-04-25 16:16:25.628665
39	Slack	Slack is a messaging app for teams that makes it easy for sales teams to communicate with technical departments in real-time. It supports integration with various AI and automation tools to streamline workflows and enhance collaboration.	https://slack.com	Freemium	Communication	["messaging", "collaboration", "real-time", "integration", "sales", "technical"]	2025-04-25 16:16:25.631284	2025-04-25 16:16:25.631284
40	Trello	Trello is a web-based Kanban-style list-making application which is great for managing projects across sales and technical teams. It allows users to create tasks, assign them to team members, and track progress collaboratively.	https://trello.com	Freemium	Project Management	["project management", "kanban", "task management", "collaboration", "sales", "technical"]	2025-04-25 16:16:25.633862	2025-04-25 16:16:25.633862
41	Microsoft Teams	Microsoft Teams is a unified communication and collaboration platform that combines persistent workplace chat, video meetings, file storage, and application integration. It is designed to help teams collaborate more effectively, and integrates with various sales and technical tools.	https://teams.microsoft.com	Commercial	Communication	["communication", "collaboration", "meetings", "chat", "sales", "technical"]	2025-04-25 16:16:25.636241	2025-04-25 16:16:25.636241
42	Asana	Asana is a project management tool that helps teams organize, track, and manage their work. It's particularly useful for sales and technical teams to collaborate on projects, with features that facilitate task assignments, deadlines, and updates.	https://asana.com	Freemium	Project Management	["project management", "task tracking", "collaboration", "sales", "technical"]	2025-04-25 16:16:25.638668	2025-04-25 16:16:25.638668
43	HubSpot Sales Hub	HubSpot Sales Hub utilizes machine learning to provide sales teams with insights into the most effective sales strategies and customer engagement techniques. It adapts recommendations based on ongoing sales data and market conditions.	https://www.hubspot.com/products/sales	Freemium	Sales Automation	["sales automation", "AI", "machine learning", "dynamic sales strategy"]	2025-04-25 16:16:25.646024	2025-04-25 16:16:25.646024
44	Gong.io	Gong.io uses AI to analyze communication data within sales teams to provide insights into customer interactions and sales processes. It helps sales professionals understand what strategies work best at different stages of the sales cycle and how to tailor their approach to meet the needs of each deal.	https://www.gong.io/	Commercial	Sales Enablement	["AI", "Sales Cycle", "Communication Analysis", "Sales Strategy"]	2025-04-25 16:16:25.655192	2025-04-25 16:16:25.655192
45	Chorus.ai	Chorus.ai is an AI-driven platform that records, transcribes, and analyzes sales calls to provide actionable insights. It helps in mentoring junior sales staff by identifying successful sales tactics and areas for improvement, offering personalized feedback based on real sales interactions.	https://www.chorus.ai	Commercial	Sales Enablement	["AI", "Sales Training", "Mentorship", "Call Analysis"]	2025-04-25 16:16:25.659624	2025-04-25 16:16:25.659624
46	Jiminny	Jiminny is a platform designed for coaching and developing sales teams. It uses AI to capture and analyze sales conversations, providing feedback and training modules tailored to individual needs, thereby enhancing the mentorship process for junior sales staff.	https://www.jiminny.com	Commercial	Sales Training	["AI", "Sales Development", "Training Platform", "Conversation Intelligence"]	2025-04-25 16:16:25.664388	2025-04-25 16:16:25.664388
47	MindTickle	MindTickle offers a sales readiness platform that uses AI to provide data-driven insights for sales training and coaching. It helps in creating personalized learning paths for junior sales staff, ensuring they are trained based on proven best practices and individual performance metrics.	https://www.mindtickle.com	Commercial	Sales Enablement	["Sales Readiness", "AI Training", "Personalized Learning", "Sales Performance"]	2025-04-25 16:16:25.667526	2025-04-25 16:16:25.667526
48	UiPath	UiPath is a Robotic Process Automation (RPA) tool that helps businesses automate repetitive tasks. It can be used to improve operational processes by enabling employees to design automation workflows, which can lead to increased efficiency and innovation in daily operations.	https://www.uipath.com/	Commercial	Robotic Process Automation	["RPA", "automation", "operational efficiency", "innovation"]	2025-04-25 16:16:25.680115	2025-04-25 16:16:25.680115
49	Pega Platform	Pega Platform is a digital process automation tool that helps organizations streamline operations and improve customer engagement. It provides AI-powered decisioning capabilities that allow employees to optimize and innovate operational processes, enhancing productivity and customer satisfaction.	https://www.pega.com/	Commercial	Business Process Management	["process automation", "AI decisioning", "customer engagement", "innovation"]	2025-04-25 16:16:25.683014	2025-04-25 16:16:25.683014
50	Kissflow	Kissflow is a cloud-based workflow and process automation platform that enables organizations to manage, automate, and optimize their business processes. It empowers employees to contribute to operational improvements by providing tools to create and modify workflows, thereby fostering a culture of continuous innovation.	https://kissflow.com/	Freemium	Workflow Automation	["workflow automation", "process management", "continuous improvement", "innovation"]	2025-04-25 16:16:25.685513	2025-04-25 16:16:25.685513
51	IBM Watson	IBM Watson offers AI and machine learning solutions that can be applied across various business operations to enhance decision-making and process efficiencies. It supports operational improvement by providing insights and predictive analytics, enabling employees to innovate and improve their work processes.	https://www.ibm.com/watson	Commercial	AI Platform	["AI", "machine learning", "predictive analytics", "operational improvement"]	2025-04-25 16:16:25.687903	2025-04-25 16:16:25.687903
52	Monday.com	Monday.com is a work operating system that allows teams to create workflow apps in minutes to run their processes, projects, and everyday work. Tools within Monday.com enable teams to continuously improve operational processes and foster innovation through better collaboration and workflow customization.	https://monday.com	Freemium	Project Management	["project management", "workflow customization", "collaboration", "innovation"]	2025-04-25 16:16:25.690311	2025-04-25 16:16:25.690311
53	Affinity	Affinity uses AI to analyze communication data and automatically capture relationship insights. It helps users manage executive relationships by providing insights into interaction histories and suggesting the best paths to strengthen these connections.	https://www.affinity.co/	Commercial	CRM	["relationship management", "executive engagement", "AI CRM"]	2025-04-25 16:16:25.692734	2025-04-25 16:16:25.692734
54	Nudge.ai	Nudge.ai is an AI-powered platform that provides relationship intelligence. It helps businesses understand and leverage their relationships with executives by offering actionable insights based on communication patterns and network strength.	https://nudge.ai/	Commercial	Relationship Intelligence	["AI networking", "executive relationships", "business intelligence"]	2025-04-25 16:16:25.69548	2025-04-25 16:16:25.69548
55	BoardEx	BoardEx is an advanced analytics platform that focuses on relationship mapping. It helps organizations identify and leverage connections with key executives, providing detailed profiles and relationship strength indicators.	https://www.boardex.com/	Commercial	Analytics	["executive relationships", "relationship mapping", "strategic planning"]	2025-04-25 16:16:25.697937	2025-04-25 16:16:25.697937
56	PathFactory	PathFactory employs AI to analyze customer engagement with content across various channels, helping businesses understand customer interests and pain points. This data allows companies to develop a deep understanding of the customer's business needs and tailor their marketing and sales strategies accordingly.	https://www.pathfactory.com	Commercial	Content Marketing	["Content Engagement", "AI", "Marketing Automation", "Customer Understanding"]	2025-04-25 16:16:25.70289	2025-04-25 16:16:25.70289
57	Node	Node uses artificial intelligence to discover new business opportunities by analyzing relationships between people, companies, products, and markets. This tool helps in understanding the customer's business context, strategic goals, and industry dynamics, enabling personalized solution offerings.	https://www.node.io	Commercial	AI Analytics	["AI", "Business Development", "Market Intelligence", "Personalization"]	2025-04-25 16:16:25.705362	2025-04-25 16:16:25.705362
58	Zilliant IQ	Zilliant IQ is an AI-driven pricing and sales solution that optimizes pricing strategies and identifies sales opportunities. It supports strategic account leadership by enabling personalized account planning and execution strategies based on comprehensive data analysis.	https://www.zilliant.com/solutions/zilliant-iq	Commercial	Pricing and Sales Optimization	["AI", "pricing strategy", "sales optimization", "account management", "data analysis"]	2025-04-25 16:16:25.712294	2025-04-25 16:16:25.712294
59	Hubdoc	Hubdoc is a financial document automation tool that automatically collects bank statements, bills, and receipts from various sources, using AI to extract key data and organize documents efficiently. It integrates with accounting software like Xero to streamline financial document management.	https://www.hubdoc.com	Commercial	Financial Document Management	["document automation", "financial management", "data extraction"]	2025-04-25 16:16:25.730157	2025-04-25 16:16:25.730157
60	AutoEntry	AutoEntry is an AI-powered tool that automates data entry by capturing, analyzing, and organizing financial documents. It supports a wide range of document types including bills, invoices, and receipts, making it ideal for preparing for financial meetings by ensuring all documents are accurately organized and accessible.	https://www.autoentry.com	Commercial	Data Entry Automation	["data capture", "financial documents", "automation"]	2025-04-25 16:16:25.73253	2025-04-25 16:16:25.73253
61	Receipt Bank	Now known as Dext Prepare, this tool extracts information from financial documents using machine learning. It helps businesses collect, process, and store receipts, invoices, and other financial documents efficiently, ensuring that all necessary paperwork is prepared and organized before any financial meeting.	https://dext.com	Commercial	Financial Document Management	["receipt management", "invoice processing", "document storage"]	2025-04-25 16:16:25.734944	2025-04-25 16:16:25.734944
62	Medallia	Medallia captures customer feedback across web, mobile, and social channels, analyzes it in real-time, and delivers actionable insights to improve customer satisfaction. It uses advanced AI algorithms to understand customer sentiments and trends.	https://www.medallia.com	Commercial	Customer Experience Management	["customer feedback", "AI analytics", "real-time", "customer satisfaction"]	2025-04-25 16:16:25.737563	2025-04-25 16:16:25.737563
63	Qualtrics CustomerXM	Qualtrics CustomerXM uses machine learning and predictive analytics to monitor and analyze customer interactions across multiple channels. It provides insights into customer sentiment and behavior, helping businesses enhance their customer satisfaction strategies.	https://www.qualtrics.com/customer-experience/	Commercial	Customer Experience Management	["customer experience", "predictive analytics", "machine learning", "customer insights"]	2025-04-25 16:16:25.739979	2025-04-25 16:16:25.739979
64	Clarabridge	Clarabridge offers a comprehensive solution for analyzing customer feedback from various sources including social media, emails, and call center communications. It uses natural language processing (NLP) to extract meaningful insights from unstructured data, aiding in customer satisfaction improvement.	https://www.clarabridge.com	Commercial	Customer Feedback Analysis	["NLP", "customer feedback", "data analysis", "customer satisfaction"]	2025-04-25 16:16:25.74226	2025-04-25 16:16:25.74226
65	Zendesk	Zendesk provides a suite of tools including support, chat, and call center solutions that integrate AI to enhance customer service interactions. Its AI capabilities help in automating responses and analyzing customer satisfaction trends to improve service quality.	https://www.zendesk.com	Commercial	Customer Support	["customer support", "AI automation", "service quality", "customer satisfaction"]	2025-04-25 16:16:25.744989	2025-04-25 16:16:25.744989
66	HubSpot CRM	HubSpot CRM integrates AI to streamline customer relationship management processes. It features tools for email scheduling, lead scoring, and chatbots that provide real-time assistance to customers, enhancing engagement and satisfaction.	https://www.hubspot.com/products/crm	Freemium	CRM AI	["CRM", "lead scoring", "chatbots", "customer support"]	2025-04-25 16:16:25.762418	2025-04-25 16:16:25.762418
67	Freshsales	Freshsales by Freshworks uses AI to offer predictive contact scoring, which prioritizes leads based on their likelihood of conversion. It also features AI-driven insights for sales forecasting and customer engagement analysis.	https://www.freshworks.com/crm/sales/	Commercial	CRM AI	["CRM", "lead scoring", "sales forecasting", "customer insights"]	2025-04-25 16:16:25.765206	2025-04-25 16:16:25.765206
68	Pipedrive	Pipedrive incorporates AI to automate repetitive tasks and provide sales forecasting. Its AI capabilities help in managing leads and deals by predicting future sales outcomes and suggesting actions to improve sales processes.	https://www.pipedrive.com	Commercial	CRM AI	["CRM", "sales automation", "forecasting", "lead management"]	2025-04-25 16:16:25.767651	2025-04-25 16:16:25.767651
69	Ada	Ada is an AI-powered platform that automates customer service interactions and provides technical consultation and support. It uses natural language processing to understand and respond to user inquiries, making it suitable for providing expert advice in technical fields.	https://www.ada.cx/	Commercial	Customer Support AI	["AI Chatbot", "Customer Service", "NLP", "Technical Support"]	2025-04-25 16:16:25.770201	2025-04-25 16:16:25.770201
70	Watson Assistant	IBM's Watson Assistant uses AI to help businesses build conversational interfaces into any application, device, or channel. It can be used for technical consultation by understanding complex technical queries and providing precise answers or guidance using its advanced natural language processing capabilities.	https://www.ibm.com/cloud/watson-assistant/	Commercial	AI Chatbot	["NLP", "Chatbot", "Technical Support", "AI Assistant"]	2025-04-25 16:16:25.77268	2025-04-25 16:16:25.77268
71	Zendesk Answer Bot	Zendesk Answer Bot is designed to improve customer support by using machine learning to automatically respond to customer inquiries. It can be integrated into technical support scenarios to provide immediate, automated responses to technical questions, thereby enhancing the efficiency of support teams.	https://www.zendesk.com/service/answer-bot/	Commercial	Customer Support AI	["Customer Support", "AI Bot", "Machine Learning", "Technical Consultation"]	2025-04-25 16:16:25.775013	2025-04-25 16:16:25.775013
72	Rasa	Rasa is an open-source machine learning framework for automated text and voice-based conversations. Developers can use Rasa to create sophisticated AI assistants capable of providing technical consultation and support by understanding and processing user queries in a conversational context.	https://rasa.com/	Open Source	AI Framework	["Open Source", "Chatbot", "Machine Learning", "Technical Support"]	2025-04-25 16:16:25.77747	2025-04-25 16:16:25.77747
73	Crunchbase Pro	Crunchbase Pro uses advanced search capabilities and custom list building to help businesses identify key market players and emerging competitors. It provides insights into industry trends, funding history, and key company data to strategize market entry and customer acquisition.	https://www.crunchbase.com/products/crunchbase-pro	Commercial	Market Research	["market analysis", "competitive insights", "investment tracking", "business intelligence"]	2025-04-25 16:16:25.792586	2025-04-25 16:16:25.792586
74	CB Insights	CB Insights leverages machine learning to analyze millions of data points on venture capital, startups, patents, partnerships, and news mentions to help companies discover and understand the competitive landscape in new markets. This tool is essential for developing informed market expansion strategies.	https://www.cbinsights.com/	Commercial	Market Intelligence	["AI analytics", "market trends", "competitive analysis", "strategic planning"]	2025-04-25 16:16:25.795724	2025-04-25 16:16:25.795724
75	Market Explorer by SimilarWeb	Market Explorer provides digital market intelligence by analyzing web traffic and engagement metrics. This tool helps businesses understand online market sizes, customer behaviors, and benchmark against competitors, which is vital for digital market expansion strategies.	https://www.similarweb.com/corp/solutions/market-research/	Commercial	Digital Market Intelligence	["market research", "traffic analysis", "competitive benchmarking", "digital strategy"]	2025-04-25 16:16:25.800512	2025-04-25 16:16:25.800512
76	Microsoft Dynamics 365 AI	This tool leverages AI to provide insights into business processes and customer needs, facilitating effective solution recommendations based on deep learning of company products. It helps in tailoring solutions to customer requirements and streamlining the implementation process.	https://dynamics.microsoft.com/en-us/ai/	Commercial	Business Intelligence	["business intelligence", "deep learning", "solution advising"]	2025-04-25 16:16:25.81573	2025-04-25 16:16:25.81573
77	CrunchMetrics	CrunchMetrics uses advanced AI and machine learning technologies to analyze business data and provide insights into potential ROI from various strategies and investments. It helps businesses communicate these insights effectively to stakeholders, emphasizing the financial and strategic benefits of products or services.	https://www.crunchmetrics.ai	Commercial	Business Intelligence	["AI", "ROI Analysis", "Machine Learning", "Data Analytics"]	2025-04-25 16:16:25.824587	2025-04-25 16:16:25.824587
78	Proof BusinessGPS	Proof BusinessGPS employs AI to forecast and measure the financial outcomes of different business strategies, including marketing and operational investments. It provides a clear visualization of ROI and strategic benefits, which can be crucial for presentations to high-value clients.	https://www.proofanalytics.ai	Commercial	Analytics	["ROI Forecasting", "Financial Modeling", "Strategic Planning", "AI"]	2025-04-25 16:16:25.826975	2025-04-25 16:16:25.826975
79	ClearStory Data	ClearStory Data's platform leverages AI and machine learning to analyze and harmonize large amounts of data from disparate sources, providing insights that help businesses understand the ROI of their initiatives. This tool is particularly useful for communicating complex financial benefits to clients in a digestible format.	http://www.clearstorydata.com	Commercial	Data Integration	["Data Analysis", "Machine Learning", "ROI Insights", "AI"]	2025-04-25 16:16:25.829702	2025-04-25 16:16:25.829702
80	LinkedIn Sales Navigator	LinkedIn Sales Navigator is an advanced sales tool that aids in the process of finding the right prospects to build trusted relationships. It leverages AI to provide recommendations based on combined user data and network interactions, which can be crucial for collaborative business development.	https://business.linkedin.com/sales-solutions/sales-navigator	Commercial	Sales Intelligence	["sales", "networking", "AI", "business development", "lead generation"]	2025-04-25 16:16:25.832354	2025-04-25 16:16:25.832354
82	Salesloft	Salesloft offers a powerful sales engagement platform equipped with AI capabilities to streamline the sales process. It features tools for email tracking, automated dialing, and personalized outreach, all designed to increase the efficiency and effectiveness of sales teams.	https://www.salesloft.com	Commercial	Sales Engagement	["Sales Automation", "AI", "Email Tracking", "Automated Dialing"]	2025-04-25 16:16:25.849859	2025-04-25 16:16:25.849859
83	Einstein AI by Salesforce	Einstein AI integrates with Salesforce CRM to provide AI-driven insights, predictions, and recommendations. It helps in personalizing customer interactions based on their history and social data, enhancing relationship management.	https://www.salesforce.com/products/einstein/overview/	Commercial	CRM	["AI CRM", "customer engagement", "predictive analytics", "relationship management"]	2025-04-25 16:16:25.872895	2025-04-25 16:16:25.872895
84	Bizzabo	Bizzabo is an event management software that leverages AI to help businesses plan and optimize their events. It uses AI algorithms to analyze past event data and attendee behavior to recommend the most relevant events and meetings that could yield high ROI based on strategic importance.	https://www.bizzabo.com	Commercial	Event Management	["AI", "Event Optimization", "Networking", "ROI"]	2025-04-25 16:16:25.877251	2025-04-25 16:16:25.877251
85	Eventbrite	Eventbrite uses AI to provide insights and recommendations for event organizers to optimize event planning and execution. It analyzes historical data on event performance and attendee engagement to suggest the best types of events and networking opportunities that align with business goals.	https://www.eventbrite.com	Freemium	Event Management	["Event Planning", "AI", "Data Analysis", "Networking"]	2025-04-25 16:16:25.879861	2025-04-25 16:16:25.879861
86	Whova	Whova offers an AI-powered event management platform that assists organizers in selecting and optimizing events based on detailed analytics of past events, attendee preferences, and potential business impacts. Its AI engine recommends networking events that are most likely to improve engagement and ROI.	https://www.whova.com	Commercial	Event Management	["AI", "Event Analytics", "Networking Optimization", "Strategic Planning"]	2025-04-25 16:16:25.882437	2025-04-25 16:16:25.882437
87	Guru	Guru is a knowledge management tool that uses AI to organize and deliver relevant product information to team members in real-time. It integrates with various communication platforms to ensure that all team members have access to the latest product updates and information, enhancing client interactions.	https://www.getguru.com	Freemium	Knowledge Management	["AI", "Knowledge Management", "Real-time", "Product Information"]	2025-04-25 16:16:25.901994	2025-04-25 16:16:25.901994
88	Bloomfire	Bloomfire is a platform that centralizes company knowledge, including detailed product information, and uses AI to make this data easily searchable and accessible. It helps ensure that all team members are on the same page regarding product features and updates, which is crucial for client interactions.	https://www.bloomfire.com	Commercial	Knowledge Management	["Searchable Knowledge Base", "AI", "Product Knowledge", "Client Interaction"]	2025-04-25 16:16:25.904419	2025-04-25 16:16:25.904419
89	Celonis	Celonis is a process mining tool that uses AI and machine learning to analyze business processes and identify inefficiencies. It provides insights and recommendations for process optimization, helping organizations to improve their operational efficiency.	https://www.celonis.com/	Commercial	Process Mining	["process mining", "AI", "machine learning", "process optimization"]	2025-04-25 16:16:25.91192	2025-04-25 16:16:25.91192
90	Pega	Pega is a business process management (BPM) tool that uses AI to automate and optimize business processes. It provides a platform for building applications that automate tasks, streamline operations, and improve decision making, thereby enhancing overall process efficiency.	https://www.pega.com/	Commercial	Business Process Management	["BPM", "AI", "process automation", "decision automation"]	2025-04-25 16:16:25.91448	2025-04-25 16:16:25.91448
91	Blue Prism	Blue Prism is an RPA tool that enables businesses to automate complex and rule-based processes. It uses AI to manage and optimize workflows, helping organizations to achieve greater efficiency and accuracy in their operations.	https://www.blueprism.com/	Commercial	Robotic Process Automation	["RPA", "AI", "workflow management", "process optimization"]	2025-04-25 16:16:25.917084	2025-04-25 16:16:25.917084
92	OpenAI GPT-4	GPT-4 is an advanced language model developed by OpenAI that can generate human-like text based on the input it receives. It can adapt to new topics and scenarios, making it useful for brainstorming and generating innovative ideas in various domains. It can also be fine-tuned to specific organizational needs, supporting new process implementations by providing insights and automated content generation.	https://www.openai.com/gpt-4	Commercial	AI Language Model	["AI", "language model", "innovation", "adaptability", "ideation"]	2025-04-25 16:16:25.91954	2025-04-25 16:16:25.91954
93	Microsoft Azure Machine Learning	Azure Machine Learning is a cloud-based platform for building, training, and deploying machine learning models. It supports adaptability by allowing users to quickly scale and modify models based on new data and changing business requirements. The platform fosters innovation through its extensive toolset that supports various machine learning techniques and integration with other Azure services.	https://azure.microsoft.com/en-us/services/machine-learning/	Commercial	Machine Learning Platform	["machine learning", "cloud", "AI", "adaptability", "innovation"]	2025-04-25 16:16:25.924007	2025-04-25 16:16:25.924007
94	Google Cloud AutoML	Google Cloud AutoML enables developers with limited machine learning expertise to train high-quality models specific to their business needs. It adapts to new data inputs and changes in business processes, facilitating the testing and implementation of innovative approaches. AutoML supports various data types and machine learning tasks, enhancing its adaptability and utility in diverse scenarios.	https://cloud.google.com/automl	Commercial	Automated Machine Learning	["automated ML", "cloud", "AI", "adaptability", "innovation"]	2025-04-25 16:16:25.92664	2025-04-25 16:16:25.92664
95	Outreach Kaia	Outreach Kaia is an AI-powered knowledge assistant that captures and shares real-time insights during sales calls. It aids in consultative selling by analyzing conversations to identify customer needs and decision-making criteria, including budget and authority, helping sales reps tailor their discussions and offerings effectively.	https://www.outreach.io/product/kaia	Commercial	Sales Engagement	["AI", "Sales Calls", "Real-time Insights", "Consultative Selling", "BANT"]	2025-04-25 16:16:25.933767	2025-04-25 16:16:25.933767
96	Lessonly by Seismic	Lessonly is a training and coaching platform powered by AI that helps sales teams practice, learn, and improve their sales skills through scenario-based learning and real-time feedback.	https://www.lessonly.com	Commercial	Corporate Training	["training platform", "AI", "sales development", "real-time feedback"]	2025-04-25 16:16:25.948651	2025-04-25 16:16:25.948651
97	Intercom	Intercom provides a customer communication platform with a strong focus on automation and AI. It uses chatbots and personalized messaging services to educate and engage customers about company services, thereby supporting sales and customer service efforts.	https://www.intercom.com	Commercial	Customer Communication	["customer communication", "chatbots", "personalized messaging", "customer engagement"]	2025-04-25 16:16:25.976172	2025-04-25 16:16:25.976172
99	Clara	Clara is a virtual employee that schedules your meetings, powered by machine learning. It communicates with meeting participants via email to find suitable times and manages the entire scheduling process.	https://claralabs.com	Commercial	Productivity	["virtual scheduling assistant", "email coordination", "AI assistant"]	2025-04-25 16:16:25.981555	2025-04-25 16:16:25.981555
100	Zoom.ai	Zoom.ai is an automated assistant that helps schedule meetings, with deep integration into multiple calendar platforms. It uses AI to suggest optimal meeting times and can automatically send invites to participants.	https://www.zoom.ai	Commercial	Communication	["automated meeting scheduler", "AI-powered", "calendar integration"]	2025-04-25 16:16:25.984025	2025-04-25 16:16:25.984025
101	Cronofy	Cronofy's Scheduler is a powerful tool that connects to all major calendar services to help find the best times for meetings. It uses AI to analyze availability and preferences to optimize meeting scheduling.	https://www.cronofy.com	Commercial	Productivity	["calendar API", "meeting optimization", "schedule management"]	2025-04-25 16:16:25.986392	2025-04-25 16:16:25.986392
102	Pipedrive LeadBooster	Pipedrive's LeadBooster is an AI-powered chatbot that pre-qualifies leads directly through website interactions. It asks predefined qualification questions and uses the responses to score and route leads accordingly within the Pipedrive CRM system.	https://www.pipedrive.com/en/features/leadbooster	Commercial	CRM and Sales Automation	["chatbot", "lead management", "CRM", "AI"]	2025-04-25 16:16:25.995157	2025-04-25 16:16:25.995157
103	Freshsales Freddy AI	Freddy AI by Freshsales uses artificial intelligence to analyze past lead and sales data to score leads and predict their chances of conversion. It provides insights and recommendations for best next actions to take with each lead.	https://www.freshworks.com/freshsales-crm/	Commercial	CRM and Sales Automation	["AI", "CRM", "lead scoring", "sales predictions"]	2025-04-25 16:16:25.997746	2025-04-25 16:16:25.997746
104	Einstein Analytics	Einstein Analytics by Salesforce uses AI to enhance sales performance tracking by analyzing sales data and providing predictive insights and prescriptive recommendations. It helps sales teams understand performance trends and make data-driven decisions.	https://www.salesforce.com/products/einstein-analytics/overview/	Commercial	Business Intelligence	["AI", "Sales Performance", "Analytics", "Predictive Insights"]	2025-04-25 16:16:26.000228	2025-04-25 16:16:26.000228
105	Zoho Analytics	Zoho Analytics is a self-service BI and data analytics software that uses AI to analyze sales data. It provides features like predictive sales analytics, which help in forecasting future sales and understanding key performance indicators to enhance sales strategies.	https://www.zoho.com/analytics/	Freemium	Business Intelligence	["AI", "Data Analytics", "Sales Forecasting", "Performance Tracking"]	2025-04-25 16:16:26.004676	2025-04-25 16:16:26.004676
106	Tableau CRM	Tableau CRM (formerly Einstein Analytics) integrates AI to provide advanced analytics and visualizations specifically for CRM data, including sales performance. It offers AI-driven insights and recommendations to optimize sales processes and improve performance metrics.	https://www.tableau.com/products/crm	Commercial	CRM Analytics	["AI", "CRM", "Sales Analytics", "Performance Insights"]	2025-04-25 16:16:26.007399	2025-04-25 16:16:26.007399
107	Pipedrive Insights	Pipedrive Insights is a feature within the Pipedrive CRM that utilizes AI to track sales performance and generate detailed reports and dashboards. It helps sales teams visualize their sales pipeline and performance metrics to enhance decision-making.	https://www.pipedrive.com/en/features/insights	Commercial	CRM	["Sales Tracking", "AI", "CRM", "Data Visualization"]	2025-04-25 16:16:26.009792	2025-04-25 16:16:26.009792
108	Google Cloud AutoML Natural Language	Google Cloud AutoML Natural Language uses machine learning to build models capable of analyzing and understanding product information from various data sources such as descriptions, reviews, and support documents. It helps in developing a deep understanding of product features and benefits, which can be used to tailor interactions and solutions for customer needs.	https://cloud.google.com/natural-language/automl/docs	Commercial	Natural Language Processing	["NLP", "Machine Learning", "AutoML", "Product Knowledge"]	2025-04-25 16:16:26.016781	2025-04-25 16:16:26.016781
109	Wrike	Wrike is a versatile project management tool that incorporates AI to help users manage projects from initiation to completion. Its AI features include predictive analytics, which forecasts project timelines and identifies potential bottlenecks, empowering users to proactively manage tasks and take initiative.	https://www.wrike.com	Freemium	Project Management	["predictive analytics", "project management", "AI", "task automation"]	2025-04-25 16:16:26.025045	2025-04-25 16:16:26.025045
110	HubSpot Marketing Hub	HubSpot Marketing Hub uses AI and automation to help marketing teams attract the right visitors, convert more leads, and demonstrate ROI. Its integration with HubSpot CRM and Sales Hub allows for seamless collaboration between sales and marketing teams, ensuring alignment in strategies and communication, which is crucial for enhancing the sales pipeline and driving business growth.	https://www.hubspot.com/products/marketing	Freemium	Marketing Automation	["marketing automation", "sales alignment", "lead management", "ROI tracking", "CRM"]	2025-04-25 16:16:26.029916	2025-04-25 16:16:26.029916
111	Microsoft Dynamics 365 for Sales	Microsoft Dynamics 365 for Sales leverages AI to enable smarter selling with contextual AI-driven insights. It facilitates collaboration between sales and marketing teams by integrating with Microsoft's suite of tools including Teams and LinkedIn, which helps in strategizing and executing marketing campaigns that directly impact the sales pipeline.	https://dynamics.microsoft.com/en-us/sales/overview/	Commercial	CRM Software	["CRM", "AI insights", "Microsoft integration", "strategic sales", "marketing collaboration"]	2025-04-25 16:16:26.034387	2025-04-25 16:16:26.034387
112	Pendo	Pendo is a product experience platform that uses data-driven insights to help companies educate users about technical products. It features in-app messaging and guides that can be tailored to the user's role and technical expertise, making it easier to communicate complex product functionalities.	https://www.pendo.io	Commercial	Product Management	["user onboarding", "product experience", "data analytics", "technical education"]	2025-04-25 16:16:26.040766	2025-04-25 16:16:26.040766
113	WalkMe	WalkMe's digital adoption platform uses AI to provide step-by-step guidance tailored to the user's needs and technical level. It helps businesses communicate the value and functionality of technical products through interactive on-screen walkthroughs.	https://www.walkme.com	Commercial	Digital Adoption	["user guidance", "interactive walkthroughs", "product adoption", "technical communication"]	2025-04-25 16:16:26.04305	2025-04-25 16:16:26.04305
114	EdApp	EdApp is a mobile-first microlearning platform that incorporates AI to deliver personalized learning experiences tailored to individual sales representatives. It includes features such as spaced repetition and smart lessons that adapt based on the learner's performance, effectively helping sales teams master product knowledge.	https://www.edapp.com	Freemium	E-learning	["AI learning", "microlearning", "personalized training", "sales training"]	2025-04-25 16:16:26.055845	2025-04-25 16:16:26.055845
115	Docebo	Docebo is an AI-powered learning platform that offers a suite of tools designed to enhance the training process. It uses artificial intelligence to curate personalized content for learners, optimizing the learning paths according to the needs of sales representatives to become product experts.	https://www.docebo.com	Commercial	E-learning	["AI learning platform", "content curation", "adaptive learning", "sales enablement"]	2025-04-25 16:16:26.058457	2025-04-25 16:16:26.058457
116	Allego	Allego offers a modern sales learning and readiness platform that uses AI to optimize learning retention through personalized content delivery and reinforcement training. The platform is particularly effective for complex product training, helping sales representatives to quickly adapt to market changes and product updates.	https://www.allego.com	Commercial	Sales Training	["sales learning", "AI-driven", "personalized learning", "product expertise"]	2025-04-25 16:16:26.063334	2025-04-25 16:16:26.063334
117	Google Cloud Dialogflow	Dialogflow is a Google Cloud tool for building conversational interfaces for websites, mobile applications, and IoT devices. It can be integrated with a company's product database to train on specific product information, allowing it to conduct informed and accurate discussions about the product's features and benefits with potential clients.	https://cloud.google.com/dialogflow	Freemium	Conversational AI	["NLP", "chatbot", "Google Cloud", "AI"]	2025-04-25 16:16:26.078865	2025-04-25 16:16:26.078865
118	Coursera for Business	Coursera for Business offers a platform where employees can access courses specifically tailored to learning about various industries and products, as well as courses on leadership and career development. This tool helps organizations train their employees to gain a deeper understanding of their products and prepare for career advancements.	https://www.coursera.org/business	Commercial	E-learning	["e-learning", "career development", "product knowledge", "online courses"]	2025-04-25 16:16:26.089602	2025-04-25 16:16:26.089602
119	LinkedIn Learning	LinkedIn Learning provides a wide range of courses that cover product management, market applications, and career development skills. It's integrated within the LinkedIn platform, making it easy for professionals to learn in a context that is directly connected to their career profiles and networks.	https://www.linkedin.com/learning/	Commercial	E-learning	["professional development", "product knowledge", "career skills", "online learning"]	2025-04-25 16:16:26.092001	2025-04-25 16:16:26.092001
120	Pluralsight Skills	Pluralsight Skills offers tech-centric content but also includes a variety of courses on product management and market strategies. It's particularly useful for those in tech roles looking to understand the broader market applications of their products and advance their careers within tech-focused companies.	https://www.pluralsight.com/	Commercial	E-learning	["technology education", "product management", "career advancement", "skills development"]	2025-04-25 16:16:26.094604	2025-04-25 16:16:26.094604
121	Udemy for Business	Udemy for Business provides a platform with courses on a wide range of topics including product knowledge and career development. Companies can subscribe to allow their employees access to tailored learning paths that help them understand their products better and prepare for future roles.	https://business.udemy.com/	Commercial	E-learning	["corporate training", "product education", "career growth", "online courses"]	2025-04-25 16:16:26.097131	2025-04-25 16:16:26.097131
122	Brainshark	Brainshark offers solutions for sales enablement and readiness, incorporating AI to create dynamic sales training and coaching modules. It supports the acquisition of deep product knowledge and advanced sales skills through engaging multimedia content, analytics, and AI-driven adaptive learning paths.	https://www.brainshark.com	Commercial	Sales Training	["sales coaching", "multimedia training", "adaptive learning", "AI"]	2025-04-25 16:16:26.105803	2025-04-25 16:16:26.105803
123	Clerk.io	Clerk.io uses AI to dynamically present products based on customer behavior and preferences. It integrates with e-commerce platforms to personalize product recommendations and presentations, enhancing customer engagement and sales.	https://www.clerk.io	Commercial	E-commerce Personalization	["AI", "E-commerce", "Personalization", "Product Recommendation"]	2025-04-25 16:16:26.10808	2025-04-25 16:16:26.10808
124	Algolia Recommend	Algolia Recommend is an AI-driven tool that provides personalized product recommendations. It uses machine learning algorithms to analyze user interactions and preferences to tailor product presentations on e-commerce sites.	https://www.algolia.com/products/recommend/	Commercial	Search and Discovery	["AI", "Search Engine", "Personalization", "Machine Learning"]	2025-04-25 16:16:26.11054	2025-04-25 16:16:26.11054
125	RichRelevance	RichRelevance offers advanced personalization technologies for retail, utilizing AI to tailor product presentations based on real-time user data and behavior. This enhances the shopping experience by presenting the most relevant products to each customer.	https://www.richrelevance.com	Commercial	Retail Personalization	["AI", "Retail", "Customer Experience", "Personalization"]	2025-04-25 16:16:26.113292	2025-04-25 16:16:26.113292
126	Dynamic Yield	Dynamic Yield employs AI to optimize and personalize product presentations across web, mobile, and email. It analyzes user behavior and preferences to dynamically adjust content and product displays, improving engagement and conversion rates.	https://www.dynamicyield.com	Commercial	Marketing Personalization	["AI", "Marketing", "Personalization", "Analytics"]	2025-04-25 16:16:26.11589	2025-04-25 16:16:26.11589
127	Eventbrite Boost	Eventbrite Boost is an AI-powered marketing platform specifically designed for event promotion and management. It uses machine learning algorithms to optimize advertising across social platforms, predict attendee engagement, and provide insights on how to improve event reach and effectiveness.	https://www.eventbrite.com/l/boost/	Commercial	Event Management	["AI Marketing", "Event Promotion", "Attendee Engagement", "Social Media Advertising"]	2025-04-25 16:16:26.118262	2025-04-25 16:16:26.118262
128	Splash	Splash uses AI to help event organizers design, market, and efficiently manage events. Its AI features include automated marketing workflows and data-driven insights to maximize event exposure and attendee engagement.	https://www.splashthat.com	Commercial	Event Management	["Event Design", "AI Marketing", "Data Insights", "Workflow Automation"]	2025-04-25 16:16:26.125136	2025-04-25 16:16:26.125136
129	OptimoRoute	OptimoRoute uses advanced algorithms and machine learning to optimize routes and schedules for mobile workforces. It is particularly useful for sales representatives as it plans efficient routes and schedules, considering factors like traffic, delivery times, and customer preferences.	https://optimoroute.com	Commercial	Route Optimization	["AI", "Route Optimization", "Itinerary Planning", "Sales Efficiency"]	2025-04-25 16:16:26.127813	2025-04-25 16:16:26.127813
130	Route4Me	Route4Me provides dynamic route optimization software designed to use AI to ensure the most efficient routes for its users. It supports all types of routing needs including those of sales professionals managing client visits across different locations. The tool also offers predictive data analytics for better decision-making.	https://www.route4me.com	Freemium	Logistics	["Routing", "AI", "Logistics", "Sales Planning", "Travel Optimization"]	2025-04-25 16:16:26.130354	2025-04-25 16:16:26.130354
131	Badger Maps	Badger Maps is a sales routing software that uses AI to analyze traffic data, optimize routes, and manage territories. It helps sales representatives plan their day by visualizing their customers on a map, creating efficient routes, and integrating with their calendar for seamless scheduling.	https://www.badgermapping.com	Commercial	Sales Productivity	["Sales Routing", "AI", "Itinerary Optimization", "Client Management"]	2025-04-25 16:16:26.13288	2025-04-25 16:16:26.13288
132	IBM Watson Commerce	IBM Watson Commerce uses AI to manage inventory levels and optimize pricing. It predicts demand using weather data, market trends, and consumer behavior insights, helping businesses adjust inventory and pricing dynamically.	https://www.ibm.com/products/watson-commerce	Commercial	AI in Commerce	["AI", "inventory management", "dynamic pricing", "demand forecasting"]	2025-04-25 16:16:26.160609	2025-04-25 16:16:26.160609
133	LinkSquares	LinkSquares is an AI-powered contract analytics tool that helps companies analyze contract data to identify opportunities for new partnerships and business growth. It uses natural language processing to extract and interpret key contract terms and conditions, facilitating strategic decision-making.	https://linksquares.com/	Commercial	Legal Tech	["AI", "Contract Analysis", "NLP", "Business Growth"]	2025-04-25 16:16:26.201241	2025-04-25 16:16:26.201241
134	Workday Peakon Employee Voice	Workday Peakon Employee Voice uses real-time analytics and AI to measure employee engagement and provides insights to enhance workplace culture, including sales environments. It offers personalized insights and recommendations to boost morale and recognize achievements, which can be particularly beneficial in maintaining a positive sales culture.	https://www.workday.com/en-us/products/employee-engagement-software/overview.html	Commercial	Employee Engagement	["AI", "Employee Engagement", "Morale Boosting", "Sales Culture"]	2025-04-25 16:16:26.220552	2025-04-25 16:16:26.220552
135	Briq	Briq is a corporate performance management platform that uses AI to automate and enhance recognition programs within sales teams. It helps in setting up personalized rewards and recognition systems that are tailored to the sales culture of an organization, thereby boosting morale and enhancing overall sales performance.	https://www.briq.com/	Commercial	Performance Management	["AI", "Performance Management", "Sales Culture", "Recognition"]	2025-04-25 16:16:26.222893	2025-04-25 16:16:26.222893
136	Salesforce Einstein Analytics	Salesforce Einstein Analytics is an AI-powered analytics tool that provides actionable insights into team performance and customer interactions. It can be used to track and recognize sales achievements, analyze trends in sales team morale, and offer personalized coaching insights, thereby fostering a positive sales culture.	https://www.salesforce.com/products/einstein-analytics/overview/	Commercial	Business Intelligence	["AI", "Analytics", "Sales Culture", "Motivational Insights"]	2025-04-25 16:16:26.225423	2025-04-25 16:16:26.225423
137	Mindtickle	Mindtickle offers a comprehensive sales readiness platform that uses AI to provide sales training modules tailored to the needs of individual sales reps. The platform includes features for role-play, scenario-based training, and real-time feedback to enhance account penetration strategies.	https://www.mindtickle.com	Commercial	Sales Enablement	["sales training", "AI", "account penetration", "sales readiness"]	2025-04-25 16:16:26.22813	2025-04-25 16:16:26.22813
138	HireVue	HireVue leverages AI to enhance the hiring process by providing video interviewing and pre-employment assessment solutions. It uses machine learning algorithms to analyze verbal and non-verbal communication in interviews, helping organizations identify the best candidates who fit their team culture and performance standards.	https://www.hirevue.com	Commercial	Recruitment	["AI recruitment", "video interviewing", "team building", "machine learning"]	2025-04-25 16:16:26.243986	2025-04-25 16:16:26.243986
139	Plum	Plum uses AI to predict how well potential and existing employees will succeed in their roles and fit within a team. By assessing talents through psychometric tests and matching them to job needs, Plum helps in building teams that are aligned with organizational goals and culture.	https://www.plum.io	Commercial	Human Resources	["psychometric testing", "team development", "employee assessment"]	2025-04-25 16:16:26.246833	2025-04-25 16:16:26.246833
140	Pymetrics	Pymetrics applies AI in the form of neuroscience-based games and bias-free algorithms to match candidates’ emotional and cognitive abilities with company profiles. This tool is used for both recruiting new team members and managing workforce development.	https://www.pymetrics.ai	Commercial	Recruitment	["neuroscience", "workforce development", "AI hiring", "team building"]	2025-04-25 16:16:26.249501	2025-04-25 16:16:26.249501
141	Culture Amp	Culture Amp uses AI and analytics to help companies manage and develop their teams. It provides insights into employee engagement and performance, facilitating better decision-making in team development and retention strategies.	https://www.cultureamp.com	Commercial	Employee Engagement	["employee engagement", "performance management", "AI analytics"]	2025-04-25 16:16:26.251817	2025-04-25 16:16:26.251817
142	Eightfold	Eightfold's Talent Intelligence Platform uses AI to transform recruiting, talent management, and workforce planning. It provides insights and recommendations to manage and develop talent effectively.	https://www.eightfold.ai	Commercial	Talent Management	["Talent Intelligence", "AI Recruitment", "Workforce Planning", "Talent Development"]	2025-04-25 16:16:26.258319	2025-04-25 16:16:26.258319
143	Entelo	Entelo applies AI to streamline the recruitment process by automating candidate search and outreach. It uses predictive analytics to identify the best candidates and improve diversity hiring.	https://www.entelo.com	Commercial	Recruitment	["Predictive Analytics", "Talent Acquisition", "Diversity Hiring", "Candidate Search"]	2025-04-25 16:16:26.2609	2025-04-25 16:16:26.2609
144	Beamery	Beamery combines elements of CRM and ATS with AI to provide a complete talent acquisition solution. It helps in nurturing candidate relationships and improving the quality of hires.	https://www.beamery.com	Commercial	Talent Acquisition	["CRM", "ATS", "Candidate Relationship", "AI Recruitment"]	2025-04-25 16:16:26.263538	2025-04-25 16:16:26.263538
145	Humu	Humu leverages behavioral science and AI to nudge employees towards better work habits. It analyzes organizational data to deliver personalized nudges to employees, helping to align their behaviors with the company's cultural values and goals.	https://www.humu.com	Commercial	Human Resources	["Behavioral Science", "AI", "Nudges", "Organizational Culture"]	2025-04-25 16:16:26.26827	2025-04-25 16:16:26.26827
146	Leapsome	Leapsome combines tools for performance management, employee engagement, and learning that are powered by AI. It provides frameworks for feedback, goals, and development plans that align with an organization's culture, helping to reinforce and evolve it over time.	https://www.leapsome.com	Commercial	Performance Management	["AI", "Employee Engagement", "Performance Management", "Culture Development"]	2025-04-25 16:16:26.270777	2025-04-25 16:16:26.270777
147	Glint	Glint uses AI to analyze employee survey data to provide insights into organizational health and employee well-being. It helps leaders identify areas of cultural strength and opportunities for development, supporting strategic culture change initiatives.	https://www.glintinc.com	Commercial	Employee Engagement	["AI", "Surveys", "Employee Well-being", "Organizational Culture"]	2025-04-25 16:16:26.2731	2025-04-25 16:16:26.2731
148	WorkBoard	WorkBoard is an AI-powered enterprise platform that helps organizations with strategic planning, alignment, and execution. It enables leaders to define strategic priorities, align teams with these objectives, and use real-time data to adapt strategies as market conditions change.	https://www.workboard.com	Commercial	Business Management	["strategic planning", "execution", "alignment", "real-time data", "enterprise"]	2025-04-25 16:16:26.275358	2025-04-25 16:16:26.275358
149	ClearPoint Strategy	ClearPoint Strategy is a strategy management software that integrates management reporting, strategic planning, and execution into one platform. It provides tools for setting and tracking objectives, measuring performance, and adjusting strategies based on analytical insights.	https://www.clearpointstrategy.com	Commercial	Strategy Management	["strategy management", "reporting", "performance measurement", "analytics"]	2025-04-25 16:16:26.282323	2025-04-25 16:16:26.282323
150	Replika	Replika is an AI companion designed to communicate with users in a conversational manner, adapting its responses to improve emotional connection and trust. It uses machine learning to understand and mimic human emotions, making it suitable for building rapport with users.	https://replika.ai	Freemium	AI Chatbot	["AI companion", "emotional intelligence", "chatbot", "trust building", "rapport"]	2025-04-25 16:16:26.292976	2025-04-25 16:16:26.292976
151	Cognito	Cognito is designed for customer support and sales teams to enhance their communication skills. It uses AI to analyze voice during calls and provides real-time feedback and guidance on how to better engage and build trust with clients, thereby improving rapport.	https://www.cognitohq.com	Commercial	AI Communication Coach	["real-time feedback", "voice analysis", "customer support", "sales enhancement", "trust development"]	2025-04-25 16:16:26.295667	2025-04-25 16:16:26.295667
152	Crystal	Crystal uses AI to analyze public data and personality assessments to provide insights into the best ways to communicate with specific individuals. It helps users tailor their interactions based on personality types, significantly enhancing the ability to build rapport and trust.	https://www.crystalknows.com	Commercial	AI Personality Insights	["personality analysis", "communication strategies", "personalized interaction", "rapport building", "trust development"]	2025-04-25 16:16:26.298249	2025-04-25 16:16:26.298249
153	Vidyard	Vidyard is a video platform that allows businesses to create personalized video demonstrations using AI. It can tailor content based on viewer data and engagement, making it suitable for AI-enhanced product demonstrations.	https://www.vidyard.com/	Freemium	Video Marketing	["AI Video", "Personalization", "Marketing", "Sales"]	2025-04-25 16:16:26.300527	2025-04-25 16:16:26.300527
154	Smartly.io	Smartly.io leverages AI to automate and optimize personalized advertising content. It can be used to create dynamic product demonstrations that adapt to the user's behavior and preferences, enhancing the relevance of the demonstration.	https://www.smartly.io/	Commercial	Advertising	["AI Advertising", "Personalization", "Dynamic Content", "Marketing Automation"]	2025-04-25 16:16:26.303325	2025-04-25 16:16:26.303325
155	Ceros	Ceros is an interactive content creation platform that integrates AI to design engaging and personalized digital experiences. It can be used to create interactive product demonstrations that respond to user interactions, providing a tailored demonstration experience.	https://www.ceros.com/	Commercial	Content Creation	["Interactive Content", "AI Design", "Digital Experience", "Product Demonstration"]	2025-04-25 16:16:26.305738	2025-04-25 16:16:26.305738
156	Grip	Grip is an AI-powered event networking tool that uses advanced algorithms to match event participants based on their profiles, interests, and business objectives. It suggests potential connections and conversation starters, enhancing networking opportunities at various events.	https://grip.events	Commercial	Event Networking	["AI Networking", "Event Management", "Professional Networking", "AI Matchmaking"]	2025-04-25 16:16:26.307984	2025-04-25 16:16:26.307984
157	Brella	Brella is a networking solution that leverages AI to facilitate connections among event attendees. It analyzes user profiles and preferences to recommend the most relevant people to meet, providing tailored conversation starters to break the ice based on shared interests.	https://www.brella.io	Commercial	Event Networking	["Networking", "AI Recommendations", "Event Planning", "Professional Networking"]	2025-04-25 16:16:26.310189	2025-04-25 16:16:26.310189
158	Swapcard	Swapcard utilizes artificial intelligence to enhance networking by analyzing attendee data to predict and recommend the best matches for networking at conferences and trade shows. It also provides conversation starters and tracks the networking success rate to continuously improve its suggestions.	https://www.swapcard.com	Commercial	Event Networking	["AI Networking", "Event Tech", "Matchmaking", "Business Networking"]	2025-04-25 16:16:26.312939	2025-04-25 16:16:26.312939
159	Troops	Troops is a revenue communications platform that uses AI to help sales teams collaborate more effectively. It integrates with CRM systems and messaging platforms to provide automated alerts, data-driven insights, and workflow tools that enhance coordination and decision-making in sales strategies.	https://www.troops.ai/	Commercial	Sales Enablement	["AI", "Sales Collaboration", "CRM Integration", "Messaging", "Workflow Automation"]	2025-04-25 16:16:26.319813	2025-04-25 16:16:26.319813
160	Qualtrics XM	Qualtrics XM is an experience management platform that uses AI to analyze feedback from various sources across an organization. It integrates data from marketing, sales, and product teams to provide insights and actionable recommendations for improving messaging and product offerings.	https://www.qualtrics.com	Commercial	Experience Management	["feedback analysis", "cross-functional", "AI-driven", "real-time insights"]	2025-04-25 16:16:26.322241	2025-04-25 16:16:26.322241
161	Calendly	Calendly helps automate the process of scheduling appointments by allowing users to set their availability preferences. It integrates seamlessly with Google, Outlook, Office 365, and iCloud calendars to avoid double-booking and provides automated email and SMS reminders to both parties involved.	https://calendly.com	Freemium	Scheduling	["appointment scheduling", "calendar integration", "automated reminders", "time management"]	2025-04-25 16:16:26.328776	2025-04-25 16:16:26.328776
162	Acuity Scheduling	Acuity Scheduling is a cloud-based appointment scheduling software solution that enables business owners to manage their appointments online. It integrates with various online calendars, supports customized booking forms, and sends automatic confirmations and reminders to clients.	https://acuityscheduling.com	Commercial	Scheduling	["online booking", "client management", "customization", "email reminders"]	2025-04-25 16:16:26.331235	2025-04-25 16:16:26.331235
163	Doodle	Doodle simplifies the process of scheduling by allowing users to propose multiple time slots and letting invitees vote on their preferences. It integrates with existing calendar tools to show real-time availability and sends automatic notifications to ensure all participants are informed.	https://doodle.com	Freemium	Scheduling	["meeting coordination", "polling", "calendar sync", "group scheduling"]	2025-04-25 16:16:26.333587	2025-04-25 16:16:26.333587
164	10to8	10to8 is an appointment scheduling software that provides tools for sending automated SMS and email reminders, handling cancellations and reschedules, and syncing with multiple calendars to prevent double bookings. It also features online booking capabilities and reporting tools for businesses.	https://10to8.com	Freemium	Scheduling	["SMS reminders", "online booking", "reporting", "client management"]	2025-04-25 16:16:26.335855	2025-04-25 16:16:26.335855
165	Beautiful.AI	Beautiful.AI is an AI-powered presentation tool that helps users create visually appealing presentations. It uses AI to automatically adjust the layout, design, and flow of slides based on the content entered by the user. This tool simplifies the process of creating professional presentations with minimal design experience.	https://www.beautiful.ai/	Freemium	Presentation Software	["AI Presentation", "Automatic Design", "Slide Management"]	2025-04-25 16:16:26.338208	2025-04-25 16:16:26.338208
166	Visme	Visme is a tool that integrates AI to offer features like automatic data visualization and content suggestions based on the user's presentation goals. It helps in creating engaging and data-driven presentations that can dynamically adjust content to better suit the audience's interests and responses.	https://www.visme.co/	Freemium	Data Visualization	["AI-Driven", "Dynamic Content", "Interactive Presentations"]	2025-04-25 16:16:26.340443	2025-04-25 16:16:26.340443
167	Slidebean	Slidebean uses artificial intelligence to design slides automatically based on the content provided. It features a focus on high-quality design templates and a content adjustment algorithm that optimizes the presentation based on the audience's engagement and feedback.	https://slidebean.com/	Freemium	Presentation Software	["AI Design", "Content Optimization", "Audience Engagement"]	2025-04-25 16:16:26.343048	2025-04-25 16:16:26.343048
168	Zoho Show	Zoho Show incorporates AI features that assist in crafting presentations with smart elements like real-time co-authoring, automated design suggestions, and audience interaction tools. It enhances the way presentations are created and delivered, making them more interactive and responsive to audience feedback.	https://www.zoho.com/show/	Freemium	Collaborative Software	["Collaboration", "AI Suggestions", "Interactive"]	2025-04-25 16:16:26.346133	2025-04-25 16:16:26.346133
169	Prezi	Prezi uses AI to help users create more dynamic and engaging presentations through its smart structures that adapt based on the presenter's storyline and audience interaction. Prezi's focus is on creating non-linear presentations that maintain audience engagement through zoomable user interfaces.	https://prezi.com/	Freemium	Presentation Software	["Dynamic Presentations", "Audience Response", "Zoomable UI"]	2025-04-25 16:16:26.348823	2025-04-25 16:16:26.348823
170	InsideSales.com	InsideSales.com offers a sales acceleration platform that uses AI to enhance inside sales management. It features predictive analytics for lead scoring and prioritization, automated dialing, and real-time sales analytics to optimize call scheduling and performance.	https://www.insidesales.com	Commercial	Sales Automation	["AI", "sales acceleration", "lead scoring", "real-time analytics", "inside sales"]	2025-04-25 16:16:26.357587	2025-04-25 16:16:26.357587
171	ExecVision	ExecVision analyzes sales calls to derive insights and actionable feedback. It provides a structured environment for sales professionals to learn from their own calls and from others, effectively simulating a mentorship experience with seasoned sales experts.	https://www.execvision.io	Commercial	Sales Performance Management	["Sales Call Analysis", "Skill Development", "AI Insights"]	2025-04-25 16:16:26.370659	2025-04-25 16:16:26.370659
172	Mursion	Mursion offers a virtual reality environment for professional training, including executive engagement and leadership skills. It uses AI to simulate real-world interactions with avatars that behave like human executives, providing a realistic training environment for users to practice and develop their executive engagement skills.	https://www.mursion.com	Commercial	Virtual Reality Training	["VR", "leadership training", "executive training", "AI simulation"]	2025-04-25 16:16:26.372966	2025-04-25 16:16:26.372966
173	Second Nature	Second Nature uses AI to create a dynamic, interactive training environment where sales professionals can practice their pitches and engage with AI-powered avatars that simulate conversations with executives. This tool helps users refine their approach to corporate selling strategies and executive interaction.	https://www.secondnature.ai	Commercial	AI Sales Training	["sales training", "AI coaching", "executive engagement", "interactive learning"]	2025-04-25 16:16:26.375233	2025-04-25 16:16:26.375233
174	Matterhorn	Matterhorn provides scenario-based training modules tailored for executive engagement, utilizing AI to adapt scenarios and feedback based on the user's performance. This platform is designed to enhance users' skills in navigating complex corporate strategies and engaging effectively with senior leadership.	https://www.matterhorn.io	Commercial	Online Learning Platform	["e-learning", "executive training", "scenario-based training", "AI feedback"]	2025-04-25 16:16:26.377644	2025-04-25 16:16:26.377644
175	PitchBook	PitchBook provides comprehensive data on the global M&A, private equity, and venture capital markets, including detailed coverage of the cybersecurity sector. It helps in analyzing market trends, identifying key players, and understanding investment patterns.	https://www.pitchbook.com	Commercial	Financial Analysis	["financial data", "cybersecurity investments", "market analysis", "venture capital"]	2025-04-25 16:16:26.386385	2025-04-25 16:16:26.386385
176	Marketo	Marketo, an Adobe company, uses AI and machine learning to automate and optimize marketing tasks and workflows. It helps in developing go-to-market strategies by providing tools for customer segmentation, campaign management, and performance analytics to ensure effective market penetration.	https://www.marketo.com/	Commercial	Marketing Automation	["marketing automation", "customer segmentation", "campaign management"]	2025-04-25 16:16:26.392719	2025-04-25 16:16:26.392719
177	SimilarWeb	SimilarWeb provides analytics on web traffic and market engagement. This tool helps companies understand where their competitors are gaining traction and which markets are most lucrative. It offers insights into customer behavior and industry trends, aiding in strategic planning and product positioning.	https://www.similarweb.com	Commercial	Web Analytics	["traffic analytics", "market research", "behavior analysis"]	2025-04-25 16:16:26.412807	2025-04-25 16:16:26.412807
178	Five9 Intelligent Cloud Contact Center	Five9 Intelligent Cloud Contact Center uses AI to manage high-volume phone communications effectively. It automates the dialing process, connects with prospects, and uses AI to qualify leads based on interaction analytics and predefined criteria.	https://www.five9.com	Commercial	AI Contact Center	["AI dialing", "lead qualification", "cloud contact center"]	2025-04-25 16:16:26.535641	2025-04-25 16:16:26.535641
179	Talkdesk	Talkdesk offers an AI-powered contact center solution that excels in handling high volumes of phone calls. It features automated dialing, intelligent routing to connect prospects with the most appropriate agent, and AI-driven insights for lead qualification.	https://www.talkdesk.com	Commercial	AI Contact Center	["automated dialing", "AI routing", "sales calls"]	2025-04-25 16:16:26.538223	2025-04-25 16:16:26.538223
180	Dialpad AI Contact Center	Dialpad AI Contact Center leverages artificial intelligence to enhance high-volume phone communication tasks. It includes Voice Intelligence technology that transcribes calls, identifies customer sentiments, and assists in qualifying leads during live interactions.	https://www.dialpad.com	Commercial	AI Contact Center	["voice intelligence", "call transcription", "sentiment analysis"]	2025-04-25 16:16:26.54061	2025-04-25 16:16:26.54061
181	Aircall	Aircall is a cloud-based phone system and call center software that integrates AI to manage high call volumes efficiently. It provides features like power dialer, call queuing, and real-time analytics to streamline sales calls and lead management.	https://www.aircall.io	Commercial	AI Contact Center	["power dialer", "call analytics", "cloud-based telephony"]	2025-04-25 16:16:26.542888	2025-04-25 16:16:26.542888
182	Exceed.ai	Exceed.ai is an AI-powered sales assistant that automates lead qualification and follow-up. It engages with leads via email and chat, assesses their interest and suitability, and schedules product demonstrations or sales calls directly on the sales team's calendar.	https://www.exceed.ai	Commercial	Sales Automation	["AI Sales Assistant", "Lead Qualification", "Demo Scheduling", "Email Automation", "Chatbot"]	2025-04-25 16:16:26.545646	2025-04-25 16:16:26.545646
183	Conversica	Conversica provides an AI-driven automated sales assistant that reaches out to leads with natural language emails or messages. It engages in conversations to determine lead interest and readiness, and can autonomously set up demos or meetings with sales representatives.	https://www.conversica.com	Commercial	Customer Relationship Management	["AI Assistant", "Lead Engagement", "Automated Conversations", "Sales Enablement"]	2025-04-25 16:16:26.548243	2025-04-25 16:16:26.548243
184	Dialpad Sell	Dialpad Sell offers AI-powered sales dialer solutions that automate the cold calling process. It features Voice Intelligence technology that provides real-time coaching and feedback during calls, helping sales teams to improve their pitch and close rates.	https://www.dialpad.com/sell/	Commercial	Sales Automation	["AI", "sales automation", "voice intelligence", "real-time coaching"]	2025-04-25 16:16:26.555092	2025-04-25 16:16:26.555092
185	Beautiful.ai	Beautiful.ai is an AI-powered presentation tool that assists in designing visually appealing sales presentations. While it primarily focuses on design, it can integrate with other AI tools to adapt content dynamically and provide data-driven insights during presentations.	https://www.beautiful.ai	Freemium	Presentation Software	["Presentation Design", "AI Design Assistance", "Sales Presentations", "Interactive Presentations"]	2025-04-25 16:16:26.594831	2025-04-25 16:16:26.594831
186	Crunchbase	Crunchbase provides comprehensive data on startups, venture capital firms, and other business entities. It uses AI to analyze market trends, investment patterns, and industry movements, helping businesses stay informed about the latest developments in their respective fields.	https://www.crunchbase.com	Freemium	Market Intelligence	["industry trends", "investment tracking", "startup insights"]	2025-04-25 16:16:26.606269	2025-04-25 16:16:26.606269
187	Trend Hunter AI	Trend Hunter AI utilizes advanced algorithms to identify and analyze emerging trends across various industries. This tool helps businesses anticipate market shifts and innovate new products or services.	https://www.trendhunter.com	Commercial	Trend Analysis	["trend spotting", "innovation", "market foresight"]	2025-04-25 16:16:26.612888	2025-04-25 16:16:26.612888
188	InsightSquared	InsightSquared offers AI-driven sales analytics and performance management solutions that analyze various sales metrics, including pipeline growth and quota attainment. It provides detailed forecasts and insights, helping sales leaders make informed decisions.	https://www.insightsquared.com/	Commercial	Business Intelligence	["sales analytics", "business intelligence", "performance tracking"]	2025-04-25 16:16:26.62151	2025-04-25 16:16:26.62151
189	People.ai	People.ai utilizes AI to optimize sales operations by analyzing the effectiveness of face-to-face customer interactions. It automates the capture of sales activity to provide real-time insights into performance and helps in scheduling and training of sales personnel.	https://www.people.ai	Commercial	Sales Performance Management	["AI", "sales optimization", "activity tracking", "training"]	2025-04-25 16:16:26.628262	2025-04-25 16:16:26.628262
190	Five9 Predictive Dialer	Five9 Predictive Dialer uses AI to increase the efficiency of call centers by predicting the best times to call customers and automating the dialing process. It helps in managing high volumes of calls by minimizing idle time and ensuring agents are connected as soon as a call is answered.	https://www.five9.com/products/predictive-dialer	Commercial	Call Center Automation	["predictive dialer", "call automation", "AI dialing", "high-volume calling"]	2025-04-25 16:16:26.643219	2025-04-25 16:16:26.643219
191	NICE CXone	NICE CXone is a cloud customer experience platform that includes an Automated Dialer which uses advanced algorithms to manage high volumes of calls efficiently. It optimizes call schedules and automates the dialing process, improving operational efficiency and agent productivity.	https://www.nice.com/websites/cxone/	Commercial	Customer Experience Management	["automated dialer", "customer experience", "call management", "AI"]	2025-04-25 16:16:26.645907	2025-04-25 16:16:26.645907
192	Aspect Via	Aspect Via offers a comprehensive call management solution that includes a high-volume automated dialing system. It leverages AI to optimize call schedules and automate the dialing processes, which helps in managing large scale outbound call activities efficiently.	https://www.aspect.com/solutions/call-center-solutions/aspect-via-platform	Commercial	Call Center Solutions	["automated dialing", "call center", "high-volume management", "AI"]	2025-04-25 16:16:26.648158	2025-04-25 16:16:26.648158
193	Ambition	Ambition is a sales management platform that syncs with CRM systems to provide real-time performance tracking, gamification, and coaching insights. It enhances sales team accountability and motivation by turning productivity data into engaging, competitive leaderboards and scorecards.	https://ambition.com	Commercial	Sales Performance Management	["sales gamification", "performance tracking", "real-time feedback", "CRM integration"]	2025-04-25 16:16:26.650413	2025-04-25 16:16:26.650413
194	Hoopla	Hoopla is a team performance software that leverages gamification techniques to drive engagement and enhance performance among sales teams. It offers features like leaderboards, contests, and real-time recognition, all designed to boost team spirit and accountability.	https://www.hoopla.net	Commercial	Employee Engagement	["gamification", "sales performance", "team motivation", "real-time updates"]	2025-04-25 16:16:26.652879	2025-04-25 16:16:26.652879
195	Spinify	Spinify is a leader in leaderboard software for boosting team performance. It uses gamification to increase sales team engagement and accountability by displaying real-time performance metrics and personalized motivators.	https://www.spinify.com	Commercial	Gamification	["leaderboards", "sales gamification", "performance management", "real-time feedback"]	2025-04-25 16:16:26.655142	2025-04-25 16:16:26.655142
196	LevelEleven	LevelEleven is a performance management tool that focuses on real-time feedback and gamification to enhance sales team performance. It integrates with Salesforce to provide personalized scorecards, contests, and performance metrics that drive accountability and results.	https://leveleleven.com	Commercial	Sales Performance Management	["salesforce integration", "performance metrics", "gamification", "real-time feedback"]	2025-04-25 16:16:26.657384	2025-04-25 16:16:26.657384
197	Chili Piper	Chili Piper specializes in scheduling automation for high-priority sales meetings. It integrates directly with CRM systems to pull in prospect priority data and uses intelligent algorithms to schedule meetings at optimal times for both sales teams and prospects.	https://www.chilipiper.com	Commercial	Sales Automation	["sales automation", "CRM integration", "meeting scheduling", "lead management"]	2025-04-25 16:16:26.666018	2025-04-25 16:16:26.666018
198	Crimson Hexagon	Crimson Hexagon is an AI-powered consumer insights platform that uses advanced algorithms to analyze market trends and consumer sentiment from various data sources, including social media. It helps sales teams understand market dynamics and emerging trends to make informed decisions.	https://www.crimsonhexagon.com	Commercial	Market Intelligence	["market trend analysis", "consumer insights", "AI", "data analysis"]	2025-04-25 16:16:26.668365	2025-04-25 16:16:26.668365
199	Talkwalker	Talkwalker uses AI and machine learning to analyze online, social, and print media data to identify market trends and brand health. It provides real-time analytics that helps sales teams to track market movements and consumer opinions.	https://www.talkwalker.com	Commercial	Social Media Monitoring	["social media analysis", "market trends", "brand monitoring", "AI"]	2025-04-25 16:16:26.670767	2025-04-25 16:16:26.670767
200	Brandwatch	Brandwatch is a digital consumer intelligence platform that uses AI to analyze data across the web, social media, and proprietary data sources. It helps in identifying market trends, consumer sentiment, and competitive analysis, providing comprehensive insights to sales and marketing teams.	https://www.brandwatch.com	Commercial	Consumer Research	["market analysis", "consumer behavior", "AI", "trend analysis"]	2025-04-25 16:16:26.673041	2025-04-25 16:16:26.673041
201	Sprout Social	Sprout Social offers social media management and analytics tools that leverage AI to provide detailed reports on social media trends, engagement, and audience growth. This assists sales teams in understanding market trends and developing strategies based on real-time data.	https://www.sproutsocial.com	Commercial	Social Media Analytics	["social media", "analytics", "AI", "market trends"]	2025-04-25 16:16:26.675282	2025-04-25 16:16:26.675282
\.


--
-- Data for Name: assessment_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_responses (response_id, assessment_id, user_id, question_identifier, response_text, response_numeric, response_boolean, response_json, created_at) FROM stdin;
\.


--
-- Data for Name: assessment_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_results (result_id, assessment_id, identified_themes, ranked_priorities, recommended_capabilities, capability_rationale, existing_tool_analysis, recommended_tools, rollout_commentary, heatmap_data, processing_status, error_message, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: assessment_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_scores (id, wizard_step_id, time_savings, quality_impact, strategic_alignment, data_readiness, technical_feasibility, adoption_risk, value_potential_total, ease_of_implementation_total, total_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessments (id, title, organization_id, user_id, status, created_at, step_data) FROM stdin;
\.


--
-- Data for Name: capability_tool_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.capability_tool_mapping (mapping_id, capability_id, tool_id, notes) FROM stdin;
1	1	1	\N
2	1	2	\N
3	1	3	\N
4	1	4	\N
5	2	4	\N
6	2	5	\N
7	2	6	\N
8	2	7	\N
9	3	8	\N
10	3	9	\N
11	3	10	\N
12	3	11	\N
13	4	12	\N
14	4	13	\N
15	4	14	\N
16	5	15	\N
17	5	16	\N
18	5	17	\N
19	5	18	\N
20	5	19	\N
21	6	4	\N
22	6	20	\N
23	6	21	\N
24	6	22	\N
25	7	23	\N
26	7	24	\N
27	7	25	\N
28	8	26	\N
29	8	27	\N
30	8	28	\N
31	9	29	\N
32	9	23	\N
33	9	30	\N
34	10	31	\N
35	10	23	\N
36	10	30	\N
37	11	32	\N
38	11	33	\N
39	11	34	\N
40	12	35	\N
41	12	36	\N
42	12	37	\N
43	12	38	\N
44	13	39	\N
45	13	40	\N
46	13	41	\N
47	13	42	\N
48	14	29	\N
49	14	33	\N
50	14	43	\N
51	14	23	\N
52	15	29	\N
53	15	23	\N
54	15	44	\N
55	15	30	\N
56	16	45	\N
57	16	44	\N
58	16	46	\N
59	16	47	\N
60	17	23	\N
61	17	29	\N
62	17	30	\N
63	17	33	\N
64	18	48	\N
65	18	49	\N
66	18	50	\N
67	18	51	\N
68	18	52	\N
69	19	53	\N
70	19	54	\N
71	19	55	\N
72	20	35	\N
73	20	56	\N
74	20	57	\N
75	21	29	\N
76	21	23	\N
77	21	58	\N
78	22	29	\N
79	22	23	\N
80	22	30	\N
81	23	29	\N
82	23	51	\N
83	23	33	\N
84	23	43	\N
85	24	59	\N
86	24	60	\N
87	24	61	\N
88	25	62	\N
89	25	63	\N
90	25	64	\N
91	25	65	\N
92	26	30	\N
93	26	29	\N
94	26	43	\N
95	26	23	\N
96	26	33	\N
97	27	29	\N
98	27	33	\N
99	27	66	\N
100	27	67	\N
101	27	68	\N
102	28	69	\N
103	28	70	\N
104	28	71	\N
105	28	72	\N
106	29	44	\N
107	29	45	\N
108	29	30	\N
109	30	44	\N
110	30	45	\N
111	30	30	\N
112	31	73	\N
113	31	74	\N
114	31	15	\N
115	31	75	\N
116	32	39	\N
117	32	40	\N
118	32	42	\N
119	32	41	\N
120	33	6	\N
121	33	29	\N
122	33	76	\N
123	34	26	\N
124	34	27	\N
125	34	35	\N
126	35	77	\N
127	35	78	\N
128	35	79	\N
129	36	80	\N
130	36	23	\N
131	36	73	\N
132	37	44	\N
133	37	45	\N
134	37	47	\N
135	37	81	\N
136	38	30	\N
137	38	82	\N
138	38	43	\N
139	38	45	\N
140	39	44	\N
141	39	45	\N
142	39	30	\N
143	39	81	\N
144	40	53	\N
145	40	33	\N
146	40	83	\N
147	40	66	\N
148	41	84	\N
149	41	85	\N
150	41	86	\N
151	42	29	\N
152	42	33	\N
153	42	43	\N
154	42	67	\N
155	42	68	\N
156	43	44	\N
157	43	45	\N
158	43	30	\N
159	44	87	\N
160	44	88	\N
161	44	81	\N
162	45	48	\N
163	45	89	\N
164	45	90	\N
165	45	91	\N
166	46	92	\N
167	46	6	\N
168	46	93	\N
169	46	94	\N
170	47	29	\N
171	47	23	\N
172	47	95	\N
173	48	23	\N
174	48	24	\N
175	48	25	\N
176	49	45	\N
177	49	44	\N
178	49	47	\N
179	49	96	\N
180	49	46	\N
181	50	45	\N
182	50	44	\N
183	50	47	\N
184	50	29	\N
185	51	29	\N
186	51	33	\N
187	51	23	\N
188	51	47	\N
189	52	31	\N
190	52	29	\N
191	52	6	\N
192	52	97	\N
193	53	98	\N
194	53	99	\N
195	53	100	\N
196	53	101	\N
197	54	43	\N
198	54	29	\N
199	54	33	\N
200	54	102	\N
201	54	103	\N
202	55	104	\N
203	55	105	\N
204	55	106	\N
205	55	107	\N
206	56	6	\N
207	56	72	\N
208	56	108	\N
209	57	42	\N
210	57	52	\N
211	57	40	\N
212	57	109	\N
213	58	29	\N
214	58	110	\N
215	58	33	\N
216	58	111	\N
217	59	31	\N
218	59	97	\N
219	59	112	\N
220	59	113	\N
221	60	39	\N
222	60	40	\N
223	60	42	\N
224	60	41	\N
225	60	52	\N
226	61	114	\N
227	61	115	\N
228	61	47	\N
229	61	116	\N
230	62	32	\N
231	62	43	\N
232	62	33	\N
233	62	68	\N
234	63	72	\N
235	63	6	\N
236	63	117	\N
237	64	43	\N
238	64	68	\N
239	64	33	\N
240	64	67	\N
241	65	118	\N
242	65	119	\N
243	65	120	\N
244	65	121	\N
245	66	116	\N
246	66	47	\N
247	66	81	\N
248	66	122	\N
249	67	123	\N
250	67	124	\N
251	67	125	\N
252	67	126	\N
253	68	127	\N
254	68	86	\N
255	68	84	\N
256	68	128	\N
257	69	129	\N
258	69	130	\N
259	69	131	\N
260	70	44	\N
261	70	45	\N
262	70	30	\N
263	71	29	\N
264	71	33	\N
265	71	43	\N
266	71	132	\N
267	72	73	\N
268	72	74	\N
269	72	105	\N
270	73	44	\N
271	73	45	\N
272	73	30	\N
273	73	82	\N
274	74	32	\N
275	74	43	\N
276	74	33	\N
277	74	68	\N
278	75	29	\N
279	75	23	\N
280	75	30	\N
281	75	44	\N
282	76	73	\N
283	76	53	\N
284	76	133	\N
285	76	57	\N
286	77	47	\N
287	77	116	\N
288	77	81	\N
289	77	45	\N
290	78	23	\N
291	78	30	\N
292	78	29	\N
293	79	134	\N
294	79	135	\N
295	79	136	\N
296	80	137	\N
297	80	116	\N
298	80	81	\N
299	80	122	\N
300	81	45	\N
301	81	44	\N
302	81	137	\N
303	82	138	\N
304	82	139	\N
305	82	140	\N
306	82	141	\N
307	83	138	\N
308	83	140	\N
309	83	142	\N
310	83	143	\N
311	83	144	\N
312	84	141	\N
313	84	145	\N
314	84	146	\N
315	84	147	\N
316	85	148	\N
317	85	52	\N
318	85	25	\N
319	85	149	\N
320	86	43	\N
321	86	29	\N
322	86	33	\N
323	86	68	\N
324	87	150	\N
325	87	151	\N
326	87	152	\N
327	88	153	\N
328	88	154	\N
329	88	155	\N
330	89	156	\N
331	89	157	\N
332	89	158	\N
333	90	29	\N
334	90	23	\N
335	90	159	\N
336	91	160	\N
337	91	62	\N
338	91	64	\N
339	92	161	\N
340	92	162	\N
341	92	163	\N
342	92	164	\N
343	93	165	\N
344	93	166	\N
345	93	167	\N
346	93	168	\N
347	93	169	\N
348	94	44	\N
349	94	45	\N
350	94	30	\N
351	95	170	\N
352	95	30	\N
353	95	45	\N
354	96	45	\N
355	96	44	\N
356	96	46	\N
357	96	171	\N
358	97	172	\N
359	97	173	\N
360	97	174	\N
361	98	73	\N
362	98	74	\N
363	98	38	\N
364	98	175	\N
365	99	73	\N
366	99	74	\N
367	99	176	\N
368	100	39	\N
369	100	40	\N
370	100	42	\N
371	100	52	\N
372	100	41	\N
373	101	35	\N
374	101	36	\N
375	101	38	\N
376	101	177	\N
377	102	48	\N
378	102	91	\N
379	102	49	\N
380	102	51	\N
381	103	44	\N
382	103	45	\N
383	103	46	\N
384	104	29	\N
385	104	23	\N
386	104	159	\N
387	105	31	\N
388	105	29	\N
389	105	71	\N
390	105	6	\N
391	106	23	\N
392	106	24	\N
393	106	30	\N
394	106	29	\N
395	107	29	\N
396	107	33	\N
397	107	43	\N
398	108	45	\N
399	108	44	\N
400	108	46	\N
401	108	137	\N
402	109	45	\N
403	109	44	\N
404	109	46	\N
405	109	171	\N
406	110	41	\N
407	110	39	\N
408	110	42	\N
409	110	40	\N
410	111	178	\N
411	111	179	\N
412	111	180	\N
413	111	181	\N
414	112	182	\N
415	112	183	\N
416	112	31	\N
417	113	181	\N
418	113	184	\N
419	113	45	\N
420	114	44	\N
421	114	45	\N
422	114	171	\N
423	115	43	\N
424	115	32	\N
425	115	33	\N
426	115	68	\N
427	116	43	\N
428	116	102	\N
429	116	33	\N
430	116	67	\N
431	117	29	\N
432	117	23	\N
433	117	159	\N
434	118	44	\N
435	118	45	\N
436	118	185	\N
437	118	169	\N
438	119	35	\N
439	119	53	\N
440	119	45	\N
441	120	186	\N
442	120	74	\N
443	120	38	\N
444	120	187	\N
445	121	32	\N
446	121	23	\N
447	121	33	\N
448	121	188	\N
449	122	45	\N
450	122	44	\N
451	122	189	\N
452	123	45	\N
453	123	44	\N
454	123	137	\N
455	123	96	\N
456	124	190	\N
457	124	191	\N
458	124	192	\N
459	125	193	\N
460	125	194	\N
461	125	195	\N
462	125	196	\N
463	126	161	\N
464	126	162	\N
465	126	163	\N
466	126	197	\N
467	127	198	\N
468	127	199	\N
469	127	200	\N
470	127	201	\N
471	128	156	\N
472	128	157	\N
473	128	158	\N
474	128	86	\N
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, description) FROM stdin;
1	Sales & Marketing	Handles all sales and marketing activities
2	Customer Support	Provides support to customers
3	Finance	Manages financial operations
4	Human Resources	Handles employee management and recruitment
5	Engineering	Develops and maintains products
6	Operations	Oversees day-to-day business operations
\.


--
-- Data for Name: job_descriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_descriptions (id, title, company, location, job_board, source_url, raw_content, processed_content, keywords, date_scraped, date_processed, status, error) FROM stdin;
1	Sales Development Representative	Wall Street Oasis	\N	linkedin	https://www.linkedin.com/jobs/view/4131450601/?eBP=CwEAAAGWZTLUHoRqZs4nU0BVkWx7vO_F0sHamvT_H6-LTMRW53z63msW1MsnPNwAZ38-3qchkTlvgUYJXSiFNrkGGFCSvkHEZWThkGC8eMz2Ck5dmyF4kvOvIWafFkPRI-1jduvGC3uftyj26i_ODe3-iXqkKoNm0Yx20kMDz7p8b7YhmZ_zFjWZep0yGv1l02SWpxD3OUetSd8VmR8N3BPANxru3OPmyLuUvHD9DRhyvhwQXOCXsGlvZ9Cj6ZpFoHIthYSh004AmPFTNAqfPoeCxSHuJ9zObB79t6TniQBYsvplA4m2ZYTo0_G9Hgs-VSt010_Ix9L02rhptmvdZUuZkV3yVYVZ1m7Mmjg-nuLDmaaGHELKTWsO3zlAL-92Shx2Qj3Q-xSgxOkBxZU_y0Y52rBiwUfAA5vjK6pzS9Jku0haPyyH948i3SmdcfNnOX5tpqVAUQxryd5dA5J2AWMq-QGpcQYCwQ&refId=mJ9JiW3nmiK9M3%2Bdw4Ipgw%3D%3D&trackingId=8bnt9ElhslaBKKPMuKyr5g%3D%3D&trk=flagship3_search_srp_jobs	About the job\n            \n\n            \n                \n                  To be considered, please complete this assessment: https://app.testgorilla.com/s/357xhlxtIf you are currently or have worked in high finance and want to transition to a sales role, this would be a great place to learn fast from our team.Company DescriptionWall Street Oasis is the largest community focused on careers in finance with 1 million registered members and 20 million visits per year. The platform offers valuable resources, insights, and networking opportunities for finance professionals and aspiring candidates.Role DescriptionThis is a full-time remote role for a Sales Development Representative at Wall Street Oasis. The Sales Development Representative will be responsible for inside sales, communication, and business development. The role involves qualifying leads, nurturing relationships, and driving revenue growth.Qualifications      Inside Sales and Sales skillsLead Generation and Business Development skillsEffective Communication skillsStrong analytical and problem-solving skillsAbility to work independently and remotelyExperience in the finance industry is a plusBachelor's degree in Business, Finance, or related field\nTo be considered, please complete this assessment: https://app.testgorilla.com/s/357xhlxt	\N	{"Sales Development Representative"}	2025-04-24 00:29:54.705	\N	raw	\N
\.


--
-- Data for Name: job_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_roles (id, title, department_id, description, key_responsibilities, ai_potential) FROM stdin;
1	Sales Operations Specialist	1	Manages RFP responses, sales data analysis, and CRM maintenance	{"Manage RFP responses","Maintain sales data","Perform CRM analysis","Create sales reports","Support proposal creation"}	High
2	Content Marketing Manager	1	Creates and distributes content for marketing campaigns	{"Create marketing content","Manage editorial calendar","Coordinate content distribution","Analyze content performance","Develop content strategy"}	Medium
3	Digital Marketing Specialist	1	Manages online advertising and campaign analysis	{"Manage online ad campaigns","Analyze marketing data","Optimize conversion rates","Report on marketing KPIs","Conduct A/B testing"}	Medium
4	Customer Support Agent	2	Handles tier 1 customer inquiries via chat, email, and phone	{"Handle customer inquiries","Troubleshoot basic issues","Escalate complex problems","Maintain customer records","Follow up on resolved issues"}	High
5	Technical Support Specialist	2	Resolves complex technical issues and product-specific problems	{"Diagnose technical problems","Provide advanced troubleshooting","Document solutions","Train junior support staff","Contribute to knowledge base"}	Medium
\.


--
-- Data for Name: job_scraper_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_scraper_configs (id, name, target_website, keywords, location, is_active, cron_schedule, last_run, created_at) FROM stdin;
1	LinkedIn SDR Search	linkedin	{"Sales Development Representative"}	Remote	t	0 0 * * *	2025-04-24 00:29:55.731	2025-04-23 15:53:54.68231
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, industry, size, description) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, assessment_id, generated_at, executive_summary, prioritization_data, ai_suggestions, performance_impact, consultant_commentary) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, full_name, email, role) FROM stdin;
\.


--
-- Name: ai_capabilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_capabilities_id_seq', 1, true);


--
-- Name: ai_tools_tool_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_tools_tool_id_seq', 201, true);


--
-- Name: assessment_responses_response_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_responses_response_id_seq', 1, false);


--
-- Name: assessment_results_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_results_result_id_seq', 1, false);


--
-- Name: assessment_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_scores_id_seq', 1, false);


--
-- Name: assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessments_id_seq', 1, false);


--
-- Name: capability_tool_mapping_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.capability_tool_mapping_mapping_id_seq', 474, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- Name: job_descriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_descriptions_id_seq', 1, true);


--
-- Name: job_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_roles_id_seq', 1, false);


--
-- Name: job_scraper_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_scraper_configs_id_seq', 1, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: ai_capabilities ai_capabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_capabilities
    ADD CONSTRAINT ai_capabilities_pkey PRIMARY KEY (id);


--
-- Name: ai_tools ai_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_tools
    ADD CONSTRAINT ai_tools_pkey PRIMARY KEY (tool_id);


--
-- Name: assessment_responses assessment_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT assessment_responses_pkey PRIMARY KEY (response_id);


--
-- Name: assessment_results assessment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_pkey PRIMARY KEY (result_id);


--
-- Name: assessment_scores assessment_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_scores
    ADD CONSTRAINT assessment_scores_pkey PRIMARY KEY (id);


--
-- Name: assessment_scores assessment_scores_wizard_step_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_scores
    ADD CONSTRAINT assessment_scores_wizard_step_id_unique UNIQUE (wizard_step_id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: capability_tool_mapping capability_tool_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capability_tool_mapping
    ADD CONSTRAINT capability_tool_mapping_pkey PRIMARY KEY (mapping_id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: job_descriptions job_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_descriptions
    ADD CONSTRAINT job_descriptions_pkey PRIMARY KEY (id);


--
-- Name: job_roles job_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_roles
    ADD CONSTRAINT job_roles_pkey PRIMARY KEY (id);


--
-- Name: job_scraper_configs job_scraper_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_scraper_configs
    ADD CONSTRAINT job_scraper_configs_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- PostgreSQL database dump complete
--

