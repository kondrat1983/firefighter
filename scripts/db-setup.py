#!/usr/bin/env python3
"""
Database setup and seeding script for Firefighter development.
"""

import asyncio
import asyncpg
import os
from datetime import datetime, timezone
from typing import List, Dict, Any

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'firefighter',
    'password': 'password',
    'database': 'firefighter'
}

async def create_sample_data():
    """Create sample data for development and testing."""
    
    # Connect to database
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        print("🔥 Setting up sample data for Firefighter...")
        
        # Sample games
        games_data = [
            {
                'name': 'Disney Dreamlight Valley',
                'aliases': ['DDV', 'Dreamlight Valley'],
                'current_patch_release': datetime.now(timezone.utc),
                'monitoring_active': True
            },
            {
                'name': 'Fortnite',
                'aliases': ['Fort', 'FN'],
                'current_patch_release': None,
                'monitoring_active': True
            },
            {
                'name': 'Among Us',
                'aliases': ['AmongUs'],
                'current_patch_release': None,
                'monitoring_active': False
            }
        ]
        
        # Insert sample games
        print("  • Adding sample games...")
        for game_data in games_data:
            await conn.execute('''
                INSERT INTO games (name, aliases, current_patch_release, monitoring_active)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
            ''', game_data['name'], game_data['aliases'], 
                 game_data['current_patch_release'], game_data['monitoring_active'])
        
        # Sample raw signals
        print("  • Adding sample signals...")
        signals_data = [
            {
                'game_id': 1,  # Disney Dreamlight Valley
                'source_type': 'reddit',
                'source_id': 'sample_reddit_1',
                'content': "Can't pick up the saucery extract in jailbreak quest, anyone else having this issue?",
                'author': 'player123',
                'timestamp': datetime.now(timezone.utc),
                'metadata': {'subreddit': 'DreamlightValley', 'upvotes': 15}
            },
            {
                'game_id': 1,
                'source_type': 'steam',
                'source_id': 'sample_steam_1',
                'content': "Game keeps crashing when I try to enter the castle. Happened 3 times now.",
                'author': 'steamuser456',
                'timestamp': datetime.now(timezone.utc),
                'metadata': {'helpful_votes': 8, 'recommended': False}
            },
            {
                'game_id': 2,  # Fortnite
                'source_type': 'twitter',
                'source_id': 'sample_twitter_1',
                'content': "Fortnite servers down again? Can't get into any matches #FortniteDown",
                'author': 'twitteruser789',
                'timestamp': datetime.now(timezone.utc),
                'metadata': {'retweets': 25, 'likes': 67}
            }
        ]
        
        for signal_data in signals_data:
            await conn.execute('''
                INSERT INTO raw_signals (game_id, source_type, source_id, content, author, timestamp, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            ''', signal_data['game_id'], signal_data['source_type'], signal_data['source_id'],
                 signal_data['content'], signal_data['author'], signal_data['timestamp'],
                 signal_data['metadata'])
        
        # Sample clusters
        print("  • Adding sample clusters...")
        await conn.execute('''
            INSERT INTO clusters (game_id, cluster_label, issue_type, confidence, signal_count, representative_phrases)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING
        ''', 1, 'Progression Blocker', 'progression', 0.84, 5, 
             ['cannot pick up item', 'quest stuck', 'jailbreak quest bug'])
        
        # Sample alerts
        print("  • Adding sample alerts...")
        await conn.execute('''
            INSERT INTO alerts (game_id, cluster_id, alert_type, confidence, mention_count, source_count, 
                              ai_summary, suggested_title, suggested_investigations)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING
        ''', 1, 1, 'progression', 0.84, 15, 3,
             'Players are reporting they cannot pick up the Saucery Extract item during the Jailbreak quest, blocking progression.',
             'Progression Blocker: Saucery Extract cannot be picked up during Jailbreak quest',
             ['Verify interaction trigger for Saucery Extract', 'Check quest progression state requirements', 'Verify item spawn conditions'])
        
        # Sample game health snapshot
        print("  • Adding sample health data...")
        await conn.execute('''
            INSERT INTO game_health_snapshots (game_id, crash_risk, progression_risk, exploit_risk, 
                                             connectivity_risk, sentiment_score, overall_health, patch_risk_index)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT DO NOTHING
        ''', 1, 12.0, 8.0, 3.0, 15.0, 72.0, 85.0, 35.0)
        
        print("✓ Sample data created successfully!")
        
        # Show summary
        game_count = await conn.fetchval('SELECT COUNT(*) FROM games')
        signal_count = await conn.fetchval('SELECT COUNT(*) FROM raw_signals')
        alert_count = await conn.fetchval('SELECT COUNT(*) FROM alerts')
        
        print(f"\n📊 Database summary:")
        print(f"  • Games: {game_count}")
        print(f"  • Signals: {signal_count}")
        print(f"  • Alerts: {alert_count}")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        raise
    finally:
        await conn.close()

async def reset_database():
    """Reset database by dropping and recreating all tables."""
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        print("🗑️  Resetting database...")
        
        # Drop all tables in correct order (respecting foreign keys)
        tables = [
            'feedback', 'game_health_snapshots', 'alerts', 'cluster_signals', 
            'clusters', 'signal_embeddings', 'raw_signals', 'games'
        ]
        
        for table in tables:
            await conn.execute(f'DROP TABLE IF EXISTS {table} CASCADE')
            print(f"  • Dropped table: {table}")
        
        print("✓ Database reset complete!")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        raise
    finally:
        await conn.close()

async def check_connection():
    """Check database connection and show status."""
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        version = await conn.fetchval('SELECT version()')
        await conn.close()
        
        print("✅ Database connection successful!")
        print(f"   PostgreSQL version: {version.split(',')[0]}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python db-setup.py [check|seed|reset]")
        print("  check  - Check database connection")
        print("  seed   - Add sample data for development")
        print("  reset  - Drop all tables (destructive!)")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "check":
        asyncio.run(check_connection())
    elif command == "seed":
        asyncio.run(create_sample_data())
    elif command == "reset":
        if input("⚠️  This will DELETE ALL DATA. Type 'yes' to confirm: ") == 'yes':
            asyncio.run(reset_database())
        else:
            print("Reset cancelled.")
    else:
        print(f"Unknown command: {command}")