# Firefighter
## Bug Radar for Live Games

### Working Concept
Firefighter is a zero-setup QA intelligence tool for live games. It monitors public community sources and detects early signs of live issues before they escalate internally.

The system converts community noise into actionable QA alerts.

---

# Product Vision

Firefighter acts as a **mission control dashboard** for QA teams.

QA becomes a **live operations firefighter team**, detecting problems early and protecting the product after release.

Community signals → AI detection → QA alert → investigation.

---

# Target User

Primary user:

- QA Manager
- QA Lead
- LiveOps QA
- Release QA

Use case:

Dashboard remains open on a **second monitor** during live monitoring.

---

# MVP Scope

The MVP must be:

- game-level monitoring only
- zero setup
- public data only
- focused on live environments
- focused on early signal detection

Out of scope:

- internal documentation ingestion
- private Discord servers
- build-specific monitoring
- beta environments
- automated bug filing
- competitor analytics

---

# Zero Setup Principle

User only provides:

Game Name  
Optional aliases  
Optional patch release time

Example:

Game: Disney Dreamlight Valley  
Aliases: DDV  
Patch Release: 2026-03-06 10:00 UTC

---

# Data Sources (MVP)

Public sources only.

## Reddit
- relevant subreddits
- search by game name
- posts and optionally comments

## Steam Reviews
- recent reviews
- review text
- timestamps
- recommendation flag

## Twitter / X
- posts mentioning game name
- hashtags
- timestamps

## Facebook
Optional:
- public page posts
- public comments

---

# Product Goals

Primary goals:

- detect live issues early
- reduce QA manual monitoring
- provide actionable alerts
- support patch monitoring
- support QA feedback loop

---

# Issue Types

The system should detect:

### Crash / Freeze
crash  
freeze  
black screen  
game closes

### Progression Blocker
quest stuck  
item missing  
cannot interact  
NPC missing

### Exploit / Economy Break
dupe exploit  
infinite currency  
broken farming

### Connectivity
cannot login  
server down  
matchmaking broken

### Sentiment Spike
community backlash  
pay to win complaints  
event frustration

---

# Detection Logic

Alert if **2 of 3 conditions are met**:

1. 10+ similar messages within 10 minutes
2. spike in discussion volume
3. confirmation across multiple sources

---

# Patch Monitoring Window

Critical monitoring period:

**First 12 hours after patch release**

During this window:

- monitoring sensitivity increases
- patch health indicators appear
- alert thresholds slightly reduced

---

# Main Dashboard

Mission control style interface.

## Global Game Health

Indicators:

Game Health Score  
Crash Risk  
Progression Risk  
Exploit Risk  
Connectivity Risk  
Sentiment Status

---

## Live Alerts

Alert cards display:

Alert ID  
Issue type  
Confidence  
Mention count  
Source count  
Top phrases  
Timestamp

Statuses:

New  
Under Investigation  
Confirmed  
False Alarm  
Known Issue

---

## Signal Timeline

Shows signal evolution:

Example:

09:12 Reddit report  
09:18 Steam review  
09:23 Twitter spike  
09:25 Alert triggered

---

# Alert Investigation Panel

When an alert is opened:

## AI Summary

Short explanation of likely issue.

## Suggested Bug Title

Example:

Progression Blocker: Saucery Extract cannot be picked up during Jailbreak quest

## Suggested Investigation Checks

Example:

- verify interaction trigger
- verify quest progression state
- verify item spawn condition

## Raw Evidence

Display example player reports.

This builds trust.

---

# Human Feedback Loop

QA actions:

Confirm Issue  
False Alarm  
Needs Investigation

Optional comment field.

Example:

Players misunderstood quest step.

Feedback stored for future learning.

---

# Clustering

Player reports should be grouped into issue clusters.

Example phrases:

can't pick up item  
item bugged  
interaction missing  

These should belong to one cluster.

Clustering process:

1 normalize text  
2 generate embeddings  
3 semantic similarity  
4 cluster messages  
5 classify issue type

---

# Classification

Each cluster assigned:

Primary issue type  
Confidence score

Example:

Progression Blocker  
Confidence 0.84

---

# Patch Risk Panel

During patch window display:

Patch Monitoring Active  
Time Since Release  
Patch Risk Index  
Active Alerts

Risk scale:

0-20 stable  
21-40 minor issues  
41-70 attention needed  
71+ critical

---

# Data Model

Entities:

Game  
RawSignal  
Cluster  
Alert  
Feedback

---

# Suggested Tech Stack

Backend:
Python  
FastAPI  

Database:
PostgreSQL

Cache / Queue:
Redis

Vector Search:
pgvector

Frontend:
Next.js  
React  

Realtime updates:
WebSockets

LLM layer:
OpenAI or Anthropic APIs

Embeddings:
OpenAI or sentence-transformers

---

# Architecture Overview

Pipeline:

Source collectors  
→ normalize data  
→ embeddings  
→ clustering  
→ classification  
→ alert engine  
→ dashboard

---

# UI Style

Interface inspired by:

- DEFCON
- radar systems
- intelligence dashboards
- Palantir-style operational tools

Dark theme  
Minimal text  
Signal-based visualization.

---

# Development Phases

Phase 1 – infrastructure  
Phase 2 – signal detection  
Phase 3 – alerts and UI  
Phase 4 – QA feedback  
Phase 5 – patch monitoring

---

# Definition of Done

The MVP is complete when a QA user can:

- add a game
- monitor signals
- receive alerts
- inspect evidence
- read AI summary
- see suggested bug title
- see investigation hints
- mark alerts
- monitor patch health