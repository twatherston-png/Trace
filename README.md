# Trace

**A travel companion app for organizing itineraries, photos, memories, and documents.**

## The Problem

Travelers juggle a million pieces: flights, hotels, activities, photos, memories, logistics. Nothing holds it all together in a way that's actually beautiful and useful.

Trent currently copies everything into a Word document and scrolls through it during trips. There has to be a better way.

## The Solution

**Trace** — one place for:
- Itinerary planning (trips, days, activities)
- Photo organization (by trip, day, location, with notes)
- Memory keeping (journal entries, highlights)
- Document storage (boarding passes, tickets, confirmations)

## Core Features (v1)

- Create/manage trips (name, dates, locations)
- Add activities/events to each day
- Upload photos with notes and geolocation
- View itinerary by day
- Store documents (PDFs, images)
- Basic search

## Future Features (v2+)

- Budget tracking
- Offline mode
- Sharing with travel buddies
- Weather integration
- Packing lists
- Maps integration
- Export to PDF/print

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **File storage:** AWS S3 or similar
- **Hosting:** Vercel or Railway

## Status

**Phase:** Design  
**Started:** June 24, 2026  
**Team:** Cass (builder) + Trent (product owner + learner)

## Project Structure

```
projects/trace/
├── README.md (this file)
├── design/
│   ├── user-flow.md
│   ├── data-structure.md
│   └── mockups/
├── src/
│   ├── frontend/
│   └── backend/
└── docs/
    └── development-log.md
```

## Notes

- Built for Trent first, then other travelers
- Focus on photos + memories + itinerary + documents
- Keep it simple. Keep it beautiful. Keep it useful.
