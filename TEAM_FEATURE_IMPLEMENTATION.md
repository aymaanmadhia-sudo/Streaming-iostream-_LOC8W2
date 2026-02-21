# Team Registration Feature - Implementation Summary

## Overview
A complete team registration and management system has been added to the hackathon app, allowing students to create teams, add members, and submit projects as a group while maintaining individual submission capabilities.

## Database Schema Changes

### New Migration: `009_teams.sql`
- **teams table**: Stores team information (id, team_name, leader_id, created_at, updated_at)
- **team_members table**: Tracks team membership (id, team_id, user_id, joined_at) with unique constraint
- **submissions table modifications**: 
  - Added `team_id` column (nullable, references teams.id)
  - Added check constraint to ensure submissions have either user_id OR team_id, not both
  - Updated RLS policies to allow team members to read/write team submissions
- **RLS Policies**: Implemented for secure access control

## Backend APIs

### Team Management Endpoints

#### `POST /api/teams` - Create Team
- **Auth**: Required (authenticated user)
- **Body**: `{ team_name: string }`
- **Returns**: Team object with members list
- **Logic**: 
  - Verifies user is not already in a team
  - Creates team with user as leader
  - Automatically adds creator as team member

#### `GET /api/teams` - Get User's Team
- **Auth**: Required
- **Returns**: Team details with all members, or null if not in team
- **Includes**: isLeader flag for permission checks

#### `POST /api/teams/add-member` - Add Team Member
- **Auth**: Required (leader only)
- **Body**: `{ teamId: string, email: string }`
- **Returns**: Success response with member info
- **Validations**:
  - Verifies requester is team leader
  - Checks user exists in users table by email
  - Prevents duplicate membership
  - Prevents user from being in multiple teams

### Submission APIs - Updated

#### `POST /api/submission` & `POST /api/submissions`
- **Auto-Detection**: Checks if user is in team
- **Team Submission**: Creates with team_id, user_id = null
- **Individual Submission**: Creates with user_id, team_id = null
- **GitHub Stats**: Automatically fetches stars and last commit for all submissions

#### `GET /api/submission` & `GET /api/submissions`
- **User View**: Returns their submission (personal or team)
- **Leaderboard**: Enhanced to display team names alongside individual names

## Frontend Pages

### New Page: `/student/team`
**Features**:
- Create new team (if not already in one)
- Display current team information
- List all team members with emails
- Add members by email (leader only)
- Real-time error and success messages
- Loading states for all operations

**UI Components**:
- Team creation form
- Team info display card
- Member list with details
- Add member form (leader-only section)

### Updated Page: `/student/layout.tsx`
- Added navigation link to Team page
- Link appears in header navigation between Dashboard and Submit Project

### Updated Page: `/judge/evaluate/page.tsx`
- Enhanced to fetch team information for submissions
- Fetches team names and all team members
- Passes enriched data to evaluation component

### Updated Component: `/judge/evaluate/judge-evaluate-list.tsx`
- Displays team name and icon for team submissions
- Shows all team member names and emails
- Maintains original scoring functionality
- Distinguishes between team and individual submissions

### New Page: `/admin/teams`
**Features**:
- List all teams with detailed information
- Display team leader with contact info
- Show member count and names
- Display submission count per team
- Show team creation date

**Information Displayed**:
- Team name
- Leader name and email
- Member count and list
- Submission count
- Created date

### Updated Page: `/admin/page.tsx`
- Added "Total teams" card to dashboard stats
- Added Teams link to navigation menu
- Updated grid layout to accommodate 4 cards (was 3)

### Updated Page: `/admin/submissions/page.tsx`
- Enhanced to fetch team data for submissions
- Fetches all team members for display
- Links submissions to teams with visual distinction

### Updated Component: `/admin/submissions/admin-submissions-table.tsx`
- Displays team name (highlighted in cyan) for team submissions
- Shows team member list below team name
- Displays individual student email for personal submissions
- Maintains original approval/rejection functionality

## Security & Permissions

### Row-Level Security (RLS) Policies

**Teams Table**:
- Anyone can read teams (public view)
- Only leader can update their team
- Users can only insert as team leader
- Service role can manage

**Team Members Table**:
- Anyone can read team members
- Service role can manage

