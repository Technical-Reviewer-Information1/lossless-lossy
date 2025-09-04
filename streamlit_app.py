import streamlit as st
import plotly.express as px
from PIL import Image
import io
import gzip
import numpy as np
from typing import Tuple

# ページ設定
st.set_page_config(
    page_title="データの圧縮①可逆圧縮と非可逆圧縮",
    page_icon="🗜️",
    layout="wide"
)

# タイトルとクレジット
st.title("🗜️ データの圧縮①可逆圧縮と非可逆圧縮")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

# 圧縮関数の定義
def compress_text_lossless(text: str) -> Tuple[bytes, float]:
    """テキストの可逆圧縮（gzip）"""
    original_data = text.encode('utf-8')
    compressed_data = gzip.compress(original_data)
    compression_ratio = len(compressed_data) / len(original_data)
    return compressed_data, compression_ratio

def compress_image_lossless(image: Image.Image, original_size: int) -> Tuple[bytes, float]:
    """画像の可逆圧縮（PNG形式）"""
    compressed_buffer = io.BytesIO()
    image.save(compressed_buffer, format='PNG', optimize=True, compress_level=9)
    compressed_size = compressed_buffer.tell()
    
    compression_ratio = compressed_size / original_size
    return compressed_buffer.getvalue(), compression_ratio

def compress_image_lossy(image: Image.Image, quality: int, original_size: int) -> Tuple[bytes, float, Image.Image]:
    """画像の非可逆圧縮（JPEG形式）"""
    compressed_buffer = io.BytesIO()
    image.save(compressed_buffer, format='JPEG', quality=quality, optimize=True)
    compressed_size = compressed_buffer.tell()
    
    # 圧縮後の画像を取得
    compressed_buffer.seek(0)
    compressed_image = Image.open(compressed_buffer)
    
    compression_ratio = compressed_size / original_size
    return compressed_buffer.getvalue(), compression_ratio, compressed_image

def calculate_psnr(img1: Image.Image, img2: Image.Image) -> float:
    """PSNR（Peak Signal-to-Noise Ratio）を計算"""
    arr1 = np.array(img1.convert('RGB'))
    arr2 = np.array(img2.resize(img1.size).convert('RGB'))
    
    mse = np.mean((arr1 - arr2) ** 2)
    if mse == 0:
        return float('inf')
    
    max_pixel = 255.0
    psnr = 20 * np.log10(max_pixel / np.sqrt(mse))
    return psnr

# メイン部分
st.header("📊 データのアップロードと選択")

# データタイプ選択
data_type = st.radio("圧縮するデータの種類を選択してください:", ["テキスト", "画像"])

uploaded_file = None
input_text = ""
use_demo_text = False
use_demo_image = False

if data_type == "テキスト":
    st.subheader("📝 テキスト入力")
    input_text = st.text_area(
        "圧縮したいテキストを入力してください（日本語や英語など、どのような文章でも構いません）:",
        placeholder="例: データ圧縮は、情報を効率的に保存・転送するための重要な技術です。",
        height=150
    )
    
    # デモデータ使用のチェックボックス
    use_demo_text = st.checkbox("📊 デモデータを使用する（サンプルテキストで試したい場合）")
    
    if use_demo_text and not input_text:
        demo_text = """データ圧縮技術の学習教材へようこそ！

この教材では、可逆圧縮と非可逆圧縮の違いを実際に体験することができます。

可逆圧縮（Lossless Compression）は、元のデータを完全に復元できる圧縮方式です。
プログラムのソースコード、テキストファイル、医療画像などの精度が重要なデータに使用されます。
主なアルゴリズムには、Huffman符号化、LZ77、LZ78、Deflate（gzip）などがあります。

非可逆圧縮（Lossy Compression）は、人間が気づかない程度の情報を削除することで高い圧縮率を実現します。
デジタル写真（JPEG）、動画ファイル（H.264、H.265）、音楽ファイル（MP3、AAC）などに広く使用されています。

この体験を通じて、圧縮技術がどのように現代のデジタル社会を支えているかを理解しましょう。
適切な圧縮方式の選択は、データの用途と品質要件によって決まります。"""
        
        input_text = demo_text
        st.text_area("デモテキスト:", demo_text, height=200, disabled=True)
        st.info("💡 このデモテキストを使って圧縮技術を体験できます")
else:
    st.subheader("🖼️ 画像アップロード")
    uploaded_file = st.file_uploader(
        "圧縮したい画像をアップロードしてください:",
        type=['png', 'jpg', 'jpeg'],
        help="PNG、JPEGファイルをサポートしています"
    )
    
    # デモデータ使用のチェックボックス
    use_demo_image = st.checkbox("📊 デモデータを使用する（サンプル画像で試したい場合）")
    
    if use_demo_image and not uploaded_file:
        # デモ用のカラフルなグラデーション画像を生成
        demo_image = Image.new('RGB', (400, 300))
        pixels = []
        for y in range(300):
            for x in range(400):
                r = int((x / 400) * 255)
                g = int((y / 300) * 255)  
                b = int(((x + y) / 700) * 255)
                pixels.append((r, g, b))
        demo_image.putdata(pixels)
        
        # デモ画像を表示
        st.image(demo_image, caption="🎨 デモ用カラフルグラデーション画像", width=300)
        st.info("💡 このデモ画像を使って圧縮技術を体験できます")

