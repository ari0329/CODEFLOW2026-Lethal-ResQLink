"""
Text Cleaner — handles noisy, panic-driven, abbreviation-heavy text
"""
import re

SLANG_MAP = {
    "plz": "please", "pls": "please", "hlp": "help", "hlp": "help",
    "asap": "as soon as possible", "omg": "oh my god", "wtf": "what the",
    "idk": "i don't know", "rn": "right now", "atm": "at the moment",
    "cnt": "can't", "cant": "can't", "wont": "won't", "dont": "don't",
    "r": "are", "u": "you", "ur": "your", "ppl": "people",
    "4": "for", "2": "to", "b4": "before", "bc": "because",
    "msg": "message", "txt": "text", "ph": "phone", "no": "number",
    "dept": "department", "govt": "government", "qty": "quantity",
    "approx": "approximately", "poss": "possible", "immed": "immediately",
}


class TextCleaner:
    def clean(self, text: str) -> str:
        if not text:
            return ""

        words = text.split()
        expanded = []
        for word in words:
            clean_word = re.sub(r'[^\w]', '', word.lower())
            expanded.append(SLANG_MAP.get(clean_word, word))
        text = " ".join(expanded)

        text = re.sub(r'\s+', ' ', text).strip()

        text = re.sub(r'http\S+|www\S+', '', text)

        text = re.sub(r'(.)\1{3,}', r'\1\1', text)

        text = re.sub(r'[!]{3,}', '!!!', text)
        text = re.sub(r'[?]{3,}', '???', text)

        text = re.sub(r'[^\w\s\.,!?@#\-\'\"°\u0080-\uFFFF]', ' ', text)

        return text.strip()