import json
import os
import glob

def concatenate_jeopardy_files():
    """
    Finds all 'jeopardy_questions_*.json' files in the enriched data
    directory, concatenates them, and saves the result to a single file
    in the 'data/full' directory.
    """
    # Define project directories
    ENRICHED_DIR = os.path.join('..', 'data', 'enriched')
    FULL_DATA_DIR = os.path.join('..', 'data', 'full')
    
    # Define the pattern for the files we want to combine
    file_pattern = os.path.join(ENRICHED_DIR, 'jeopardy_questions_*.json')
    
    # The name of the final output file
    output_filename = os.path.join(FULL_DATA_DIR, 'jeopardy_questions.json')

    print(f"Looking for files matching: {file_pattern}")

    # Use glob to find all files that match the pattern
    source_files = glob.glob(file_pattern)

    if not source_files:
        print("No source files found to concatenate. Exiting.")
        return

    print(f"Found {len(source_files)} file(s) to combine.")
    
    # This list will hold all the data from all the files
    combined_data = []

    # Loop through each file found
    for file_path in sorted(source_files): # Sorting ensures a consistent order
        print(f"  - Reading {os.path.basename(file_path)}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            combined_data.extend(data) # Add the contents to our master list

    # Ensure the output directory exists
    os.makedirs(FULL_DATA_DIR, exist_ok=True)

    # Write the combined data to the new file
    print(f"\nWriting {len(combined_data)} total entries to {output_filename}...")
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, ensure_ascii=False, indent=4)

    print("Concatenation complete!")

if __name__ == '__main__':
    concatenate_jeopardy_files()
