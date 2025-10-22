import os
import requests
import time
import zipfile
from pathlib import Path
from datetime import datetime
from urllib.parse import quote, urljoin
import hashlib
import json
import re

class BingImageCrawler:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def search_bing_images(self, keyword, max_images=10):
        """Bing画像検索から画像URLを取得（改善版）"""
        print(f"Bingで '{keyword}' を検索中...")
        
        image_urls = []
        
        try:
            # Bing画像検索のURL（シンプル版）
            search_url = f"https://www.bing.com/images/search?q={quote(keyword)}&first=1"
            
            print(f"  アクセス中: {search_url}")
            
            # gzip圧縮を明示的に処理
            response = self.session.get(search_url, timeout=15)
            response.raise_for_status()
            
            # レスポンスが正しくデコードされているか確認
            content = response.text
            
            # デバッグ: レスポンスの一部を確認
            print(f"  レスポンスサイズ: {len(content)} 文字")
            
            # HTMLが正しく取得できているかチェック
            if not content or len(content) < 1000 or '<html' not in content.lower():
                print(f"  ⚠ 警告: HTMLが正しく取得できませんでした")
                # デバッグ情報
                print(f"  Content-Encoding: {response.headers.get('Content-Encoding', 'なし')}")
                print(f"  Content-Type: {response.headers.get('Content-Type', 'なし')}")
                return []
            
            # 正規表現で画像URLを抽出
            # 方法1: murl (高解像度画像URL)
            pattern1 = r'"murl":"(https?://[^"]+)"'
            matches1 = re.findall(pattern1, content)
            
            # 方法2: turl (サムネイル画像URL)
            pattern2 = r'"turl":"(https?://[^"]+)"'
            matches2 = re.findall(pattern2, content)
            
            # 方法3: imgurl
            pattern3 = r'"imgurl":"(https?://[^"]+)"'
            matches3 = re.findall(pattern3, content)
            
            # 方法4: mediaurl
            pattern4 = r'"mediaurl":"(https?://[^"]+)"'
            matches4 = re.findall(pattern4, content)
            
            # すべてのURLを結合（優先順位: murl > mediaurl > imgurl > turl）
            all_urls = matches1 + matches4 + matches3 + matches2
            
            print(f"  検出された画像URL候補数: {len(all_urls)}")
            
            # 重複を除去して追加
            seen = set()
            for url in all_urls:
                if url not in seen and url.startswith('http'):
                    # エスケープ文字をデコード
                    url = url.replace('\\u002f', '/').replace('\\/', '/').replace('\\u003d', '=').replace('\\u0026', '&')
                    
                    # 有効な画像URLかチェック
                    if any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']) or 'image' in url.lower():
                        seen.add(url)
                        image_urls.append(url)
                        print(f"  [{len(image_urls)}/{max_images}] 画像URLを取得")
                        
                        if len(image_urls) >= max_images:
                            break
            
            # まだ足りない場合は、より広範囲に検索
            if len(image_urls) < max_images:
                print(f"  追加検索中...")
                pattern_general = r'(https?://[^"\s\\]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^"\s\\]*)?)'
                matches_general = re.findall(pattern_general, content, re.IGNORECASE)
                
                for url in matches_general:
                    url_clean = url.replace('\\/', '/').replace('\\u002f', '/')
                    if url_clean not in seen and len(image_urls) < max_images:
                        seen.add(url_clean)
                        image_urls.append(url_clean)
                        print(f"  [{len(image_urls)}/{max_images}] 画像URLを取得")
            
            if len(image_urls) == 0:
                print(f"  ⚠ デバッグ: レスポンスの最初の500文字:")
                print(f"  {content[:500]}")
            
            print(f"✓ {len(image_urls)} 件の画像URLを取得しました")
            return image_urls[:max_images]
            
        except Exception as e:
            print(f"✗ 検索エラー: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def download_image(self, url, save_path, timeout=15):
        """画像をダウンロード"""
        try:
            # URLをクリーンアップ
            url = url.replace('\\u002f', '/').replace('\\/', '/')
            
            response = self.session.get(url, timeout=timeout, stream=True)
            response.raise_for_status()
            
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # ファイルサイズチェック（小さすぎる画像は削除）
            file_size = os.path.getsize(save_path)
            if file_size < 1024:  # 1KB未満
                os.remove(save_path)
                return False
            
            return True
            
        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            return False
    
    def get_file_extension(self, url):
        """URLから適切な拡張子を取得"""
        url_lower = url.lower()
        if '.jpg' in url_lower or '.jpeg' in url_lower:
            return 'jpg'
        elif '.png' in url_lower:
            return 'png'
        elif '.gif' in url_lower:
            return 'gif'
        elif '.webp' in url_lower:
            return 'webp'
        else:
            return 'jpg'  # デフォルト
    
    def crawl(self, keywords, max_images_per_keyword=10, output_dir="downloads"):
        """複数キーワードで画像をクロール"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_dir = Path(output_dir) / f"temp_{timestamp}"
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        total_downloaded = 0
        
        for keyword in keywords:
            print(f"\n{'='*60}")
            print(f"📸 キーワード: {keyword}")
            print(f"{'='*60}")
            
            # キーワード用のディレクトリ作成
            safe_keyword = re.sub(r'[\\/*?:"<>|]', '_', keyword)
            keyword_dir = temp_dir / safe_keyword
            keyword_dir.mkdir(exist_ok=True)
            
            # 画像URLを検索
            image_urls = self.search_bing_images(keyword, max_images_per_keyword)
            
            if not image_urls:
                print(f"⚠ '{keyword}' の画像が見つかりませんでした")
                print(f"  ヒント: キーワードを変更してみてください（例: 'クワガタ 昆虫'）")
                continue
            
            # 画像をダウンロード
            downloaded_count = 0
            for idx, url in enumerate(image_urls, 1):
                ext = self.get_file_extension(url)
                save_path = keyword_dir / f"{safe_keyword}_{idx:03d}.{ext}"
                
                print(f"  [{idx}/{len(image_urls)}] ダウンロード中...", end=' ')
                
                if self.download_image(url, save_path):
                    print(f"✓ {save_path.name}")
                    downloaded_count += 1
                    total_downloaded += 1
                else:
                    print(f"✗ スキップ")
                
                time.sleep(0.8)  # サーバー負荷軽減
            
            print(f"✓ {keyword}: {downloaded_count}/{len(image_urls)} 枚ダウンロード完了")
        
        if total_downloaded == 0:
            print(f"\n⚠ 警告: 画像が1枚もダウンロードできませんでした")
            print(f"  一時ディレクトリを削除します")
            import shutil
            shutil.rmtree(temp_dir)
            return None
        
        # ZIPファイルを作成
        zip_filename = f"{output_dir}/bing_images_{timestamp}.zip"
        print(f"\n{'='*60}")
        print(f"📦 ZIPファイル作成中: {zip_filename}")
        print(f"{'='*60}")
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in temp_dir.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(temp_dir)
                    zipf.write(file_path, arcname)
                    print(f"  追加: {arcname}")
        
        # 一時ディレクトリを削除
        import shutil
        shutil.rmtree(temp_dir)
        
        print(f"\n{'='*60}")
        print(f"✅ 完了!")
        print(f"{'='*60}")
        print(f"合計ダウンロード数: {total_downloaded} 枚")
        print(f"保存先: {zip_filename}")
        print(f"ファイルサイズ: {os.path.getsize(zip_filename) / 1024 / 1024:.2f} MB")
        print(f"{'='*60}")
        
        return zip_filename


def main():
    print("="*60)
    print("🔍 Bing画像クローリングプログラム")
    print("="*60)
    
    # キーワード入力
    print("\n💡 ヒント: 複数キーワードはカンマ区切りで入力")
    print("   例: クワガタ, カブトムシ, 昆虫")
    keywords_input = input("\nキーワードを入力: ")
    keywords = [k.strip() for k in keywords_input.split(',') if k.strip()]
    
    if not keywords:
        print("❌ エラー: キーワードを入力してください")
        return
    
    # 画像枚数入力
    try:
        max_images_input = input(f"各キーワードごとの画像枚数 (デフォルト: 10): ").strip()
        max_images = int(max_images_input) if max_images_input else 10
    except ValueError:
        print("⚠ 無効な数値です。デフォルト値10を使用します")
        max_images = 10
    
    # 出力ディレクトリ
    output_dir = input("出力ディレクトリ (デフォルト: downloads): ").strip() or "downloads"
    
    print(f"\n{'='*60}")
    print(f"📋 設定確認")
    print(f"{'='*60}")
    print(f"  キーワード: {', '.join(keywords)}")
    print(f"  各キーワードの画像枚数: {max_images}")
    print(f"  出力ディレクトリ: {output_dir}")
    print(f"{'='*60}\n")
    
    input("Enterキーを押して開始...")
    
    # クローリング実行
    crawler = BingImageCrawler()
    zip_file = crawler.crawl(keywords, max_images, output_dir)
    
    if zip_file:
        print(f"\n✨ ZIPファイルが作成されました: {zip_file}")
        print(f"\n💾 ダウンロード方法:")
        print(f"   1. 左サイドバーのエクスプローラーから '{zip_file}' を右クリック")
        print(f"   2. 'Download...' を選択")
    else:
        print(f"\n❌ ZIPファイルを作成できませんでした")
        print(f"\n💡 トラブルシューティング:")
        print(f"   - キーワードを変更してみてください")
        print(f"   - より具体的なキーワードを使用してください（例: 'クワガタ 昆虫'）")
        print(f"   - インターネット接続を確認してください")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ 中断されました")
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
