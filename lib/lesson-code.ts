export const codeExamples: Record<string, Record<number, string>> = {
  "python-for-data-analysis": {
    3: 'score = int("18")\nbonus = 2\nprint(score + bonus)  # 20',
    4: 'scores = [12, 15, 18, 20]\nprint(scores[1:3])  # [15, 18]',
    5: 'scores = [29, 30, 45, 50]\ncount = 0\nfor score in scores:\n    if score >= 30:\n        count += 1\nprint(count)  # 3',
    6: 'def percent(part, total):\n    if total <= 0:\n        return None\n    return 100 * part / total\n\nprint(percent(9, 12))  # 75.0',
    7: 'results = ["W", "D", "W", "L"]\ncounts = {}\nfor result in results:\n    counts[result] = counts.get(result, 0) + 1\nprint(counts)  # {"W": 2, "D": 1, "L": 1}',
    8: 'from io import StringIO\nimport pandas as pd\n\ncsv = StringIO("student,quiz,score\\nA01,1,72\\nA02,1,80\\nA03,1,75\\nA04,1,91")\ndf = pd.read_csv(csv)\nprint(df.shape)  # (4, 3)',
    14: 'import pandas as pd\n\nraw = pd.Series(["12", "35", "absent"])\nconverted = pd.to_numeric(raw, errors="coerce")\nprint(converted.isna().sum())  # 1',
    18: 'import pandas as pd\n\ndf = pd.DataFrame({"class": ["A", "A", "B", "B"], "score": [60, 80, 90, 100]})\nprint(df.groupby("class")["score"].mean())  # A: 70, B: 95',
    19: 'import pandas as pd\n\nregister = pd.DataFrame({"id": ["A01", "A02", "A03"]})\nquiz = pd.DataFrame({"id": ["A01", "A03"], "score": [75, 92]})\nresult = register.merge(quiz, on="id", how="left", validate="one_to_one")\nprint(result)  # A02 has no score',
    22: 'import matplotlib.pyplot as plt\n\nplt.bar(["Robotics", "Chess"], [24, 12])\nplt.ylabel("Number of members")\nplt.ylim(bottom=0)\nplt.show()',
  },
  "rag-applications-with-langchain": {
    7: 'from math import sqrt\n\na, b = (1, 2), (4, 6)\ndistance = sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))\nprint(distance)  # 5.0',
    8: 'from math import hypot\n\na, b = (1, 0), (3, 4)\ndot = sum(x * y for x, y in zip(a, b))\nprint(dot / (hypot(*a) * hypot(*b)))  # 0.6',
    15: 'from langchain_core.documents import Document\nfrom langchain_text_splitters import RecursiveCharacterTextSplitter\n\nsource = Document(page_content="The library closes at 5 p.m.", metadata={"page": 12})\nsplitter = RecursiveCharacterTextSplitter(chunk_size=24, chunk_overlap=5)\nfor passage in splitter.split_documents([source]):\n    print(passage.page_content, passage.metadata)',
    18: 'relevant = {"page-2", "page-5", "page-9"}\nretrieved = ["page-2", "page-8", "page-5", "page-12"]\nhits = len(relevant.intersection(retrieved))\nprint(f"Recall: {hits / len(relevant):.1%}")  # 66.7%',
  },
};