# データが準備されている場合のみ処理を続行  
has_text_data = input_text or (data_type == "テキスト" and use_demo_text)
has_image_data = uploaded_file or (data_type == "画像" and use_demo_image)
if (data_type == "テキスト" and has_text_data) or (data_type == "画像" and has_image_data):
    
    st.header("⚙️ 圧縮方式の選択と実行")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🔄 可逆圧縮（Lossless Compression）")
        st.write("✅ データが完全に保持される")
        st.write("📊 圧縮率は控えめ")
        st.write("💡 用途: プログラムファイル、テキスト、医療画像など")
    
    with col2:
        st.subheader("🗜️ 非可逆圧縮（Lossy Compression）")
        st.write("⚠️ データの一部が失われる")
        st.write("📈 高い圧縮率を実現")
        st.write("💡 用途: 写真、動画、音楽ファイルなど")
    
    # データが準備されたら自動的に処理開始
    if data_type == "テキスト":
        # テキストの処理
        original_size = len(input_text.encode('utf-8'))
        compressed_data, lossless_ratio = compress_text_lossless(input_text)
        lossless_size = len(compressed_data)
        
        st.header("📊 ステップ1: 圧縮率の比較")
        
        # 圧縮率の可視化
        sizes_data = {
            '圧縮方式': ['元のテキスト', '可逆圧縮後'],
            'サイズ (bytes)': [original_size, lossless_size],
            'サイズ (KB)': [original_size/1024, lossless_size/1024]
        }
        
        fig = px.bar(
            x=sizes_data['圧縮方式'], 
            y=sizes_data['サイズ (bytes)'],
            title="テキストサイズの比較",
            labels={'x': '圧縮方式', 'y': 'サイズ (bytes)'},
            color=sizes_data['圧縮方式'],
            color_discrete_map={
                '元のテキスト': '#FF6B6B',
                '可逆圧縮後': '#4ECDC4'
            }
        )
        fig.update_layout(showlegend=False, height=400)
        st.plotly_chart(fig, use_container_width=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("元のサイズ", f"{original_size} bytes", f"{original_size/1024:.2f} KB")
        with col2:
            st.metric("可逆圧縮後", f"{lossless_size} bytes", f"{lossless_size/1024:.2f} KB")
        with col3:
            compression_percent = (1 - lossless_ratio) * 100
            st.metric("圧縮率", f"{compression_percent:.1f}%", f"比率: {lossless_ratio:.3f}")
        
        st.header("🔍 ステップ2: データの品質比較")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("🔄 可逆圧縮後のテキスト")
            decompressed_text = gzip.decompress(compressed_data).decode('utf-8')
            st.text_area("復元されたテキスト:", decompressed_text, height=150, disabled=True)
            if input_text == decompressed_text:
                st.success("✅ 元のテキストと完全に一致しています！")
            else:
                st.error("❌ データの不整合が発生しました")
        
        with col2:
            st.subheader("🗜️ 非可逆圧縮について")
            st.warning("⚠️ テキストデータには非可逆圧縮は適用されません")
            st.info("📝 テキストは意味のある情報の集合体のため、一文字でも失われると意味が変わってしまう可能性があります。そのため、テキストには通常、可逆圧縮のみが使用されます。")
    
    else:
        # 画像の処理
        if uploaded_file:
            image = Image.open(uploaded_file)
        elif use_demo_image:
            # デモ用のカラフルなグラデーション画像を再生成
            image = Image.new('RGB', (400, 300))
            pixels = []
            for y in range(300):
                for x in range(400):
                    r = int((x / 400) * 255)
                    g = int((y / 300) * 255)  
                    b = int(((x + y) / 700) * 255)
                    pixels.append((r, g, b))
            image.putdata(pixels)
        
        # 元の画像サイズ（未圧縮のビットマップサイズで計算）
        width, height = image.size
        if image.mode == 'RGB':
            original_size = width * height * 3  # RGB: 3 bytes per pixel
        elif image.mode == 'RGBA':
            original_size = width * height * 4  # RGBA: 4 bytes per pixel
        else:
            original_size = width * height  # グレースケールなど: 1 byte per pixel
        
        # 可逆圧縮
        lossless_data, lossless_ratio = compress_image_lossless(image, original_size)
        lossless_size = len(lossless_data)
        
        # 非可逆圧縮の品質スライダー
        st.header("⚙️ 非可逆圧縮の品質調整")
        
        quality = st.slider(
            "JPEG品質を選択してください（低いほど高圧縮率）:",
            min_value=10, max_value=95, value=50, step=5,
            help="品質を下げると圧縮率は上がりますが、画質が劣化します",
            key='jpeg_quality'
        )
        
        # 非可逆圧縮
        lossy_data, lossy_ratio, lossy_image = compress_image_lossy(image, quality, original_size)
        lossy_size = len(lossy_data)
        
        st.header("📊 ステップ1: 圧縮率の比較")
        
        # 圧縮率の可視化
        sizes_data = {
            '圧縮方式': ['元の画像', '可逆圧縮後', '非可逆圧縮後'],
            'サイズ (bytes)': [original_size, lossless_size, lossy_size],
            'サイズ (MB)': [original_size/(1024*1024), lossless_size/(1024*1024), lossy_size/(1024*1024)]
        }
        
        fig = px.bar(
            x=sizes_data['圧縮方式'], 
            y=sizes_data['サイズ (bytes)'],
            title="画像サイズの比較",
            labels={'x': '圧縮方式', 'y': 'サイズ (bytes)'},
            color=sizes_data['圧縮方式'],
            color_discrete_map={
                '元の画像': '#FF6B6B',
                '可逆圧縮後': '#4ECDC4',
                '非可逆圧縮後': '#45B7D1'
            }
        )
        fig.update_layout(showlegend=False, height=400)
        st.plotly_chart(fig, use_container_width=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("元のサイズ", f"{original_size/1024:.1f} KB", f"{original_size/(1024*1024):.2f} MB")
        with col2:
            st.metric("可逆圧縮後", f"{lossless_size/1024:.1f} KB", f"{lossless_size/(1024*1024):.2f} MB")
            lossless_percent = (1 - lossless_ratio) * 100
            st.caption(f"圧縮率: {lossless_percent:.1f}%")
        with col3:
            st.metric("非可逆圧縮後", f"{lossy_size/1024:.1f} KB", f"{lossy_size/(1024*1024):.2f} MB")
            lossy_percent = (1 - lossy_ratio) * 100
            st.caption(f"圧縮率: {lossy_percent:.1f}%")
        
        st.header("🔍 ステップ2: 画質の比較")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.subheader("🖼️ 元の画像")
            st.image(image, caption="オリジナル", use_container_width=True)
        
        with col2:
            st.subheader("🔄 可逆圧縮後")
            # 可逆圧縮では画質は変わらない
            st.image(image, caption="PNG圧縮（品質劣化なし）", use_container_width=True)
            st.success("✅ 元の画像と完全に同じ品質")
        
        with col3:
            st.subheader("🗜️ 非可逆圧縮後")
            st.image(lossy_image, caption=f"JPEG圧縮（品質{quality}）", use_container_width=True)
            
            # PSNR計算
            psnr_value = calculate_psnr(image, lossy_image)
            if psnr_value != float('inf'):
                st.info(f"📊 PSNR: {psnr_value:.2f} dB")
                if psnr_value > 30:
                    st.success("✅ 高品質（劣化はほとんど見えません）")
                elif psnr_value > 20:
                    st.warning("⚠️ 中品質（わずかに劣化が見えます）")
                else:
                    st.error("❌ 低品質（明らかな劣化があります）")
        
        st.header("🔄 ステップ3: 復元（展開）の概念")
        
        st.info("""
        **🔄 可逆圧縮の復元:**
        - 圧縮されたデータから元のデータを完全に復元可能
        - 情報の損失は一切なし
        - 医療画像や設計図面など、精度が重要な用途に最適
        
        **🗜️ 非可逆圧縮の復元:**
        - 圧縮時に削除されたデータは復元不可能
        - 人間の感覚では気づきにくい部分の情報を削除
        - ファイルサイズを大幅に削減可能
        """)
    
    # まとめセクション
    st.header("📚 まとめと応用")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🔄 可逆圧縮の特徴と用途")
        st.success("""
        **特徴:**
        - データの完全保持
        - 情報損失なし
        - 圧縮率は控えめ
        
        **主な用途:**
        - プログラムのソースコード
        - テキストファイル
        - 医療画像（CTスキャン、MRIなど）
        - 設計図面・CADデータ
        - データベースのバックアップ
        """)
    
    with col2:
        st.subheader("🗜️ 非可逆圧縮の特徴と用途")
        st.info("""
        **特徴:**
        - 高い圧縮率
        - 人間が気づかない程度の情報損失
        - ファイルサイズ大幅削減
        
        **主な用途:**
        - デジタル写真（JPEG）
        - 動画ファイル（MP4、H.264など）
        - 音楽ファイル（MP3、AAC など）
        - ウェブ用画像
        - ストリーミングサービス
        """)
    
    st.success("""
    🎯 **重要なポイント:**
    
    圧縮方式の選択は、**データの用途と許容できる品質レベル**によって決まります。
    - **完全性が必要** → 可逆圧縮を選択
    - **サイズ削減が優先** → 非可逆圧縮を選択
    
    現代のデジタル社会では、この2つの圧縮技術が適材適所で使い分けられています。
    """)

else:
    st.info("👆 データをアップロードまたは入力してください。圧縮の仕組みを体験的に学びましょう！")

# フッター
st.divider()
st.caption("🔬 この教材は、データ圧縮技術の理解を深めるためのインタラクティブな学習ツールです。")