**Submissions Table** (Updated):
- Users can read own submissions OR team submissions (if member)
- Users can update own submissions OR team submissions (if member)
- Users can insert own submissions OR team submissions (if member)

### Permissions Logic

- **Create Team**: Any authenticated user (once per person)
- **Add Members**: Team leader only
- **View Team**: All team members + admins
- **Modify Submission**: Team members or individual owner
- **Submit Project**: Team (any member) or individual

## Data Flow

### Team Creation Flow
1. Student navigates to `/student/team`
2. Fills in team name and submits
3. API creates team with student as leader
4. API adds student as team member
5. Team is displayed with member list

### Adding Team Member Flow
1. Leader goes to team page
2. Enters member email and submits
3. API verifies:
   - User is team leader
   - Email exists in users table
   - User not already in another team
4. Member added to team_members
5. Team page refreshes to show new member

### Submission Flow (Team)
1. Team member navigates to `/student/submit`
2. Fills in project details
3. API detects user is in team
4. Creates submission with team_id = team.id, user_id = null
5. Only team members can view/edit this submission
6. Team shows on judge dashboard with member list

### Submission Flow (Individual)
1. Student not in team submits project
2. Creates submission with user_id = auth.user.id, team_id = null
3. Standard individual submission flow

## Database Constraints

1. **Unique Team-User**: Each user in at most one team via unique constraint on team_members
2. **Check Constraint**: Submissions.user_id XOR Submissions.team_id (one must be set, not both)
3. **Cascading Deletes**: Teams and submissions cascade delete when user is removed
4. **Foreign Key Integrity**: All team_id references validate against teams.id

## API Response Examples

### Create Team Response
```json
{
  "id": "uuid",
  "team_name": "Team Alpha",
  "leader_id": "leader-uuid",
  "created_at": "2026-02-21T...",
  "members": [
    { "id": "uuid", "name": "John", "email": "john@example.com" }
  ],
  "isLeader": true
}
```

### Get Team Response
```json
{
  "id": "uuid",
  "team_name": "Team Alpha",
  "leader_id": "leader-uuid",
  "created_at": "2026-02-21T...",
  "members": [
    { "id": "uuid", "name": "John", "email": "john@example.com" },
    { "id": "uuid", "name": "Jane", "email": "jane@example.com" }
  ],
  "isLeader": true
}
```

### Submission with Team
```json
{
  "id": "uuid",
  "team_id": "team-uuid",
  "user_id": null,
  "title": "Project Name",
  "github_url": "https://github.com/owner/repo",
  "status": "submitted",
  "github_stars": 42,
  "last_commit": "2026-02-21T...",
  ...
}
```

## Files Created/Modified

### Created
- `supabase/migrations/009_teams.sql`
- `app/api/teams/route.ts`
- `app/api/teams/add-member/route.ts`
- `app/student/team/page.tsx`
- `app/admin/teams/page.tsx`

### Modified
- `app/api/submission/route.ts` - Team submission support
- `app/api/submissions/route.ts` - Team submission support
- `app/judge/evaluate/page.tsx` - Team data fetching
- `app/judge/evaluate/judge-evaluate-list.tsx` - Team display
- `app/admin/submissions/page.tsx` - Team data fetching
- `app/admin/submissions/admin-submissions-table.tsx` - Team display
- `app/admin/page.tsx` - Teams stats and navigation
- `app/student/layout.tsx` - Team navigation link

## Testing Checklist

- [x] No TypeScript compilation errors
- [x] SQL schema migrations properly structured
- [x] RLS policies in place for security
- [x] API endpoints follow existing patterns
- [x] Frontend components use existing UI library
- [x] Team creation prevents duplicates
- [x] Member addition validates email and permissions
- [x] Submissions work for both teams and individuals
- [x] Judge dashboard displays team info correctly
- [x] Admin dashboard shows all teams
- [x] Navigation links added to layouts
- [x] Leaderboard includes teams

## Notes

- No existing auth logic was modified
- No existing SQL structures were recreated or modified (only extended)
- Used existing Supabase client libraries
- Followed existing code patterns and styling conventions
- All RLS policies maintain security while enabling team collaboration
- Individual submissions remain fully functional alongside team submissions
