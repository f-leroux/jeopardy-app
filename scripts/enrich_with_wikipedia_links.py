import json
import os
import argparse
from tqdm import tqdm
import concurrent.futures
import requests

# You can adjust this number. A higher number means more parallel requests.
MAX_WORKERS = 15
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

def get_wiki_slug(answer_text):
    """
    Finds the Wikipedia page slug for a given text by querying the
    MediaWiki Action API directly.
    """
    if not answer_text or not isinstance(answer_text, str):
        return None

    params = {
        "action": "query", "format": "json", "list": "search",
        "srsearch": answer_text, "srlimit": 1, "srprop": ""
    }
    
    try:
        headers = {'User-Agent': 'JeopardyEnricher/1.1'}
        response = requests.get(WIKIPEDIA_API_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        search_results = data.get("query", {}).get("search", [])
        if search_results:
            return search_results[0]["title"].replace(' ', '_')
        return None
    except (requests.exceptions.RequestException, KeyError, IndexError):
        return None

def enrich_item(item_dict):
    """
    Worker function: takes a dictionary, gets the wiki slug for its answer,
    and adds it back to the dictionary.
    """
    answer = item_dict.get('a')
    slug = get_wiki_slug(answer)
    item_dict['wiki_slug'] = slug

def enrich_jeopardy_data(input_filepath, output_filepath, retry_nulls=False):
    """
    Reads a Jeopardy JSON file, adds Wikipedia slugs concurrently,
    and saves the result.
    """
    with open(input_filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        tqdm.write(f"Warning: Input file {input_filepath} is empty. Skipping.")
        if input_filepath != output_filepath: # Only create new file in normal mode
            with open(output_filepath, 'w', encoding='utf-8') as f: json.dump([], f)
        return

    # Flatten the data into a single list of items that need processing
    all_items = []
    is_regular_format = 'questions' in data[0]
    if is_regular_format:
        for category in data:
            all_items.extend(category['questions'])
    else:
        all_items = data

    # THIS IS THE KEY LOGIC: Filter the list based on the mode
    if retry_nulls:
        # In retry mode, only process items where the slug is missing
        items_to_process = [item for item in all_items if item.get('wiki_slug') is None]
    else:
        # In normal mode, process all items
        items_to_process = all_items
    
    if not items_to_process:
        tqdm.write(f"No items to process for {os.path.basename(input_filepath)}. Skipping API calls.")
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(enrich_item, item) for item in items_to_process]
            kwargs = {
                'total': len(futures), 'unit': 'slug',
                'desc': f"Processing {os.path.basename(input_filepath)}"
            }
            for future in tqdm(concurrent.futures.as_completed(futures), **kwargs):
                future.result() # Calling result() helps propagate exceptions

    # The original 'data' object is now fully updated in memory.
    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def main(retry_nulls):
    """
    Main function to orchestrate the enrichment process based on the selected mode.
    """
    RAW_DATA_DIR = os.path.join('..', 'data', 'raw')
    ENRICHED_DATA_DIR = os.path.join('..', 'data', 'enriched')
    os.makedirs(ENRICHED_DATA_DIR, exist_ok=True)

    if retry_nulls:
        print("--- Running in --retry-nulls mode ---")
        print(f"Scanning for existing files in {ENRICHED_DATA_DIR} to update...")
        source_dir = ENRICHED_DATA_DIR
        files_to_process = [f for f in os.listdir(source_dir) if f.endswith('.json')]
    else:
        print("--- Running in normal mode ---")
        print(f"Scanning for new files in {RAW_DATA_DIR} to process...")
        source_dir = RAW_DATA_DIR
        try:
            files_to_process = [f for f in os.listdir(source_dir) if f.endswith('.json')]
        except FileNotFoundError:
            print(f"Error: Raw data directory not found at '{RAW_DATA_DIR}'. Please create it.")
            return

    if not files_to_process:
        print("No JSON files found to process.")
        return

    print(f"Found {len(files_to_process)} JSON file(s) to process.")
    for filename in files_to_process:
        input_filepath = os.path.join(source_dir, filename)
        output_filepath = os.path.join(ENRICHED_DATA_DIR, filename)

        if not retry_nulls and os.path.exists(output_filepath):
            print(f"Skipping '{filename}': Enriched version already exists.")
            continue
        
        enrich_jeopardy_data(input_filepath, output_filepath, retry_nulls)
        if retry_nulls:
            print(f"Finished retrying '{filename}'. File has been updated.")
        else:
            print(f"Finished processing '{filename}'. Saved to {ENRICHED_DATA_DIR}/")

    print("\nAll files processed.")

if __name__ == '__main__':
    # Set up the command-line argument parser
    parser = argparse.ArgumentParser(
        description="Enrich Jeopardy data with Wikipedia slugs. Can process new files or retry failed lookups in existing files."
    )
    parser.add_argument(
        '--retry-nulls',
        action='store_true',
        help="If set, the script will scan data/enriched/ and retry API lookups for entries where 'wiki_slug' is null."
    )
    args = parser.parse_args()

    # Call the main function with the value of the flag
    main(retry_nulls=args.retry_nulls)
