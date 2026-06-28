import json

log_file = "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/01041cff-3813-4809-be25-0a9288cf7799/.system_generated/logs/transcript.jsonl"

with open(log_file, 'r') as f:
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
                                repl = chunk.get("ReplacementContent", "")
                                if "handleAddDetailedProperty" in repl or "handleAddBoleto" in repl or "handleAddVoucher" in repl:
                                    print("--- FOUND CHUNK ---")
                                    print(repl)
        except:
            pass
