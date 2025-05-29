window.addEventListener('DOMContentLoaded', function () {
  document.getElementById("today-date").value = new Date().toISOString().split('T')[0];

  setupDropZone('docxZone', 'meisai_file', 'docx-name', 'remove-docx', 'docx-display');
  setupDropZone('pdfZone', 'zumen_file', 'pdf-name', 'remove-pdf', 'pdf-display');

  const form = document.getElementById('upload-form');
  const statusDiv = document.getElementById('analysis-status');
  const progressBar = document.getElementById('progress-bar');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    await new Promise(resolve => setTimeout(resolve, 300));

    const meisaiFile = document.getElementById('meisai_file').files[0];
    const zumenFile = document.getElementById('zumen_file').files[0];
    const shoinId = document.getElementById('shoin_id').value.trim();
    const seiriNo = document.getElementById('seiri_no').value.trim();
    const date = new Date().toISOString().slice(0, 10);

    if (!shoinId || !seiriNo || !meisaiFile) {
      alert('❗ 必須項目（所員ID・整理番号・明細書ファイル）をすべて入力してください。');
      return;
    }

    statusDiv.style.display = 'block';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress > 100) progress = 0;
      progressBar.style.width = progress + "%";
    }, 200);

    const formData = new FormData();
    formData.append('shoin_id', shoinId);
    formData.append('seiri_no', seiriNo);
    formData.append('meisai', meisaiFile);
    if (zumenFile) formData.append('zumen', zumenFile);
    formData.append('date', date);

    try {
      // 👇 ここを Make Webhook から Relay Server に変更！
      const response = await fetch('https://relay-server-v10.onrender.com/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
    // 追加：CORS対策の明示的な対話用ヘッダー
    'Accept': 'application/json'
      }
    });

      const resultText = await response.text();
      clearInterval(interval);

      const recordId = resultText.trim();
      if (response.ok && recordId.startsWith('rec')) {
        window.location.href = `result.html?id=${recordId}`;
      } else {
        alert('❌ 予期しないレスポンスです:\n' + resultText);
      }

    } catch (error) {
      clearInterval(interval);
      console.error('通信エラー:', error);
      alert('⚠️ ネットワークエラーが発生しました。再度お試しください。');
    }
  });
});

function setupDropZone(zoneId, inputId, nameId, removeId, displayId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const name = document.getElementById(nameId);
  const remove = document.getElementById(removeId);
  const display = document.getElementById(displayId);
  const placeholder = zone.querySelector('.placeholder');

  function updateDisplay() {
    if (input.files.length > 0) {
      name.textContent = input.files[0].name;
      display.style.display = 'flex';
      placeholder.style.display = 'none';
    } else {
      display.style.display = 'none';
      placeholder.style.display = 'block';
    }
  }

  zone.addEventListener('click', () => {
    if (input.files.length > 0) return;
    input.click();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.backgroundColor = '#444';
  });

  zone.addEventListener('dragleave', () => {
    zone.style.backgroundColor = '#333';
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.backgroundColor = '#333';

    if (input.files.length > 0) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
    updateDisplay();
  });

  input.addEventListener('change', updateDisplay);

  remove.addEventListener('click', () => {
    input.value = '';
    updateDisplay();
  });
}
