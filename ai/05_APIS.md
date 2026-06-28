# API Routes

All routes are under `app/api/`. All require auth unless noted.

## Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with person + password |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/session` | Get current session |

## Work Items
| Method | Path | Description |
|---|---|---|
| GET | `/api/work-items` | List with filters (status, type, owner, search) |
| POST | `/api/work-items` | Create work item |
| GET | `/api/work-items/[id]` | Get single work item with actions, decisions, logs |
| PUT | `/api/work-items/[id]` | Update work item |
| DELETE | `/api/work-items/[id]` | Delete work item |
| GET | `/api/work-items/[id]/actions` | List actions for work item |
| POST | `/api/work-items/[id]/actions` | Create action |
| PATCH | `/api/work-items/[id]/actions/[actionId]` | Update action (status, result) |

## Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregate stats (counts, team pulse, recent items) |
| GET | `/api/dashboard/briefing` | Morning briefing items for George |

## Decisions
| Method | Path | Description |
|---|---|---|
| PATCH | `/api/decisions/[id]` | Approve / Reject / Pause / MoreInfoNeeded |

## Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/api/my-tasks` | Actions assigned to person (filters: status, person, dueBefore) |
| GET | `/api/team/capacity` | Per-person open/blocked/overdue counts |

## Voice
| Method | Path | Description |
|---|---|---|
| POST | `/api/voice/upload` | Upload audio blob → creates VoiceIntake record |
| POST | `/api/voice/transcribe` | Transcribe uploaded audio via Whisper |
| POST | `/api/voice/approve` | Approve parsed draft → create WorkItem |

## Templates
| Method | Path | Description |
|---|---|---|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/[id]` | Update template |
| DELETE | `/api/templates/[id]` | Delete template |

## Alert Management
| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/alert-recipients` | List / create alert recipients |
| GET/PUT/DELETE | `/api/alert-recipients/[id]` | Single recipient CRUD |

## Portfolio
| Method | Path | Description |
|---|---|---|
| GET | `/api/portfolio` | Portfolio data with filters |

## Diagnostics
| Method | Path | Description |
|---|---|---|
| GET | `/api/debugdb` | DB connection test (auth required) |
