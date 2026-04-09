import { PrismaClient } from '@/app/generated/prisma/client';
import { hash } from 'bcryptjs';

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';
  const isSqlite = url.startsWith('file:') || url.endsWith('.db') || !url;

  if (!isSqlite) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const adapter = new PrismaBetterSqlite3({ url: url || 'file:./dev.db' });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

async function main() {
  // 1. Clear existing data (FK-safe order)
  await prisma.star.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create demo users
  const passwordHash = await hash('password123', 12);

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Chen',
      email: 'alice@demo.com',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Rivera',
      email: 'bob@demo.com',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // 3. Create tags
  const tagNames = [
    'chatgpt',
    'coding',
    'writing',
    'productivity',
    'creative',
    'data-analysis',
  ] as const;

  const tags: Record<string, { id: string; name: string }> = {};
  for (const name of tagNames) {
    tags[name] = await prisma.tag.create({ data: { name } });
  }

  // 4. Create prompts with realistic markdown bodies
  const promptsData = [
    {
      title: 'Code Review Assistant',
      body: `# Code Review Assistant

You are an expert code reviewer. Analyze the provided code and give feedback on:

## Review Criteria

- **Correctness** — Does the code do what it's supposed to?
- **Performance** — Are there any obvious bottlenecks?
- **Security** — Any vulnerabilities (injection, XSS, etc.)?
- **Readability** — Is the code clean and well-structured?

## Output Format

For each issue found, provide:

1. **Severity**: Critical / Warning / Suggestion
2. **Location**: File and line reference
3. **Description**: What's wrong
4. **Fix**: Suggested improvement with code example

\`\`\`
Example:
[Warning] line 42 — Unhandled promise rejection
→ Add try/catch or .catch() handler
\`\`\`

Be constructive, not critical. Praise good patterns too.`,
      authorId: alice.id,
      tagNames: ['coding', 'productivity'],
    },
    {
      title: 'Creative Story Generator',
      body: `# Creative Story Generator

Write a short story based on the following parameters:

## Input Parameters

- **Genre**: {{genre}}
- **Setting**: {{setting}}
- **Main character**: {{character}}
- **Tone**: {{tone}}

## Guidelines

- Open with a hook that grabs attention in the first sentence
- Use vivid sensory details — show, don't tell
- Include at least one plot twist
- Keep it under 1000 words
- End with a satisfying but unexpected conclusion

## Style Notes

> Write in third-person limited perspective. Use present tense
> for immediacy. Vary sentence length to control pacing —
> short sentences for tension, longer ones for reflection.

Feel free to incorporate dialogue to reveal character.`,
      authorId: bob.id,
      tagNames: ['creative', 'writing', 'chatgpt'],
    },
    {
      title: 'SQL Query Optimizer',
      body: `# SQL Query Optimizer

Analyze the following SQL query and suggest optimizations.

## Analysis Steps

1. **Identify bottlenecks** — full table scans, missing indexes, N+1 patterns
2. **Check join efficiency** — are joins on indexed columns?
3. **Evaluate subqueries** — can they be rewritten as JOINs or CTEs?
4. **Review WHERE clauses** — sargability, function calls on indexed columns

## Input

\`\`\`sql
-- Paste your SQL query here
{{query}}
\`\`\`

## Expected Output

Provide:

- The optimized query with comments explaining each change
- Suggested indexes: \`CREATE INDEX idx_name ON table(columns)\`
- Estimated performance impact (qualitative)
- Any trade-offs introduced by the optimization`,
      authorId: alice.id,
      tagNames: ['coding', 'data-analysis'],
    },
    {
      title: 'Email Draft Helper',
      body: `# Professional Email Draft Helper

Compose a professional email based on these inputs:

## Parameters

- **Recipient**: {{recipient}} (name + role)
- **Purpose**: {{purpose}}
- **Tone**: {{tone}} (formal / friendly-professional / casual)
- **Key points**: {{points}}

## Structure

1. **Subject line** — concise, action-oriented, under 60 characters
2. **Greeting** — appropriate to relationship
3. **Opening** — context or reference to prior conversation
4. **Body** — key points, clearly organized
5. **Call to action** — specific next step with timeline
6. **Closing** — professional sign-off

## Rules

- Keep under 200 words
- No jargon unless the recipient would expect it
- One idea per paragraph
- Bold or bullet key takeaways if more than 3 points`,
      authorId: bob.id,
      tagNames: ['writing', 'productivity'],
    },
    {
      title: 'Data Analysis Report Builder',
      body: `# Data Analysis Report Builder

Generate a structured analysis report from the provided dataset.

## Input

\`\`\`
Dataset: {{dataset_description}}
Goal: {{analysis_goal}}
Audience: {{audience}}
\`\`\`

## Report Sections

### 1. Executive Summary
- Key findings in 3-5 bullet points
- Bottom-line recommendation

### 2. Methodology
- Data cleaning steps performed
- Statistical methods used
- Assumptions and limitations

### 3. Findings
- Present each finding with:
  - Supporting data/metrics
  - Visualization suggestion (chart type + axes)
  - Confidence level

### 4. Recommendations
- Actionable next steps ranked by impact
- Resource requirements for each

> Always distinguish between correlation and causation.
> Flag any data quality issues discovered during analysis.`,
      authorId: alice.id,
      tagNames: ['data-analysis', 'productivity'],
    },
    {
      title: 'ChatGPT System Prompt Template',
      body: `# ChatGPT System Prompt Template

Use this template to craft effective system prompts for ChatGPT.

## Template

\`\`\`
You are {{role}}, an expert in {{domain}}.

Your task is to {{primary_task}}.

## Constraints
- {{constraint_1}}
- {{constraint_2}}
- {{constraint_3}}

## Output Format
{{format_description}}

## Examples
Input: {{example_input}}
Output: {{example_output}}
\`\`\`

## Best Practices

1. **Be specific** about the role and expertise level
2. **Set boundaries** — what the AI should and shouldn't do
3. **Provide examples** — one-shot or few-shot improves quality dramatically
4. **Define format** — JSON, markdown, bullet points, etc.
5. **Include edge cases** — how to handle ambiguous or invalid input

## Common Pitfalls to Avoid

- Don't say "you are the best" — be specific about *what* makes it good
- Don't leave output format ambiguous
- Don't forget to handle error/edge cases`,
      authorId: bob.id,
      tagNames: ['chatgpt', 'productivity'],
    },
    {
      title: 'Regex Pattern Generator',
      body: `# Regex Pattern Generator

Generate a regular expression that matches the described pattern.

## Input

- **Description**: {{what_to_match}}
- **Language/flavor**: {{regex_flavor}} (JS, Python, PCRE, etc.)
- **Examples of matches**: {{match_examples}}
- **Examples of non-matches**: {{non_match_examples}}

## Output Format

1. **Pattern**: \`/regex_here/flags\`
2. **Explanation**: Break down each part of the regex
3. **Test cases**: Verify against provided examples

\`\`\`javascript
// Example output
const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

// Breakdown:
// ^                 — start of string
// [a-zA-Z0-9._%+-]+ — local part (letters, digits, special chars)
// @                 — literal @ symbol
// [a-zA-Z0-9.-]+   — domain name
// \\.               — literal dot
// [a-zA-Z]{2,}     — TLD (2+ letters)
// $                 — end of string
\`\`\`

Always provide the **simplest pattern** that satisfies all requirements.`,
      authorId: alice.id,
      tagNames: ['coding', 'chatgpt'],
    },
    {
      title: 'Meeting Notes Summarizer',
      body: `# Meeting Notes Summarizer

Transform raw meeting notes or a transcript into a structured summary.

## Input

\`\`\`
Meeting: {{meeting_title}}
Date: {{date}}
Attendees: {{attendees}}

Transcript/Notes:
{{raw_notes}}
\`\`\`

## Output Structure

### Key Decisions
- Bullet list of decisions made, with who approved

### Action Items

| Owner | Task | Deadline |
|-------|------|----------|
| Name  | Description | Date |

### Discussion Highlights
- Major topics discussed (2-3 sentences each)
- Unresolved questions or parking lot items

### Next Steps
- When is the next meeting?
- What should be prepared?

## Rules

- Keep the summary under 500 words
- Attribute decisions and action items to specific people
- Flag any conflicting statements or unclear commitments
- Use the attendees' actual names, not "someone said"`,
      authorId: bob.id,
      tagNames: ['productivity', 'writing'],
    },
  ];

  const prompts = [];
  for (const { title, body, authorId, tagNames: promptTagNames } of promptsData) {
    const prompt = await prisma.prompt.create({
      data: {
        title,
        body,
        authorId,
        isPublic: true,
        tags: {
          connect: promptTagNames.map((name) => ({ id: tags[name].id })),
        },
      },
    });
    prompts.push(prompt);
  }

  // 5. Create stars and update denormalized counts
  // Alice stars Bob's "Creative Story Generator" (index 1) and "Email Draft Helper" (index 3)
  // Bob stars Alice's "Code Review Assistant" (index 0)
  const starData = [
    { userId: alice.id, promptId: prompts[1].id },
    { userId: alice.id, promptId: prompts[3].id },
    { userId: bob.id, promptId: prompts[0].id },
  ];

  for (const star of starData) {
    await prisma.$transaction([
      prisma.star.create({ data: star }),
      prisma.prompt.update({
        where: { id: star.promptId },
        data: { starCount: { increment: 1 } },
      }),
    ]);
  }

  // 6. Log summary
  const userCount = await prisma.user.count();
  const promptCount = await prisma.prompt.count();
  const tagCount = await prisma.tag.count();
  const starCount = await prisma.star.count();

  console.log(
    `Seeded: ${userCount} users, ${promptCount} prompts, ${tagCount} tags, ${starCount} stars`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
