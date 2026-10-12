import sys
import os
import json
import sqlite3
import re

# Set encoding to utf-8 for stdout
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    # Python versions < 3.7
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified"}))
        return

    action = sys.argv[1]

    if action == "scan":
        folder = sys.argv[2]
        if not os.path.exists(folder):
            print(json.dumps({"error": f"Folder does not exist: {folder}"}))
            return
        
        try:
            files = os.listdir(folder)
            sdbs = [f for f in files if f.lower().endswith("s.sdb")]
            dicts = [f for f in files if f.lower().endswith(".dct")]
            print(json.dumps({"sdbs": sdbs, "dcts": dicts}))
        except Exception as e:
            print(json.dumps({"error": f"Failed to scan folder: {str(e)}"}))

    elif action == "query":
        # python query_strong.py query <sdb_path> <dct_path> <book_num> <chapter> [verse]
        if len(sys.argv) < 6:
            print(json.dumps({"error": "Missing query parameters"}))
            return
            
        sdb_path = sys.argv[2]
        dct_path = sys.argv[3]
        book_num = int(sys.argv[4])
        chapter = int(sys.argv[5])
        
        verse_num = None
        if len(sys.argv) > 6 and sys.argv[6] != "null" and sys.argv[6] != "":
            try:
                verse_num = int(sys.argv[6])
            except ValueError:
                pass

        if not os.path.exists(sdb_path):
            print(json.dumps({"error": f"SDB file not found: {sdb_path}"}))
            return

        # Query SDB
        try:
            conn_sdb = sqlite3.connect(sdb_path)
            cursor_sdb = conn_sdb.cursor()
            
            if verse_num is not None:
                cursor_sdb.execute(
                    "SELECT book, chapter, verse, btext FROM Bible WHERE book=? AND chapter=? AND verse=?",
                    (book_num, chapter, verse_num)
                )
            else:
                cursor_sdb.execute(
                    "SELECT book, chapter, verse, btext FROM Bible WHERE book=? AND chapter=? ORDER BY verse ASC",
                    (book_num, chapter)
                )
            
            rows = cursor_sdb.fetchall()
            conn_sdb.close()
        except Exception as e:
            print(json.dumps({"error": f"Failed to query SDB: {str(e)}"}))
            return

        # Process verses and gather Strong's codes
        verses = []
        strong_codes = set()
        
        pattern = re.compile(r'<W([HG]\d+)>')
        
        for row in rows:
            b, ch, v, btext = row
            codes = pattern.findall(btext)
            for c in codes:
                strong_codes.add(c)
                
            raw_text = pattern.sub('', btext)
            
            verses.append({
                "book": b,
                "chapter": ch,
                "verse": v,
                "btext": btext,
                "raw_text": raw_text
            })

        # Query DCT for definitions
        lexicon = {}
        if os.path.exists(dct_path) and strong_codes:
            try:
                conn_dct = sqlite3.connect(dct_path)
                cursor_dct = conn_dct.cursor()
                
                strong_codes_list = list(strong_codes)
                # Chunk strong codes queries if there are too many (SQLite query size limit)
                chunk_size = 500
                for i in range(0, len(strong_codes_list), chunk_size):
                    chunk = strong_codes_list[i:i+chunk_size]
                    placeholders = ",".join(["?"] * len(chunk))
                    query = f"SELECT scode, dtext FROM Lexicon WHERE scode IN ({placeholders})"
                    cursor_dct.execute(query, chunk)
                    
                    for code, dtext in cursor_dct.fetchall():
                        lexicon[code] = dtext
                    
                conn_dct.close()
            except Exception as e:
                lexicon["error"] = f"Failed to query DCT: {str(e)}"

        print(json.dumps({
            "verses": verses,
            "lexicon": lexicon
        }, ensure_ascii=False))

    elif action == "dict":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Missing dictionary parameters"}))
            return
        dct_path = sys.argv[2]
        scode = sys.argv[3]
        if not os.path.exists(dct_path):
            print(json.dumps({"error": f"DCT file not found: {dct_path}"}))
            return
        try:
            conn = sqlite3.connect(dct_path)
            cursor = conn.cursor()
            cursor.execute("SELECT dtext FROM Lexicon WHERE scode=?", (scode,))
            row = cursor.fetchone()
            conn.close()
            if row:
                print(json.dumps({"scode": scode, "definition": row[0]}, ensure_ascii=False))
            else:
                print(json.dumps({"scode": scode, "definition": None}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": f"Failed to query DCT: {str(e)}"}))

if __name__ == "__main__":
    main()
