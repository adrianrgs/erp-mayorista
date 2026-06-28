import json

log_file = "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/01041cff-3813-4809-be25-0a9288cf7799/.system_generated/logs/transcript_full.jsonl"
app_file = "src/App.tsx"

# We first reset App.tsx to origin/main just in case
import subprocess
subprocess.run(["git", "checkout", "origin/main", "--", "src/App.tsx"])

with open(app_file, "r") as f:
    content = f.read()

def apply_chunk(content, target, replacement):
    if target in content:
        return content.replace(target, replacement, 1)
    else:
        print("Warning: Target not found:\n" + target[:100])
        return content

with open(log_file, "r") as f:
    for line in f:
        try:
            entry = json.loads(line)
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    name = call.get("name")
                    args = call.get("args", {})
                    if "App.tsx" in args.get("TargetFile", ""):
                        if name == "multi_replace_file_content":
                            chunks = args.get("ReplacementChunks", [])
                            for chunk in chunks:
                                target = chunk.get("TargetContent", "")
                                repl = chunk.get("ReplacementContent", "")
                                content = apply_chunk(content, target, repl)
                        elif name == "replace_file_content":
                            target = args.get("TargetContent", "")
                            repl = args.get("ReplacementContent", "")
                            content = apply_chunk(content, target, repl)
                        elif name == "write_to_file":
                            content = args.get("CodeContent", "")
                            print("Applied write_to_file")
        except:
            pass

with open(app_file, "w") as f:
    f.write(content)

print("Finished replaying edits to App.tsx")
