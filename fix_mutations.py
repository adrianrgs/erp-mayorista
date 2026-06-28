import re

def fix_mutation_block(block):
    if not block.strip():
        return block
    
    # Identify the mutation name
    name_match = re.match(r'mutation\s+(\w+)', block)
    if not name_match:
        return block
    name = name_match.group(1)
    
    # 1. Handle DELETE mutations
    if 'delete' in name.lower() or '_delete' in block:
        # Remove $updatedAt parameter from definition
        # Matches: ", $updatedAt: String" or "$updatedAt: String"
        block = re.sub(r',\s*\$updatedAt:\s*String', '', block)
        block = re.sub(r'\$updatedAt:\s*String,?\s*', '', block)
        # Remove empty parentheses if any, e.g. "()"
        block = re.sub(r'\(\s*\)', '', block)
        
        # Remove updatedAt argument from body
        # Matches: "updatedAt: $updatedAt," or "updatedAt: $updatedAt"
        block = re.sub(r'updatedAt:\s*\$updatedAt,?\s*', '', block)
        # Remove trailing comma inside call parentheses, e.g. "(id: $id, )" -> "(id: $id)"
        block = re.sub(r',\s*\)', ')', block)
        return block
        
    # 2. Handle UPDATE mutations
    if 'update' in name.lower() or '_update' in block:
        # Check if updatedAt is outside the data block
        # Typically: _update(id: $id,\n    updatedAt: $updatedAt, data: { ... })
        # Or: _update(id: $id\n    updatedAt: $updatedAt,data: { ... })
        # Let's find: updatedAt: $updatedAt, followed by data: {
        pattern1 = r'updatedAt:\s*\$updatedAt,\s*data:\s*\{'
        pattern2 = r'updatedAt:\s*\$updatedAt,data:\s*\{'
        
        if re.search(pattern1, block) or re.search(pattern2, block):
            # Move inside data block
            block = re.sub(r'updatedAt:\s*\$updatedAt,\s*data:\s*\{', 'data: {\n    updatedAt: $updatedAt,', block)
            block = re.sub(r'updatedAt:\s*\$updatedAt,data:\s*\{', 'data: {\n    updatedAt: $updatedAt,', block)
            # Cleanup double commas or formatting if any
            
        # Also clean up any extra updatedAt outside data block if they got left
        # Example: some_update(id: $id,\n    updatedAt: $updatedAt,\n    data: { ... })
        # We look for "updatedAt: $updatedAt" that is NOT inside data: { ... }
        # Let's find "updatedAt: $updatedAt," and remove it from outside, and put it inside data: {
        if 'updatedAt: $updatedAt' in block:
            # Let's find the position of "data: {"
            data_pos = block.find('data: {')
            if data_pos != -1:
                # If there's an updatedAt before "data: {", remove it and insert it after "data: {"
                before_data = block[:data_pos]
                after_data = block[data_pos:]
                
                # Check if updatedAt is in before_data
                if 'updatedAt: $updatedAt' in before_data:
                    # Remove it from before_data (including trailing comma and whitespace)
                    before_data = re.sub(r'updatedAt:\s*\$updatedAt,?\s*', '', before_data)
                    # Remove trailing comma before data if any, e.g. "id: $id, \n  data: {" -> "id: $id, \n  data: {" (handled by graphql parser anyway but let's be neat)
                    # Insert inside data block
                    after_data = after_data.replace('data: {', 'data: {\n    updatedAt: $updatedAt,')
                    block = before_data + after_data
                    
        # Make sure parameters list has $updatedAt: String if it's missing but we put it in data
        if 'updatedAt: $updatedAt' in block and '$updatedAt: String' not in block:
            # Add to definition
            block = block.replace(')', ', $updatedAt: String)', 1)
            
        return block

    return block

with open('dataconnect/connector/mutations.gql', 'r') as f:
    content = f.read()

# Split mutations by "mutation" keyword
parts = re.split(r'(?=mutation\s+\w+)', content)
fixed_parts = [parts[0]] + [fix_mutation_block(p) for p in parts[1:]]
new_content = "".join(fixed_parts)

with open('dataconnect/connector/mutations.gql', 'w') as f:
    f.write(new_content)

print("Mutations fixed!")
