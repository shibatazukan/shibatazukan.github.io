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
from bs4 import BeautifulSoup

class BingImageCrawler:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def search_bing_images(self, keyword, max_images=10):
        """Bing画像検索から画像URLを取得"""
        print(f"Bingで '{keyword}' を検索中...")
        
        image_urls = []
        count = 0
        
        try:
            # Bing画像検索のURL
            search_url = f"https://www.bing.com/images/search?q={quote(keyword)}&form=HDRSC2&first=1&tsc=ImageBasicHover"
            
            response = self.session.get(search_url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 方法1: m属性からJSONを抽出
            img_tags = soup.find_all('a', {'class': 'iusc'})
            
            for img_tag in img_tags:
                if count >= max_images:
                    break
                
                m_attr = img_tag.get('m')
                if m_attr:
                    try:
                        m_json = json.loads(m_attr)
                        img_url = m_json.get('murl') or m_json.get('turl')
                        
                        if img_url and img_url not in image_urls:
                            image_urls.append(img_url)
                            count += 1
                            print(f"  [{count}/{max_images}] 画像URLを取得")
                    except json.JSONDecodeError:
                        continue
            
            # 方法2: imgタグから直接取得（バックアップ）
            if len(image_urls) < max_images:
                img_tags2 = soup.find_all('img', {'class': 'mimg'})
                for img in img_tags2:
                    if count >= max_images:
                        break
                    
                    img_url = img.get('src') or img.get('data-src')
                    if img_url and img_url.startswith('http') and img_url not in image_urls:
                        image_urls.append(img_url)
                        count += 1
                        print(f"  [{count}/{max_images}] 画像URLを取得")
            
            print(f"✓ {len(image_urls)} 件の画像URLを取得しました")
            return image_urls[:max_images]
            
        except Exception as e:
            print(f"✗ 検索エラー: {e}")
            return []
    
    def download_image(self, url, save_path, timeout=15):
        """画像をダウンロード"""
        try:
            response = self.session.get(url, timeout=timeout, stream=True)
            response.raise_for_status()
            
            # Content-Typeから拡張子を判定
            content_type = response.headers.get('content-type', '')
            
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # ファイルサイズチェック（小さすぎる画像は削除）
            if os.path.getsize(save_path) < 1024:  # 1KB未満
                os.remove(save_path)
                return False
            
            return True
            
        except Exception as e:
            print(f"  ✗ ダウンロード失敗: {e}")
            if os.path.exists(save_path):
                os.remove(save_path)
            return False
    
    def get_file_extension(self, url, content_type=''):
        """URLとContent-Typeから適切な拡張子を取得"""
        # URLから拡張子を抽出
        url_lower = url.lower()
        if '.jpg' in url_lower or '.jpeg' in url_lower or 'jpeg' in content_type:
            return 'jpg'
        elif '.png' in url_lower or 'png' in content_type:
            return 'png'
        elif '.gif' in url_lower or 'gif' in content_type:
            return 'gif'
        elif '.webp' in url_lower or 'webp' in content_type:
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
                
                time.sleep(1)  # サーバー負荷軽減（重要）
            
            print(f"✓ {keyword}: {downloaded_count}/{len(image_urls)} 枚ダウンロード完了")
        
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
    keywords_input = input("キーワードを入力: ")
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
    
    print(f"\n✨ ZIPファイルが作成されました: {zip_file}")
    print(f"\n💾 ダウンロード方法:")
    print(f"   1. 左サイドバーのエクスプローラーから '{zip_file}' を右クリック")
    print(f"   2. 'Download...' を選択")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ 中断されました")
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
