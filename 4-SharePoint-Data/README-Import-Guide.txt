===========================================================
  SKILLALIGN - SHAREPOINT LIST IMPORT GUIDE
  Excel Data Files for SharePoint Lists
===========================================================

FILE: SkillAlign-SharePoint-Data.xlsx
SHEETS: 5 (one per SharePoint List)


===========================================================
  HOW TO CREATE SHAREPOINT LISTS FROM EXCEL
===========================================================

For EACH sheet in the workbook, repeat these steps:

Step 1: Open SharePoint Site
-----------------------------
- Go to your SharePoint site
- Click "Site Contents" (left sidebar)
- Click "+ New" > "List"

Step 2: Create List from Excel
-------------------------------
- Select "From Excel"
- Upload SkillAlign-SharePoint-Data.xlsx
- Select the sheet you want to import (e.g., SA_Users)
- SharePoint will auto-detect column types
- Review and adjust column types if needed (see below)
- Click "Create"

Step 3: Repeat for Each Sheet
------------------------------
Create 5 lists total:
  1. SA_Users
  2. SA_Topics
  3. SA_Questions
  4. SA_Assessments (empty template - just headers)
  5. SA_SME_Assignments


===========================================================
  RECOMMENDED COLUMN TYPES PER LIST
===========================================================

SA_Users List:
  Title        -> Single line of text (auto)
  Email        -> Single line of text
  Role         -> Choice (user, sme, admin)
  IsActive     -> Yes/No
  CreatedAt    -> Date

SA_Topics List:
  Title        -> Single line of text (auto)
  Icon         -> Single line of text
  Description  -> Multiple lines of text
  IsActive     -> Yes/No
  TotalQuestions -> Number

SA_Questions List:
  Title        -> Multiple lines of text (question text can be long)
  Topic        -> Choice (Manual Testing, Automation Testing,
                          Performance Testing, API Testing)
  Option1      -> Single line of text
  Option2      -> Single line of text
  Option3      -> Single line of text
  Option4      -> Single line of text
  CorrectAnswer -> Single line of text
  IsMultipleChoice -> Yes/No
  Difficulty   -> Choice (Easy, Medium, Hard)
  IsActive     -> Yes/No
  CreatedBy    -> Single line of text

SA_Assessments List (empty - populated at runtime):
  Title        -> Single line of text (stores user email)
  UserName     -> Single line of text
  Topic        -> Choice (Manual Testing, Automation Testing,
                          Performance Testing, API Testing)
  Score        -> Number
  CorrectAnswers -> Number
  TotalQuestions -> Number
  Passed       -> Yes/No
  TestDate     -> Date and Time
  TimeTaken    -> Number (seconds)

SA_SME_Assignments List:
  Title        -> Single line of text (SME email)
  SMEName      -> Single line of text
  AssignedTopics -> Multiple lines of text


===========================================================
  DATA SUMMARY
===========================================================

SA_Users:       3 records (1 Admin, 1 SME, 1 Test User)
SA_Topics:      4 records (Manual, Automation, Performance, API)
SA_Questions:   160 records (40 per topic)
SA_Assessments: 0 records (template only)
SA_SME_Assignments: 1 record

Total Questions Breakdown:
  Manual Testing:      40 questions (Easy/Medium/Hard mix)
  Automation Testing:  40 questions (Easy/Medium/Hard mix)
  Performance Testing: 40 questions (Easy/Medium/Hard mix)
  API Testing:         40 questions (Easy/Medium/Hard mix)


===========================================================
  IMPORTANT NOTES
===========================================================

1. AUTHENTICATION: No passwords are stored in the Excel file.
   When you move to SharePoint Lists (v0.2), authentication
   will be handled by Azure AD / Microsoft 365 SSO.

2. TITLE COLUMN: Each sheet uses "Title" as the first column
   because SharePoint Lists require a Title column.

3. ASSESSMENTS: The SA_Assessments list is empty by design.
   Assessment records are created when users take tests.

4. CORRECT ANSWER FORMAT:
   - Single choice: "1" (index of correct option, 0-based)
   - Multiple choice: "0,1" or "0,1,2" (comma-separated indices)

5. After importing, you can modify the list views in SharePoint
   to show/hide columns as needed.

===========================================================
