# google Bingから収集するver
!pip install icrawler requests

import os
import shutil
import time
from google.colab import files
from icrawler.builtin import BingImageCrawler, GoogleImageCrawler

def download_images(keyword, max_images, use_multiple_sources=True):
    """
    複数のソースから画像をダウンロード
    """
    safe_keyword = keyword.replace(' ', '_')
    output_dir = f"/content/{safe_keyword}_images"
    
    # 既存ディレクトリを削除
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    total_downloaded = 0
    target = int(max_images)
    
    # Bingから画像をダウンロード
    if use_multiple_sources:
        print(f"Bingから '{keyword}' の画像をダウンロード中...")
        try:
            bing_crawler = BingImageCrawler(
                storage={"root_dir": output_dir},
                downloader_threads=4,
                feeder_threads=1
            )
            bing_crawler.crawl(
                keyword=keyword, 
                max_num=target,
                min_size=(200, 200),  # 最小サイズを指定
                filters=None
            )
            time.sleep(2)
            current_count = len([f for f in os.listdir(output_dir) 
                               if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))])
            print(f"Bingから {current_count} 枚ダウンロード完了")
            total_downloaded = current_count
        except Exception as e:
            print(f"Bingでのダウンロードエラー: {e}")
    
    # Googleからも画像をダウンロード（足りない場合）
    if use_multiple_sources and total_downloaded < target:
        remaining = target - total_downloaded
        print(f"\nGoogleから追加で {remaining} 枚ダウンロード中...")
        try:
            google_crawler = GoogleImageCrawler(
                storage={"root_dir": output_dir},
                downloader_threads=4,
                feeder_threads=1
            )
            google_crawler.crawl(
                keyword=keyword,
                max_num=remaining * 2,  # 余裕を持って多めにリクエスト
                min_size=(200, 200)
            )
            time.sleep(2)
        except Exception as e:
            print(f"Googleでのダウンロードエラー: {e}")
    
    # ダウンロードした画像を確認
    downloaded_images = [f for f in os.listdir(output_dir) 
                        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))]
    
    print(f"\n総ダウンロード数: {len(downloaded_images)} 枚")
    
    # 指定枚数を超えた画像を削除
    if len(downloaded_images) > target:
        for extra_file in downloaded_images[target:]:
            os.remove(os.path.join(output_dir, extra_file))
        downloaded_images = downloaded_images[:target]
    
    # ZIP化してダウンロード
    if downloaded_images:
        zip_path = f"/content/{safe_keyword}_images"
        shutil.make_archive(zip_path, "zip", output_dir)
        files.download(f"{zip_path}.zip")
        
        print(f"\n=== ダウンロード完了 ===")
        print(f"保存先: {output_dir}")
        print(f"最終画像数: {len(downloaded_images)} 枚")
        print(f"ZIPファイル: {zip_path}.zip")
    else:
        print("\n画像がダウンロードできませんでした。")
    
    return output_dir, len(downloaded_images)

# メイン実行部分
print("=== 画像収集ツール（改良版）===")
keyword = input('検索キーワードを入力してください: ')
max_images = input('ダウンロードする画像数を入力してください: ')

try:
    output_dir, total_images = download_images(keyword, max_images)
    
    if total_images < int(max_images):
        print(f"\n注意: 目標 {max_images} 枚に対し、{total_images} 枚のみダウンロードできました")
        print("改善策:")
        print("- より一般的なキーワードを使用する")
        print("- 英語のキーワードを試す")
        print("- ダウンロード数を減らす")
    
except Exception as e:
    print(f"エラーが発生しました: {e}")
