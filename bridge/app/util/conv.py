import unicodedata
import jaconv


def contains_kanji(string):
    for ch in string:
        name = unicodedata.name(ch)
        if "CJK UNIFIED" in name:
            return True
    return False


def get_char_class(string):
    for ch in string:
        name = unicodedata.name(ch)
        if 'CJK UNIFIED' in name:
            return 1
        elif 'HIRAGANA' in name:
            return 2
        elif 'KATAKANA' in name:
            return 3
    return 0


def to_katakana(name):
    return jaconv.hira2kata(name)


def to_patient_name(name):
    kanji = contains_kanji(name)
    if not kanji:
        name = jaconv.hira2kata(name)
    return kanji, name


def to_medicine_keyword(string):
    text = jaconv.hira2kata(string)
    text = jaconv.h2z(text, digit=True, ascii=True)

    lst = text.split()
    if len(lst) > 1:
        return '.*'.join(lst)
    else:
        return lst[0]
