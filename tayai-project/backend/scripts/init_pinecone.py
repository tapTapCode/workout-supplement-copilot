#!/usr/bin/env python3
"""
Pinecone Index Initialization Script

This script initializes and manages the Pinecone vector database index
for the TayAI knowledge base.

Usage:
    python scripts/init_pinecone.py --create     # Create new index
    python scripts/init_pinecone.py --status     # Check index status
    python scripts/init_pinecone.py --delete     # Delete index (caution!)
    python scripts/init_pinecone.py --reset      # Delete and recreate index
"""
import argparse
import sys
import os
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings


# Index configuration
INDEX_CONFIG = {
    "name": settings.PINECONE_INDEX_NAME,
    "dimension": 1536,  # text-embedding-3-small dimension
    "metric": "cosine",
    "spec": ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
}


def get_pinecone_client() -> Pinecone:
    """Initialize and return Pinecone client."""
    if not settings.PINECONE_API_KEY:
        print("❌ Error: PINECONE_API_KEY not set in environment")
        sys.exit(1)
    
    return Pinecone(api_key=settings.PINECONE_API_KEY)


def create_index(pc: Pinecone) -> bool:
    """
    Create the Pinecone index if it doesn't exist.
    
    Returns:
        True if index was created, False if it already exists
    """
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    
    if INDEX_CONFIG["name"] in existing_indexes:
        print(f"ℹ️  Index '{INDEX_CONFIG['name']}' already exists")
        return False
    
    print(f"🔨 Creating index '{INDEX_CONFIG['name']}'...")
    print(f"   Dimension: {INDEX_CONFIG['dimension']}")
    print(f"   Metric: {INDEX_CONFIG['metric']}")
    
    pc.create_index(
        name=INDEX_CONFIG["name"],
        dimension=INDEX_CONFIG["dimension"],
        metric=INDEX_CONFIG["metric"],
        spec=INDEX_CONFIG["spec"]
    )
    
    # Wait for index to be ready
    print("⏳ Waiting for index to be ready...")
    while not pc.describe_index(INDEX_CONFIG["name"]).status.ready:
        time.sleep(1)
        print(".", end="", flush=True)
    
    print("\n✅ Index created successfully!")
    return True


def delete_index(pc: Pinecone) -> bool:
    """
    Delete the Pinecone index.
    
    Returns:
        True if index was deleted, False if it didn't exist
    """
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    
    if INDEX_CONFIG["name"] not in existing_indexes:
        print(f"ℹ️  Index '{INDEX_CONFIG['name']}' doesn't exist")
        return False
    
    print(f"🗑️  Deleting index '{INDEX_CONFIG['name']}'...")
    pc.delete_index(INDEX_CONFIG["name"])
    print("✅ Index deleted successfully!")
    return True


def get_index_status(pc: Pinecone) -> dict:
    """
    Get the status of the Pinecone index.
    
    Returns:
        Dictionary with index status information
    """
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    
    if INDEX_CONFIG["name"] not in existing_indexes:
        return {"exists": False, "name": INDEX_CONFIG["name"]}
    
    # Get index details
    index_info = pc.describe_index(INDEX_CONFIG["name"])
    index = pc.Index(INDEX_CONFIG["name"])
    stats = index.describe_index_stats()
    
    return {
        "exists": True,
        "name": INDEX_CONFIG["name"],
        "dimension": index_info.dimension,
        "metric": index_info.metric,
        "ready": index_info.status.ready,
        "host": index_info.host,
        "total_vectors": stats.total_vector_count,
        "namespaces": dict(stats.namespaces) if stats.namespaces else {}
    }


def print_status(status: dict):
    """Print formatted index status."""
    print("\n📊 Pinecone Index Status")
    print("=" * 40)
    
    if not status["exists"]:
        print(f"❌ Index '{status['name']}' does not exist")
        return
    
    print(f"✅ Index: {status['name']}")
    print(f"   Dimension: {status['dimension']}")
    print(f"   Metric: {status['metric']}")
    print(f"   Ready: {'Yes' if status['ready'] else 'No'}")
    print(f"   Host: {status['host']}")
    print(f"   Total Vectors: {status['total_vectors']}")
    
    if status["namespaces"]:
        print("\n   Namespaces:")
        for ns, info in status["namespaces"].items():
            print(f"   - {ns or '(default)'}: {info.vector_count} vectors")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Manage Pinecone index for TayAI"
    )
    
    parser.add_argument(
        "--create",
        action="store_true",
        help="Create the Pinecone index"
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Delete the Pinecone index"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete and recreate the index"
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Show index status"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip confirmation prompts"
    )
    
    args = parser.parse_args()
    
    # Default to status if no action specified
    if not any([args.create, args.delete, args.reset, args.status]):
        args.status = True
    
    # Initialize client
    pc = get_pinecone_client()
    
    # Execute requested action
    if args.status:
        status = get_index_status(pc)
        print_status(status)
    
    elif args.create:
        create_index(pc)
    
    elif args.delete:
        if not args.force:
            confirm = input(
                f"⚠️  Are you sure you want to delete index '{INDEX_CONFIG['name']}'? "
                "This will delete all data! (y/N): "
            )
            if confirm.lower() != 'y':
                print("Cancelled.")
                return
        delete_index(pc)
    
    elif args.reset:
        if not args.force:
            confirm = input(
                f"⚠️  Are you sure you want to reset index '{INDEX_CONFIG['name']}'? "
                "This will delete all data! (y/N): "
            )
            if confirm.lower() != 'y':
                print("Cancelled.")
                return
        
        print("🔄 Resetting index...")
        delete_index(pc)
        time.sleep(2)  # Brief pause
        create_index(pc)


if __name__ == "__main__":
    main()
