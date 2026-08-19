# database.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Explicitly load keys from your local .env file into the runtime system
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Safety Check: Prevent the backend from crashing silently if variables are missing
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing configuration strings. Please double-check your .env file.")

# Single reusable client instance used for both Storage and Tables
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
