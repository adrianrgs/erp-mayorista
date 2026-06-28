import json

log_file = "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/01041cff-3813-4809-be25-0a9288cf7799/.system_generated/logs/transcript_full.jsonl"

last_full_content = None

with open(log_file, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            # Check for cat output
            if entry.get("type") == "TOOL_RESPONSE" and "output" in entry.get("content", ""):
                out = entry["content"]
                if "import React" in out and "export default function App" in out and "The following code has been modified" not in out:
                    # check if it's over 1000 lines
                    if len(out.split("\n")) > 1000:
                        last_full_content = out
        except:
            pass

if last_full_content:
    # clean up the "Created At: ... Completed At: ... Output:" wrapper
    import re
    match = re.search(r'Output:\n(.*?)$', last_full_content, re.DOTALL)
    if match:
        content = match.group(1)
    else:
        content = last_full_content
    with open("recovered_app.tsx", "w") as f:
        f.write(content)
    print("Recovered full content to recovered_app.tsx")
else:
    print("Could not find full cat of App.tsx")
