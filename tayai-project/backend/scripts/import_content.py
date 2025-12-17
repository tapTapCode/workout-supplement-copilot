#!/usr/bin/env python3
"""
Content Import Script

Imports custom TaysLuxe content from the /content folder into the knowledge base.
Processes courses, FAQs, frameworks, and tips.

Usage:
    python scripts/import_content.py           # Import all content
    python scripts/import_content.py --dry-run # Preview without importing
    python scripts/import_content.py --type faqs  # Import specific type
"""
import argparse
import asyncio
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

import yaml

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.services.knowledge_service import KnowledgeService
from app.schemas.knowledge import KnowledgeBaseCreate


# Content folder path
CONTENT_DIR = Path(__file__).parent.parent.parent / "content"


def load_yaml_file(filepath: Path) -> Dict[str, Any]:
    """Load and parse a YAML file."""
    if not filepath.exists():
        return {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {}


def load_markdown_file(filepath: Path) -> Dict[str, Any]:
    """Load a markdown file with YAML frontmatter."""
    if not filepath.exists():
        return {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse frontmatter
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            try:
                frontmatter = yaml.safe_load(parts[1])
                body = parts[2].strip()
                return {**frontmatter, 'content': body}
            except yaml.YAMLError:
                pass
    
    return {'content': content}


def process_courses() -> List[KnowledgeBaseCreate]:
    """Process course files from /content/courses/."""
    items = []
    courses_dir = CONTENT_DIR / "courses"
    
    if not courses_dir.exists():
        return items
    
    for filepath in courses_dir.glob("*.md"):
        # Skip example and readme files
        if filepath.name.startswith('_') or filepath.name.lower() == 'readme.md':
            continue
        
        data = load_markdown_file(filepath)
        if not data.get('content'):
            continue
        
        title = data.get('title', filepath.stem.replace('-', ' ').title())
        category = data.get('category', 'course_content')
        description = data.get('description', '')
        
        # Build full content
        full_content = f"# {title}\n\n"
        if description:
            full_content += f"{description}\n\n"
        full_content += data['content']
        
        items.append(KnowledgeBaseCreate(
            title=title,
            content=full_content,
            category=category,
            metadata=f'{{"source": "course", "file": "{filepath.name}"}}'
        ))
    
    return items


def process_faqs() -> List[KnowledgeBaseCreate]:
    """Process FAQs from /content/faqs.yaml."""
    items = []
    data = load_yaml_file(CONTENT_DIR / "faqs.yaml")
    
    faqs = data.get('faqs', [])
    for faq in faqs:
        question = faq.get('question', '')
        answer = faq.get('answer', '')
        category = faq.get('category', 'faq')
        
        if not question or not answer:
            continue
        
        # Format as Q&A content
        content = f"**Question:** {question}\n\n**Answer:**\n{answer}"
        
        items.append(KnowledgeBaseCreate(
            title=f"FAQ: {question[:100]}",
            content=content,
            category=category,
            metadata='{"source": "faq"}'
        ))
    
    return items


def process_frameworks() -> List[KnowledgeBaseCreate]:
    """Process frameworks from /content/frameworks.yaml."""
    items = []
    data = load_yaml_file(CONTENT_DIR / "frameworks.yaml")
    
    frameworks = data.get('frameworks', [])
    for fw in frameworks:
        name = fw.get('name', '')
        if not name:
            continue
        
        # Build comprehensive content
        content_parts = [f"# {name}"]
        
        if fw.get('description'):
            content_parts.append(f"\n{fw['description']}")
        
        if fw.get('when_to_use'):
            content_parts.append(f"\n## When to Use\n{fw['when_to_use']}")
        
        if fw.get('steps'):
            content_parts.append("\n## Steps")
            for i, step in enumerate(fw['steps'], 1):
                content_parts.append(f"{i}. {step}")
        
        if fw.get('key_points'):
            content_parts.append("\n## Key Points")
            for point in fw['key_points']:
                content_parts.append(f"- {point}")
        
        if fw.get('example'):
            content_parts.append(f"\n## Example\n{fw['example']}")
        
        items.append(KnowledgeBaseCreate(
            title=f"Framework: {name}",
            content='\n'.join(content_parts),
            category=fw.get('category', 'framework'),
            metadata='{"source": "framework"}'
        ))
    
    return items


def process_tips() -> List[KnowledgeBaseCreate]:
    """Process quick tips from /content/quick_tips.yaml."""
    items = []
    data = load_yaml_file(CONTENT_DIR / "quick_tips.yaml")
    
    tips = data.get('tips', [])
    
    # Group tips by category
    tips_by_category: Dict[str, List[str]] = {}
    for tip in tips:
        tip_text = tip.get('tip', '')
        category = tip.get('category', 'tips')
        
        if not tip_text:
            continue
        
        if category not in tips_by_category:
            tips_by_category[category] = []
        tips_by_category[category].append(tip_text)
    
    # Create one knowledge item per category with all tips
    for category, tip_list in tips_by_category.items():
        category_title = category.replace('_', ' ').title()
        
        content = f"# {category_title} Quick Tips\n\n"
        content += "Key insights and reminders:\n\n"
        for tip in tip_list:
            content += f"- {tip}\n"
        
        items.append(KnowledgeBaseCreate(
            title=f"Quick Tips: {category_title}",
            content=content,
            category=category,
            metadata='{"source": "tips"}'
        ))
    
    return items


async def import_content(
    dry_run: bool = False,
    content_type: str = None
):
    """Import all content into the knowledge base."""
    
    print("\n📥 TaysLuxe Content Import")
    print("=" * 50)
    
    # Collect all content
    all_items = []
    
    processors = {
        'courses': ('📚 Courses', process_courses),
        'faqs': ('❓ FAQs', process_faqs),
        'frameworks': ('🔧 Frameworks', process_frameworks),
        'tips': ('💡 Quick Tips', process_tips),
    }
    
    for key, (label, processor) in processors.items():
        if content_type and content_type != key:
            continue
        
        print(f"\n{label}...")
        items = processor()
        print(f"   Found {len(items)} items")
        all_items.extend(items)
    
    print(f"\n{'=' * 50}")
    print(f"Total items to import: {len(all_items)}")
    
    if not all_items:
        print("\n⚠️  No content found. Add your content to the /content folder.")
        return
    
    if dry_run:
        print("\n🔍 DRY RUN - Preview of content:\n")
        for item in all_items:
            print(f"  📄 {item.title}")
            print(f"     Category: {item.category}")
            print(f"     Content: {len(item.content)} chars")
            print()
        return
    
    # Import to database
    print("\n📤 Importing to knowledge base...")
    
    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        service = KnowledgeService(session)
        
        success = 0
        errors = 0
        
        for item in all_items:
            try:
                print(f"  📄 {item.title[:50]}...", end=" ")
                await service.create_knowledge_item(item)
                print("✅")
                success += 1
            except Exception as e:
                print(f"❌ {e}")
                errors += 1
        
        print(f"\n{'=' * 50}")
        print(f"✅ Imported: {success}")
        print(f"❌ Errors: {errors}")
    
    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Import TaysLuxe content")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    parser.add_argument("--type", choices=['courses', 'faqs', 'frameworks', 'tips'],
                        help="Import specific content type")
    
    args = parser.parse_args()
    asyncio.run(import_content(dry_run=args.dry_run, content_type=args.type))


if __name__ == "__main__":
    main()
