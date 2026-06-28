import re

with open('dataconnect/connector/queries.gql', 'r') as f:
    queries = f.read()

# Add updatedAt to the selection set of list queries.
# Specifically, we want to add updatedAt to all queries that return a list of objects.
# The simplest way is to look for "id\n" or "id" at the start of a selection and append "updatedAt"
queries = re.sub(r'(\s+id\s+)', r'\g<1>updatedAt\n', queries)

with open('dataconnect/connector/queries.gql', 'w') as f:
    f.write(queries)

with open('dataconnect/connector/mutations.gql', 'r') as f:
    muts = f.read()

# For mutations, it's a bit harder because we need to add $updatedAt: String to the mutation arguments
# AND updatedAt: $updatedAt to the data input.

def add_arg_to_mutation(match):
    header = match.group(1)
    if "$updatedAt: String" not in header:
        if ")" in header:
            header = header.replace(")", ", $updatedAt: String)")
        else:
            # this is unlikely in my schema as all mutations have arguments
            pass
    
    body = match.group(2)
    if "updatedAt:" not in body and "data: {" in body:
        # Find the data block and inject updatedAt
        body = body.replace("data: {", "data: {\n      updatedAt: $updatedAt,")
    elif "updatedAt:" not in body and "_insert" in body:
        # Some mutations use kwargs instead of `data:`
        # This regex matches the mutation call like `myTable_insert(...)` or `myTable_update(...)`
        body = re.sub(r'(\w+_(?:insert|update)\()', r'\g<1>updatedAt: $updatedAt, ', body)
        
    return header + body

# split mutations by "mutation" keyword
new_muts = ""
import sys
# It's actually safer to do this manually or via a smart regex
mutations = re.split(r'(?=mutation\s+\w+)', muts)
for m in mutations:
    if not m.strip():
        continue
    # Add $updatedAt: String to args
    if "$updatedAt: String" not in m and "(" in m.split("{")[0]:
        m = m.replace(")", ", $updatedAt: String)", 1)
        
    # Add updatedAt: $updatedAt to the body
    if "updatedAt: $updatedAt" not in m:
        # Find where the fields are assigned, e.g. `id: $id`
        # We can just append `updatedAt: $updatedAt` after `id: $id`
        m = re.sub(r'(id:\s*\$id\s*,?)', r'\g<1>\n    updatedAt: $updatedAt,', m)
    
    new_muts += m

with open('dataconnect/connector/mutations.gql', 'w') as f:
    f.write(new_muts)

print("Done")
