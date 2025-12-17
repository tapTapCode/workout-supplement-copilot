# TayAI Content Intake

This folder contains your custom content that makes TayAI sound like YOU.

## How It Works

1. Add your content to the template files
2. Run the import script
3. TayAI learns your voice and expertise

## Content Types

| File | What to Add |
|------|-------------|
| `courses/` | Transcripts from your top courses |
| `faqs.yaml` | Common questions and YOUR answers |
| `frameworks.yaml` | Your proprietary methods and frameworks |
| `quick_tips.yaml` | Short tips and advice snippets |

## Quick Start

```bash
# 1. Fill out the template files in this folder

# 2. Run the import script
cd ../backend
python scripts/import_content.py

# 3. Preview without importing
python scripts/import_content.py --dry-run
```

## Need Help?

See each template file for examples and instructions.
