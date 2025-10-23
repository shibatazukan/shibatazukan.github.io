!pip install -q onnxruntime
!pip install -q rembg[gpu]
!pip install -q opencv-python
!pip install -q numpy
!pip install -q Pillow

import os
import shutil
import cv2
import numpy as np
from google.colab import files
from google.colab.patches import cv2_imshow
from PIL import Image
from rembg import remove, new_session
import io

def remove_background_high_precision(image_path, bg_color='gray', session=None):
    """
    高精度背景除去（u2net_human_segモデル使用）
    """
    bg_colors = {
        'white': (255, 255, 255),
        'gray': (128, 128, 128),
        'black': (0, 0, 0),
        'green': (0, 177, 64)
    }
    
    try:
        with open(image_path, 'rb') as f:
            input_image = f.read()
        
        # より高精度なモデルで背景除去
        if session:
            output_image = remove(input_image, session=session)
        else:
            output_image = remove(input_image)
        
        img_pil = Image.open(io.BytesIO(output_image))
        
        if img_pil.mode == 'RGBA':
            # アルファチャンネルの閾値処理で精度向上
            alpha = np.array(img_pil.split()[3])
            alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
            _, alpha = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
            
            # 小さなノイズを除去
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, kernel)
            alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
            
            # 新しい背景を作成
            bg = Image.new('RGB', img_pil.size, bg_colors[bg_color])
            img_rgb = img_pil.convert('RGB')
            
            # アルファブレンディング
            alpha_pil = Image.fromarray(alpha)
            bg.paste(img_rgb, mask=alpha_pil)
            
            result = cv2.cvtColor(np.array(bg), cv2.COLOR_RGB2BGR)
        else:
            result = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
        
        return result
    
    except Exception as e:
        print(f"  エラー: {e}")
        img = cv2.imread(image_path)
        return img if img is not None else None

def process_images(uploaded_files, bg_color='gray', use_human_model=True):
    """
    画像処理メイン関数
    """
    upload_dir = "/content/uploaded_images"
    output_dir = "/content/processed_images"
    
    for dir_path in [upload_dir, output_dir]:
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
        os.makedirs(dir_path, exist_ok=True)
    
    for filename, content in uploaded_files.items():
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(content)
    
    image_files = [f for f in os.listdir(upload_dir) 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
    
    if len(image_files) == 0:
        print("画像ファイルが見つかりません")
        return None, 0
    
    # 高精度モデルセッション作成
    session = None
    if use_human_model:
        try:
            print("高精度モデル(u2net_human_seg)を読み込み中...")
            session = new_session("u2net_human_seg")
        except:
            print("標準モデル(u2net)を使用")
            session = new_session("u2net")
    
    print(f"処理開始: {len(image_files)}枚 | 背景色: {bg_color}\n")
    
    total = 0
    for idx, image_file in enumerate(image_files):
        image_path = os.path.join(upload_dir, image_file)
        print(f"[{idx+1}/{len(image_files)}] {image_file}")
        
        processed = remove_background_high_precision(image_path, bg_color, session)
        
        if processed is not None:
            base_name = os.path.splitext(image_file)[0]
            output_path = os.path.join(output_dir, f"{base_name}_nobg.jpg")
            cv2.imwrite(output_path, processed, [cv2.IMWRITE_JPEG_QUALITY, 95])
            total += 1
    
    print(f"\n処理完了: {total}枚")
    
    zip_path = "/content/processed_images.zip"
    shutil.make_archive("/content/processed_images", "zip", output_dir)
    files.download(zip_path)
    
    shutil.rmtree(upload_dir)
    
    return output_dir, total

# 実行
print("=" * 50)
print("AI背景除去")
print("=" * 50)
print("\n背景色: 1)gray 2)white 3)black 4)green")

bg_choice = input("選択 (1-4, Enter=1): ").strip()
bg_map = {'1': 'gray', '2': 'white', '3': 'black', '4': 'green', '': 'gray'}
bg_color = bg_map.get(bg_choice, 'gray')

model_choice = input("人物用高精度モデル使用? (y/n, Enter=y): ").strip().lower()
use_human = model_choice != 'n'

print(f"\n設定: 背景={bg_color} | 人物モデル={'有効' if use_human else '無効'}")
print("\n画像をアップロード:\n")

uploaded = files.upload()

if len(uploaded) > 0:
    output_dir, total = process_images(uploaded, bg_color, use_human)
    if output_dir:
        print(f"\nZIPダウンロード完了: {total}枚")
else:
    print("画像がアップロードされませんでした")
