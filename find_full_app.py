import os
import json

brain_dir = "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/"

for root, dirs, files in os.walk(brain_dir):
    if "transcript_full.jsonl" in files:
        log_file = os.path.join(root, "transcript_full.jsonl")
        print(f"Checking {log_file}...")
        try:
            with open(log_file, "r") as f:
                for line in f:
                    if "export default function App" in line:
                        try:
                            entry = json.loads(line)
                            
                            def check_content(content):
                                if "import React" in content and "export default function App" in content:
                                    lines = content.split('\n')
                                    if len(lines) > 1000:
                                        print(f"FOUND FULL APP! Lines: {len(lines)}")
                                        with open("FOUND_APP.txt", "w") as out:
                                            out.write(content)
                                        return True
                                return False
                            
                            if "content" in entry and isinstance(entry["content"], str):
                                if check_content(entry["content"]):
                                    exit(0)
                            
                            if entry.get("type") == "TOOL_RESPONSE" and "output" in entry.get("content", ""):
                                if check_content(entry["content"]):
                                    exit(0)
                        except Exception as e:
                            pass
        except Exception as e:
            pass
print("Done")
