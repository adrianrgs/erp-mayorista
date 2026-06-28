import json

log_file = "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/01041cff-3813-4809-be25-0a9288cf7799/.system_generated/logs/transcript_full.jsonl"

modifications = []

with open(log_file, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["name"] in ["replace_file_content", "multi_replace_file_content", "write_to_file"]:
                        args = call["args"]
                        if "TargetFile" in args and "App.tsx" in args["TargetFile"]:
                            modifications.append({
                                "step": entry.get("step_index"),
                                "tool": call["name"],
                                "args": args
                            })
        except:
            pass

print(f"Found {len(modifications)} modifications to App.tsx")
for m in modifications:
    print(f"Step {m['step']} - {m['tool']}")
