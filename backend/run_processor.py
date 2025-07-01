#!/usr/bin/env python3
"""
Simple script to run the Wikipedia processor and fill up the tasks DB.
Usage: python run_processor.py [json_file_path] [--limit N] [--recreate-db]
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from wikipedia_processor import WikipediaProcessor
from db.db import init_models, drop_all_tables


async def main():
    parser = argparse.ArgumentParser(description="Process ANLI JSON and populate WikiFix tasks DB")
    
    parser.add_argument(
        "json_file", 
        nargs="?",
        default="/data1/akhatua/wiki_llm/anli_results_v1.json",
        help="Path to ANLI JSON file (default: /data1/akhatua/wiki_llm/anli_results_v1.json)"
    )
    
    parser.add_argument(
        "--limit", 
        type=int,
        help="Limit number of items to process (useful for testing)"
    )
    
    parser.add_argument(
        "--recreate-db",
        action="store_true", 
        help="Drop and recreate the tasks table before processing"
    )
    
    args = parser.parse_args()
    
    # Validate JSON file exists
    json_path = Path(args.json_file)
    if not json_path.exists():
        print(f"❌ JSON file not found: {json_path}")
        sys.exit(1)
    
    print(f"🚀 WikiFix Ultra-Simple Processor")
    print(f"📂 Input: {json_path}")
    if args.limit:
        print(f"🎯 Limit: {args.limit} items")
    if args.recreate_db:
        print(f"🔄 Will recreate database tables")
    print("="*60)
    
    # Initialize database
    if args.recreate_db:
        print("🗑️  Dropping existing tables...")
        await drop_all_tables()
    
    print("🏗️  Initializing database...")
    await init_models()
    
    # Process the ANLI file
    processor = WikipediaProcessor()
    results = await processor.process_anli_file(str(json_path), args.limit)
    
    # Print final results
    print("\n" + "="*60)
    print("🎉 PROCESSING COMPLETE!")
    print(f"✅ Successful tasks: {results['successful']}")
    print(f"❌ Failed tasks: {results['failed']}")
    print(f"📊 Total processed: {results['total']}")
    
    if results['total'] > 0:
        success_rate = (results['successful'] / results['total']) * 100
        print(f"📈 Success rate: {success_rate:.1f}%")
    
    print("\n💡 Your WikiFix tasks database is now ready!")
    print("🔗 Start the API server to begin serving tasks.")


if __name__ == "__main__":
    asyncio.run(main()) 