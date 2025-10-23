!pip install opencv-python
!pip install numpy

import os
import shutil
import cv2
import numpy as np
from google.colab import files
from google.colab.patches import cv2_imshow
import random
import zipfile

def apply_data_augmentation(image):
    """
    1つの画像に対して5パターンのデータ拡張を適用
    パターン: 明るく、暗く、ノイズ、上下反転、左右反転
    """
    augmented_images = []
    
    # パターン1: 明るく
    bright_img = cv2.convertScaleAbs(image, alpha=1, beta=30)
    augmented_images.append(bright_img)
    
    # パターン2: 暗く
    dark_img = cv2.convertScaleAbs(image, alpha=1, beta=-30)
    augmented_images.append(dark_img)
    
    # パターン3: ノイズ追加
    noise_img = image.copy()
    noise = np.random.normal(0, 100, noise_img.shape).astype(np.int16)
    noise_img = np.clip(noise_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    augmented_images.append(noise_img)
    
    # パターン4: 上下反転
    flip_vertical = cv2.flip(image, 0)
    augmented_images.append(flip_vertical)
    
    # パターン5: 左右反転
    flip_horizontal = cv2.flip(image, 1)
    augmented_images.append(flip_horizontal)
    
    return augmented_images

def augment_uploaded_images(uploaded_files):
    """
    アップロードされた画像に対してデータ拡張を適用
    """
    # 作業ディレクトリを作成
    upload_dir = "/content/uploaded_images"
    output_dir = "/content/augmented_images"
    
    for dir_path in [upload_dir, output_dir]:
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)
        os.makedirs(dir_path, exist_ok=True)
    
    # アップロードされたファイルを保存
    print("アップロードされたファイルを処理中...")
    for filename, content in uploaded_files.items():
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(content)
    
    # 画像ファイルを取得
    image_files = [f for f in os.listdir(upload_dir) 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
    
    if len(image_files) == 0:
        print("エラー: 画像ファイルが見つかりません。")
        return None, 0
    
    print(f"\n{len(image_files)} 枚の画像にデータ拡張を適用します（各画像から5パターン生成）...")
    print("パターン: 明るく、暗く、ノイズ、上下反転、左右反転\n")
    
    total_generated = 0
    for idx, image_file in enumerate(image_files):
        image_path = os.path.join(upload_dir, image_file)
        img = cv2.imread(image_path)
        
        if img is not None:
            # 元画像も保存（高品質JPEG）
            base_name = os.path.splitext(image_file)[0]
            original_path = os.path.join(output_dir, f"{base_name}_original.jpg")
            cv2.imwrite(original_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
            total_generated += 1
            
            # データ拡張画像を生成・保存（高品質JPEG）
            augmented_images = apply_data_augmentation(img)
            pattern_names = ['bright', 'dark', 'noise', 'flip_vertical', 'flip_horizontal']
            
            for aug_idx, aug_img in enumerate(augmented_images):
                aug_path = os.path.join(output_dir, f"{base_name}_{pattern_names[aug_idx]}.jpg")
                cv2.imwrite(aug_path, aug_img, [cv2.IMWRITE_JPEG_QUALITY, 95])
                total_generated += 1
            
            print(f"進行状況: {idx+1}/{len(image_files)} 完了 - {image_file} から6枚生成（元画像+5パターン）")
        else:
            print(f"警告: {image_file} の読み込みに失敗しました。")
    
    print(f"\n=== データ拡張完了 ===")
    print(f"元画像数: {len(image_files)} 枚")
    print(f"拡張後総数: {total_generated} 枚")
    print(f"拡張倍率: {total_generated / len(image_files):.1f}倍")
    
    # ZIP化してダウンロード
    zip_path = "/content/augmented_dataset.zip"
    shutil.make_archive("/content/augmented_dataset", "zip", output_dir)
    files.download(zip_path)
    
    # 作業ディレクトリを削除
    shutil.rmtree(upload_dir)
    
    return output_dir, total_generated

def preview_sample_images(directory, num_samples=3):
    """
    サンプル画像をプレビュー表示
    """
    image_files = [f for f in os.listdir(directory) 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if len(image_files) > 0:
        print(f"\n=== サンプル画像プレビュー ({min(num_samples, len(image_files))} 枚) ===")
        sample_files = random.sample(image_files, min(num_samples, len(image_files)))
        
        for sample_file in sample_files:
            sample_path = os.path.join(directory, sample_file)
            img = cv2.imread(sample_path)
            if img is not None:
                print(f"\nファイル名: {sample_file}")
                print(f"画像サイズ: {img.shape}")
                cv2_imshow(img)

# メイン実行部分
print("=== 画像データ拡張ツール ===")
print("画像ファイルをアップロードしてください（複数選択可能）")
print("対応形式: PNG, JPG, JPEG, BMP, TIFF")
print("\n【拡張パターン】")
print("1. 明るく")
print("2. 暗く")
print("3. ノイズ追加")
print("4. 上下反転")
print("5. 左右反転")
print("※各画像から元画像+5パターン = 計6枚が生成されます\n")

# ファイルアップロード
uploaded = files.upload()

if len(uploaded) == 0:
    print("画像がアップロードされませんでした。")
else:
    try:
        # データ拡張実行
        output_dir, total_images = augment_uploaded_images(uploaded)
        
        if output_dir:
            # サンプル画像プレビュー
            preview_sample_images(output_dir, 3)
            
            print(f"\n=== 完了 ===")
            print(f"拡張画像のZIPファイルがダウンロードされました")
            print(f"総画像数: {total_images} 枚")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
