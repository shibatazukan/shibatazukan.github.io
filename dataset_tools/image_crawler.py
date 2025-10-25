
!pip install icrawler

import os
import shutil
from google.colab import files
from icrawler.builtin import BingImageCrawler

def download_images(keyword, max_images):
    """
    指定したキーワードで画像をダウンロード
    """
    safe_keyword = keyword.replace(' ', '_')
    output_dir = f"/content/{safe_keyword}_images"
    
    # 既存ディレクトリを削除
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    # 画像をダウンロード
    print(f"'{keyword}' の画像を {max_images} 枚ダウンロード中...")
    crawler = BingImageCrawler(storage={"root_dir": output_dir})
    crawler.crawl(keyword=keyword, max_num=int(max_images))
    
    # ダウンロードした画像を確認
    downloaded_images = [f for f in os.listdir(output_dir) 
                        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
    print(f"{len(downloaded_images)} 枚の画像がダウンロードされました。")
    
    # 指定枚数を超えた画像を削除
    if len(downloaded_images) > int(max_images):
        for extra_file in downloaded_images[int(max_images):]:
            os.remove(os.path.join(output_dir, extra_file))
        downloaded_images = downloaded_images[:int(max_images)]
    
    # ZIP化してダウンロード
    zip_path = f"{safe_keyword}_images.zip"
    shutil.make_archive(f"{safe_keyword}_images", "zip", output_dir)
    files.download(zip_path)
    
    print(f"\n=== ダウンロード完了 ===")
    print(f"保存先: {output_dir}")
    print(f"総画像数: {len(downloaded_images)} 枚")
    print(f"ZIPファイル: {zip_path}")
    
    return output_dir, len(downloaded_images)

# メイン実行部分
print("=== 画像収集ツール ===")
keyword = input('検索キーワードを入力してください: ')
max_images = input('ダウンロードする画像数を入力してください: ')

try:
    output_dir, total_images = download_images(keyword, max_images)
    print(f"\n画像は '{output_dir}' に保存されました")
    
except Exception as e:
    print(f"エラーが発生しました: {e}")