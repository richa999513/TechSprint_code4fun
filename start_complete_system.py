"""
Complete System Startup Script
Starts the enhanced agentic AI system with frontend and backend
"""
import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        "fastapi", "uvicorn", "python-dotenv", 
        "google-generativeai", "chromadb"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print(f"\n💡 Install with: pip install {' '.join(missing_packages)}")
        return False
    else:
        print("✅ All required packages found")
        return True

def start_system():
    """Start the complete agentic AI system"""
    print("🎯 Agentic AI Study Planner - Complete System Startup")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Cannot start system due to missing dependencies")
        input("Press Enter to exit...")
        sys.exit(1)
    
    # Change to backend directory
    backend_dir = Path("study_planner_agent/backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        input("Press Enter to exit...")
        sys.exit(1)
    
    os.chdir(backend_dir)
    
    print("\n🚀 Starting Enhanced Agentic AI System...")
    print("🧠 Autonomous agents will be active and monitoring!")
    print("🎨 Modern web interface with authentication")
    print("🔗 Full frontend-backend integration")
    
    # Start the server
    try:
        print("\n📡 Starting server on http://localhost:8000")
        print("🌐 Web app will be available at: http://localhost:8000/static/index.html")
        print("\n⏳ Please wait while the system initializes...")
        
        # Give user time to read
        time.sleep(3)
        
        # Open browser automatically
        webbrowser.open("http://localhost:8000/static/index.html")
        
        # Start the FastAPI server
        subprocess.run([
            sys.executable, "main_dev.py"
        ])
        
    except KeyboardInterrupt:
        print("\n\n👋 System shutdown requested")
        print("Thank you for using Agentic AI Study Planner!")
    except Exception as e:
        print(f"\n❌ Error starting system: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    start_system()