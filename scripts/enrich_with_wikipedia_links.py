import json
import os
from tqdm import tqdm
import concurrent.futures
import requests # We will use requests directly

# You can adjust this number. A higher number means more parallel requests.
# 15-20 is a good range. Be mindful not to overload the API.
MAX_WORKERS = 15
WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

def get_wiki_slug(answer_text):
    """
    Finds the Wikipedia page slug for a given text by querying the
    MediaWiki Action API directly. This is more reliable than the
    wikipedia library.

    Returns the slug on success, or None on failure.
    """
    if not answer_text or not isinstance(answer_text, str):
        return None

    # These are the parameters for our API request
    params = {
        "action": "query",      # We are performing a query
        "format": "json",       # We want the response in JSON format
        "list": "search",       # We are doing a search
        "srsearch": answer_text,# This is the search term itself
        "srlimit": 1,           # We only want the top result
        "srprop": ""            # We don't need any extra properties, just the title
    }
    
    try:
        # It's good practice to set a user-agent
        headers = {'User-Agent': 'JeopardyScraper/1.0 (https://example.com; myemail@example.com)'}
        response = requests.get(WIKIPEDIA_API_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        data = response.json()

        # The search results are in a list. Check if it's not empty.
        search_results = data.get("query", {}).get("search", [])
        if search_results:
            # The first result is the best match. Get its title.
            best_match_title = search_results[0]["title"]
            # Replace spaces with underscores to create the "slug"
            return best_match_title.replace(' ', '_')
        else:
            # No results found for this term
            return None

    except requests.exceptions.RequestException:
        # Handle network errors, timeouts, etc.
        return None
    except (KeyError, IndexError):
        # Handle unexpected JSON structure or empty results
        return None

def enrich_item(item_dict):
    """
    Worker function for a single thread. Takes a dictionary containing an answer,
    gets the wiki slug, and adds it back to the dictionary.
    """
    answer = item_dict.get('a')
    slug = get_wiki_slug(answer)
    item_dict['wiki_slug'] = slug

def enrich_jeopardy_data(input_filepath, output_filepath):
    """
    Reads a Jeopardy JSON file, adds Wikipedia slugs concurrently,
    and saves to a new file.
    """
    with open(input_filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print(f"Warning: Input file {input_filepath} is empty. Creating an empty output file.")
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump([], f)
        return

    items_to_process = []
    if 'questions' in data[0]:
        for category in data:
            items_to_process.extend(category['questions'])
    else:
        items_to_process = data

    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(enrich_item, item) for item in items_to_process]
        kwargs = {
            'total': len(futures),
            'unit': 'slug',
            'desc': f"Enriching {os.path.basename(input_filepath)}"
        }
        for future in tqdm(concurrent.futures.as_completed(futures), **kwargs):
            try:
                future.result()
            except Exception as e:
                tqdm.write(f"An error occurred in a thread: {e}")

    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def process_all_raw_files():
    """
    Finds all JSON files in the raw data directory, checks if they've been
    enriched, and processes them if not.
    """
    RAW_DATA_DIR = os.path.join('..', 'data', 'raw')
    ENRICHED_DATA_DIR = os.path.join('..', 'data', 'enriched')

    print(f"Ensuring output directory exists at: {ENRICHED_DATA_DIR}")
    os.makedirs(ENRICHED_DATA_DIR, exist_ok=True)

    try:
        raw_files = [f for f in os.listdir(RAW_DATA_DIR) if f.endswith('.json')]
    except FileNotFoundError:
        print(f"Error: Raw data directory not found at '{RAW_DATA_DIR}'. Please create it and add your JSON files.")
        return

    if not raw_files:
        print(f"No JSON files found in {RAW_DATA_DIR}.")
        return

    print(f"Found {len(raw_files)} JSON file(s) to potentially process.")

    for filename in raw_files:
        input_filepath = os.path.join(RAW_DATA_DIR, filename)
        output_filepath = os.path.join(ENRICHED_DATA_DIR, filename)

        if os.path.exists(output_filepath):
            print(f"Skipping '{filename}': Enriched version already exists.")
            continue
        
        enrich_jeopardy_data(input_filepath, output_filepath)
        print(f"Finished processing '{filename}'. Saved to {ENRICHED_DATA_DIR}/")

    print("\nAll files processed.")

if __name__ == '__main__':
    # You will need to have requests and tqdm installed:
    # pip install requests tqdm
    process_all_raw_files()
