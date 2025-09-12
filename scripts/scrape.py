import requests
from bs4 import BeautifulSoup
import json
import re
import concurrent.futures
from tqdm import tqdm # A library for a smart progress bar

def scrape_jeopardy_game(game_id):
    """
    Scrapes a single game of Jeopardy! from the J! Archive website.

    Args:
        game_id (int): The ID of the game to scrape.

    Returns:
        tuple: A tuple containing a list of regular round data and a dictionary
               for the Final Jeopardy! round. Returns (None, None) if the
               page cannot be fetched or parsed.
    """
    url = f"https://j-archive.com/showgame.php?game_id={game_id}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
    except requests.exceptions.RequestException:
        # We will return None and let the main loop handle the error message
        return None, None

    soup = BeautifulSoup(response.text, 'html.parser')

    # --- Regular and Double Jeopardy! Rounds ---
    all_categories_data = []
    round_identifiers = ['jeopardy_round', 'double_jeopardy_round']
    
    # This set will store the names of categories that contain links
    categories_to_exclude = set()

    for identifier in round_identifiers:
        round_div = soup.find('div', id=identifier)
        if not round_div:
            continue

        category_elements = round_div.find_all('td', class_='category_name')
        categories = [c.get_text(strip=True) for c in category_elements]
        
        temp_category_data = {name: [] for name in categories}
        clue_elements = round_div.find_all('td', class_='clue')
        
        for clue in clue_elements:
            question_element = clue.find('td', id=re.compile(r'clue_(J|DJ)_\d+_\d+$'))
            if not question_element:
                continue
            
            question_text = question_element.get_text(strip=False)
            question_id = question_element.get('id')
            
            try:
                category_index = int(question_id.split('_')[2]) - 1
                category_name = categories[category_index]
            except (IndexError, ValueError):
                continue
                
            # Check for hrefs and flag the category for exclusion if found
            if question_element.find('a'):
                categories_to_exclude.add(category_name)

            answer_id = f"{question_id}_r"
            answer_element = soup.find('td', id=answer_id)

            if answer_element:
                correct_response_em = answer_element.find('em', class_='correct_response')
                if correct_response_em:
                    answer_text = correct_response_em.get_text(strip=False)
                    temp_category_data[category_name].append({"q": question_text, "a": answer_text})

        # Add the categories to the final list, respecting the exclusion list
        for category_name, questions in temp_category_data.items():
            if questions and category_name not in categories_to_exclude:
                all_categories_data.append({"category": category_name, "questions": questions})

    # --- Final Jeopardy! (Corrected) ---
    final_jeopardy_data = None
    final_jeopardy_div = soup.find('div', id='final_jeopardy_round') # ADD this line to get the container
    if final_jeopardy_div:
        fj_category_element = final_jeopardy_div.find('td', class_='category_name') # ADD this line
        fj_question_element = final_jeopardy_div.find('td', id='clue_FJ')
        fj_answer_element = final_jeopardy_div.find('td', id='clue_FJ_r')

        if fj_category_element and fj_question_element and fj_answer_element:
            final_category = fj_category_element.get_text(strip=False) # ADD this line
            final_question = fj_question_element.get_text(strip=False)
            correct_response_em = fj_answer_element.find('em', class_='correct_response')
            if correct_response_em:
                final_answer = correct_response_em.get_text(strip=False)
                # MODIFY the line below to include the category
                final_jeopardy_data = {"category": final_category, "q": final_question, "a": final_answer}

    return all_categories_data, final_jeopardy_data


def scrape_jarchive_range(start_id, end_id, regular_output_file, final_output_file, max_workers):
    """
    Scrapes a range of Jeopardy! games concurrently and saves the data to JSON files.
    """
    all_regular_data = []
    all_final_data = []
    game_ids = range(start_id, end_id + 1)

    # Use ThreadPoolExecutor to fetch pages in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Create a dictionary to map futures to their game_id
        future_to_game_id = {executor.submit(scrape_jeopardy_game, game_id): game_id for game_id in game_ids}
        
        # Use tqdm for a nice progress bar
        kwargs = {
            'total': len(game_ids),
            'unit': 'game',
            'leave': True
        }
        for future in tqdm(concurrent.futures.as_completed(future_to_game_id), **kwargs):
            game_id = future_to_game_id[future]
            try:
                regular_data, final_data = future.result()
                if regular_data:
                    all_regular_data.extend(regular_data)
                if final_data:
                    all_final_data.append(final_data)
            except Exception as exc:
                tqdm.write(f"Game {game_id} generated an exception: {exc}")

    # Sort categories alphabetically for consistent output
    all_regular_data.sort(key=lambda x: x['category'])

    with open(regular_output_file, 'w', encoding='utf-8') as f:
        json.dump(all_regular_data, f, ensure_ascii=False, indent=4)

    with open(final_output_file, 'w', encoding='utf-8') as f:
        json.dump(all_final_data, f, ensure_ascii=False, indent=4)

    print(f"\nScraping complete!")
    print(f"Regular round data saved to {regular_output_file}")
    print(f"Final Jeopardy! data saved to {final_output_file}")


if __name__ == '__main__':
    # Define the range of game IDs you want to scrape
    START_GAME_ID = 1
    END_GAME_ID = 100

    # Number of parallel download threads. 
    # Increase for faster scraping, but be respectful of the server. 10-15 is a safe range.
    MAX_WORKERS = 10

    # Define the output file names
    REGULAR_JSON_FILE = f'../data/raw/jeopardy_questions_{START_GAME_ID}-{END_GAME_ID}.json'
    FINAL_JEOPARDY_JSON_FILE = f'../data/raw/final_jeopardy_questions_{START_GAME_ID}-{END_GAME_ID}.json'

    scrape_jarchive_range(START_GAME_ID, END_GAME_ID, REGULAR_JSON_FILE, FINAL_JEOPARDY_JSON_FILE, MAX_WORKERS)
