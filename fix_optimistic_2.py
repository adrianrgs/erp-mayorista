import re

with open("src/App.tsx", "r") as f:
    content = f.read()

def optimize_update(match):
    prefix = match.group(1) # try {\n
    await_call = match.group(2) # await ... });\n
    set_call = match.group(3) # setX(...);
    
    # We put set_call before await_call
    return prefix + "      " + set_call.strip() + "\n      " + await_call.strip() + "\n"

# We match `try {\n` followed by any number of spaces, then `await ... });`, then spaces, then `setX(...);`
# It's better to just search for `await` and `set...` within the `try {` block.
# Let's match `try {` up to `} catch`
blocks = re.split(r'(try\s*\{)', content)

for i in range(len(blocks)):
    if blocks[i].strip() == "try {":
        # The next block is the body of try
        body = blocks[i+1]
        
        # If it contains both await and set...
        if "await " in body and re.search(r'set[A-Z]\w+\(', body):
            # Split the body by lines
            lines = body.split("\n")
            await_lines = []
            set_lines = []
            other_lines = []
            
            in_await = False
            await_block = ""
            for line in lines:
                if line.strip().startswith("await "):
                    in_await = True
                    await_block += line + "\n"
                    if line.strip().endswith(";"):
                        in_await = False
                        await_lines.append(await_block)
                        await_block = ""
                elif in_await:
                    await_block += line + "\n"
                    if line.strip().endswith(";"):
                        in_await = False
                        await_lines.append(await_block)
                        await_block = ""
                elif line.strip().startswith("set") and "prev =>" in line:
                    set_lines.append(line + "\n")
                elif "catch" in line:
                    other_lines.append(line) # Actually 'catch' is not in this block because we didn't split by catch
                else:
                    other_lines.append(line + "\n")
            
            # Reconstruct body: set_lines first, then await_lines
            if set_lines and await_lines:
                new_body = ""
                # Keep initial lines (like console.log or whatever, though usually it's just try { await... )
                for line in other_lines:
                    if line.strip() == "} catch (error) {" or line.strip() == "} catch(e) {":
                        pass
                
                # We can just extract the set line and move it to the very beginning of the try block.
                # Find the set line in the original body string, remove it, and prepend it.
                set_match = re.search(r'^\s*set[A-Z]\w+\([^;]+;\s*$', body, re.MULTILINE)
                if set_match:
                    set_str = set_match.group(0)
                    body = body.replace(set_str, "")
                    body = "\n" + set_str + body
                    blocks[i+1] = body

new_content = "".join(blocks)

with open("src/App.tsx", "w") as f:
    f.write(new_content)

print("Done")
