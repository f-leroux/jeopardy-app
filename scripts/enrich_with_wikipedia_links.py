import json
import wikipedia
import os
from tqdm import tqdm
import concurrent.futures

# You can adjust this number. A higher number means more parallel requests.
# 15-20 is a good range. Be mindful not to overload the API.
MAX_WORKERS = 15

def get_wiki_slug(answer_text):
    """
    Finds the Wikipedia page slug for a given text.
    Returns the slug on success, or None on failure.
    """
    if not answer_text or not isinstance(answer_text, str):
        return None
        
    cleaned_text = answer_text
    if cleaned_text.lower().startswith(('a ', 'an ', 'the ')):
        cleaned_text = cleaned_text.split(' ', 1)[1]

    try:
        page = wikipedia.page(cleaned_text, auto_suggest=True, redirect=True)
        return page.title.replace(' ', '_')
    except wikipedia.exceptions.PageError:
        return None
    except wikipedia.exceptions.DisambiguationError:
        return None
    except Exception:
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

    # Flatten the data into a single list of items to process
    items_to_process = []
    if 'questions' in data[0]:
        # Structure: [{"category": ..., "questions": [{"q": ..., "a": ...}]}]
        for category in data:
            items_to_process.extend(category['questions'])
    else:
        # Structure: [{"category": ..., "q": ..., "a": ...}]
        items_to_process = data

    # Use ThreadPoolExecutor to process items in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # We pass the dictionary object itself to the worker.
        # The worker will modify it in place, adding the 'wiki_slug'.
        futures = [executor.submit(enrich_item, item) for item in items_to_process]
        
        # Use tqdm for a progress bar as futures complete
        kwargs = {
            'total': len(futures),
            'unit': 'slug',
            'desc': f"Enriching {os.path.basename(input_filepath)}"
        }
        for future in tqdm(concurrent.futures.as_completed(futures), **kwargs):
            try:
                future.result() # We call result() to raise any exceptions that occurred
            except Exception as e:
                tqdm.write(f"An error occurred in a thread: {e}")

    # The original 'data' object is now fully enriched because the items
    # within it were modified in place.
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
        
        # No print statement here, the progress bar from tqdm will show the status
        enrich_jeopardy_data(input_filepath, output_filepath)
        print(f"Finished processing '{filename}'. Saved to {ENRICHED_DATA_DIR}/")

    print("\nAll files processed.")


if __name__ == '__main__':
    # Make sure you have installed the required libraries:
    # pip install wikipedia tqdm
    process_all_raw_files()
