#!/usr/bin/env python3
"""
Command-line script to run the WikiFix preprocessing pipeline.
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path so we can import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from preprocessing.pipeline import run_preprocessing_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="WikiFix Preprocessing Pipeline - Pre-process ANLI JSON with Wikipedia highlighting"
    )
    
    parser.add_argument(
        "anli_json_path",
        help="Path to the ANLI JSON file"
    )
    
    parser.add_argument(
        "--no-recreate",
        action="store_true",
        help="Don't recreate the tasks table (append to existing)"
    )
    
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit the number of items to process (useful for testing)"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be processed without actually creating tasks"
    )
    
    args = parser.parse_args()
    
    # Validate input file
    anli_path = Path(args.anli_json_path)
    if not anli_path.exists():
        print(f"❌ Error: ANLI JSON file not found: {anli_path}")
        sys.exit(1)
    
    print(f"🚀 WikiFix Preprocessing Pipeline")
    print(f"📂 Input file: {anli_path}")
    print(f"🔄 Recreate table: {not args.no_recreate}")
    if args.limit:
        print(f"🎯 Limit: {args.limit} items")
    if args.dry_run:
        print(f"🧪 Dry run mode: No changes will be made")
    print(f"{'='*60}")
    
    if args.dry_run:
        print("🧪 DRY RUN MODE - This would process the ANLI file but no changes will be made")
        # TODO: Add dry run functionality
        print("📊 Dry run analysis complete")
        return
    
    try:
        # Run the preprocessing pipeline
        results = asyncio.run(run_preprocessing_pipeline(
            anli_json_path=str(anli_path),
            recreate_table=not args.no_recreate,
            limit=args.limit
        ))
        
        print(f"\n🎉 Pipeline completed successfully!")
        print(f"📊 Final Results:")
        print(f"   ✅ Processed: {results['processed']}")
        print(f"   ❌ Failed: {results['failed']}")
        print(f"   ⏭️  Skipped: {results['skipped']}")
        print(f"   📈 Success rate: {results['processed']/(results['total'])*100:.1f}%")
        
    except KeyboardInterrupt:
        print("\n⚠️  Pipeline interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Pipeline failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 