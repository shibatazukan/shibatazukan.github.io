# google Bing flickrから収集するver
!pip install icrawler

import os
import shutil
from google.colab import files
from icrawler.builtin import BingImageCrawler, GoogleImageCrawler, FlickrImageCrawler
import time

def download_images_multi_source(keyword, max_images):
    """
    複数のソースから指定枚数になるまで画像をダウンロード
    """
    safe_keyword = keyword.replace(' ', '_')
    output_dir = f"/content/{safe_keyword}_images"
    
    # 既存ディレクトリを削除
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    target_count = int(max_images)
    downloaded_count = 0
    
    # 各ソースからダウンロードする枚数を計算（余裕を持って多めに設定）
    per_source_primary = int(target_count * 0.6) + 15  # Googleから60%
    per_source_secondary = int(target_count * 0.5) + 10  # その他から50%
    
    # ソースのリスト（優先順位順・Baiduを除外してFlickrを追加）
    sources = [
        ("Google", GoogleImageCrawler, per_source_primary),
        ("Bing", BingImageCrawler, per_source_secondary),
        ("Flickr", FlickrImageCrawler, per_source_secondary)
    ]
    
    print(f"'{keyword}' の画像を {target_count} 枚収集します...")
    print("=" * 50)
    
    for source_name, CrawlerClass, fetch_count in sources:
        if downloaded_count >= target_count:
            print(f"\n✓ 目標枚数 {target_count} 枚に到達しました！")
            break
        
        remaining = target_count - downloaded_count
        actual_fetch = min(fetch_count, remaining + 30)  # さらに余裕を持って取得
        
        print(f"\n[{source_name}] から最大 {actual_fetch} 枚取得中...")
        
        try:
            temp_dir = f"{output_dir}/temp_{source_name}"
            os.makedirs(temp_dir, exist_ok=True)
            
            # クローラーの設定（タイムアウトを長めに）
            if source_name == "Flickr":
                # FlickrはAPIキー不要で使用可能
                crawler = CrawlerClass(storage={"root_dir": temp_dir})
            else:
                crawler = CrawlerClass(
                    storage={"root_dir": temp_dir},
                    downloader_threads=4,  # スレッド数を調整
                )
            
            crawler.crawl(keyword=keyword, max_num=actual_fetch)
            
            # 少し待機してファイルシステムの同期を待つ
            time.sleep(1)
            
            # ダウンロードされた画像を確認
            temp_images = [f for f in os.listdir(temp_dir) 
                          if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.webp'))]
            
            print(f"  一時フォルダに {len(temp_images)} 枚ダウンロード完了")
            
            # メインディレクトリに移動（重複チェック付き）
            moved_count = 0
            for idx, img_file in enumerate(temp_images):
                if downloaded_count >= target_count:
                    break
                
                src_path = os.path.join(temp_dir, img_file)
                
                # ファイルサイズチェック（破損ファイルを除外）
                try:
                    file_size = os.path.getsize(src_path)
                    if file_size < 1024:  # 1KB未満は除外
                        continue
                except:
                    continue
                
                # ファイル名を統一形式に変更（重複を避ける）
                ext = os.path.splitext(img_file)[1]
                new_name = f"{safe_keyword}_{downloaded_count + 1:04d}{ext}"
                dst_path = os.path.join(output_dir, new_name)
                
                try:
                    shutil.move(src_path, dst_path)
                    downloaded_count += 1
                    moved_count += 1
                except Exception as e:
                    print(f"  ファイル移動エラー: {e}")
            
            # 一時ディレクトリを削除
            shutil.rmtree(temp_dir)
            
            print(f"  → {moved_count} 枚取得成功 (合計: {downloaded_count}/{target_count})")
            
            # 次のソースまで少し待機
            if downloaded_count < target_count and source_name != sources[-1][0]:
                print(f"  次のソースまで3秒待機...")
                time.sleep(3)
                
        except Exception as e:
            print(f"  → {source_name} でエラー: {e}")
            # 一時ディレクトリがあれば削除
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            continue
    
    # 最終確認
    final_images = [f for f in os.listdir(output_dir) 
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.webp'))]
    
    print("\n" + "=" * 50)
    print(f"収集完了: {len(final_images)} 枚")
    
    if len(final_images) < target_count:
        shortage = target_count - len(final_images)
        print(f"⚠ 目標まであと {shortage} 枚足りませんが、可能な限り収集しました")
        print(f"  達成率: {len(final_images)/target_count*100:.1f}%")
    else:
        print(f"✓ 目標達成！")
    
    # ZIP化してダウンロード
    if len(final_images) > 0:
        zip_path = f"{safe_keyword}_images"
        shutil.make_archive(zip_path, "zip", output_dir)
        files.download(f"{zip_path}.zip")
        
        print(f"\n=== ダウンロード完了 ===")
        print(f"保存先: {output_dir}")
        print(f"総画像数: {len(final_images)} 枚")
        print(f"ZIPファイル: {zip_path}.zip")
    else:
        print("\n⚠ ダウンロードできた画像がありませんでした")
    
    return output_dir, len(final_images)

# メイン実行部分
print("=== 複数ソース対応 画像収集ツール ===")
print("Google, Bing, Flickrから自動的に画像を収集します")
print("=" * 50)

keyword = input('検索キーワードを入力してください: ')
max_images = input('ダウンロードする画像数を入力してください: ')

try:
    output_dir, total_images = download_images_multi_source(keyword, max_images)
    if total_images > 0:
        print(f"\n✓ 画像は '{output_dir}' に保存されました")
    
except Exception as e:
    print(f"\n✗ エラーが発生しました: {e}")
    import traceback
    traceback.print_exc()
    







###################################################################################################################################







# Bingのみ
"""
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
"""
