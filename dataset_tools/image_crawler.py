!pip install -q icrawler imagehash pillow

import os
import shutil
import time
from google.colab import files
from icrawler.builtin import BingImageCrawler
from PIL import Image
import imagehash

IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.webp')

BLOCKED_DOMAINS = [
    'istockphoto',
    'pngtree',
    'wallpaperbetter',
    'pxhere',
    'shutterstock',
    'gettyimages',
]

def is_blocked(filename):
    return any(b in filename.lower() for b in BLOCKED_DOMAINS)

def get_phash(path):
    try:
        with Image.open(path) as img:
            img = img.convert("RGB")
            return imagehash.phash(img)
    except:
        return None

def download_images_no_duplicates(keyword, max_images):
    safe_keyword = keyword.replace(' ', '_')
    output_dir = f"/content/{safe_keyword}_images"

    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    target = int(max_images)
    downloaded = 0
    seen_hashes = set()

    # 小豆を調べている例
    queries = [
        #keyword,
        #f"{keyword} 写真",
        #f"{keyword} 植物",
        #f"{keyword} close up",
        #f"{keyword} outdoor",
        "vicia unijuga",
        "vicia unijuga photo",
        "Two-Leaved Vetch"
    ]

    print(f"\n目標枚数: {target}\n")

    for q in queries:
        if downloaded >= target:
            break

        print(f"[Bing] 検索語: {q}")

        temp_dir = f"{output_dir}/temp"
        os.makedirs(temp_dir, exist_ok=True)

        need = max((target - downloaded) * 4, 60)

        crawler = BingImageCrawler(
            storage={"root_dir": temp_dir},
            downloader_threads=6
        )
        crawler.crawl(keyword=q, max_num=need)
        time.sleep(2)

        files_now = [f for f in os.listdir(temp_dir)
                     if f.lower().endswith(IMAGE_EXTS)]

        for f in files_now:
            if downloaded >= target:
                break

            if is_blocked(f):
                continue

            src = os.path.join(temp_dir, f)

            try:
                if os.path.getsize(src) < 1024:
                    continue
            except:
                continue

            ph = get_phash(src)
            if ph is None or ph in seen_hashes:
                continue

            seen_hashes.add(ph)

            ext = os.path.splitext(f)[1]
            new_name = f"{safe_keyword}_{downloaded+1:04d}{ext}"
            dst = os.path.join(output_dir, new_name)

            try:
                shutil.move(src, dst)
                downloaded += 1
            except:
                continue

        shutil.rmtree(temp_dir)
        print(f"  → 現在 {downloaded}/{target}\n")
        time.sleep(3)

    final_images = [f for f in os.listdir(output_dir)
                    if f.lower().endswith(IMAGE_EXTS)]

    print("\n==============================")
    print(f"最終取得枚数（重複除去後）: {len(final_images)} / {target}")
    print("==============================")

    if final_images:
        zip_path = f"{safe_keyword}_images"
        shutil.make_archive(zip_path, "zip", output_dir)
        files.download(zip_path + ".zip")

    return output_dir, len(final_images)


# 実行
kw = input("検索キーワード: ")
num = input("画像枚数: ")

download_images_no_duplicates(kw, num)
