import json

log_files = [
    "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/8caff5a7-a994-476a-a8d3-d35b30a4dcee/.system_generated/logs/transcript_full.jsonl",
    "/Users/adriangonzalezsalazar/.gemini/antigravity-ide/brain/79d48a07-50ec-4586-8da1-4fb9ad913806/.system_generated/logs/transcript_full.jsonl"
]

for log_file in log_files:
    print(f"Checking {log_file}")
    try:
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
                                            print(repl[:500])
                except:
                    pass
    except Exception as e:
        print(f"Failed to open {log_file}: {e}")
