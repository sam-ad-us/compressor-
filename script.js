document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const resizeBtn = document.getElementById('resize-btn');
    const downloadAllBtn = document.getElementById('download-all');
    const previewSection = document.getElementById('preview-section');
    const previewGrid = document.getElementById('preview-grid');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const maintainRatio = document.getElementById('maintain-ratio');
    const scaleInput = document.getElementById('scale');
    const formatSelect = document.getElementById('format');
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const qualityContainer = document.getElementById('quality-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const optionContents = document.querySelectorAll('.option-content');
    
    // Variables
    let files = [];
    let resizedImages = [];
    
    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    resizeBtn.addEventListener('click', resizeImages);
    downloadAllBtn.addEventListener('click', downloadAllImages);
    maintainRatio.addEventListener('change', handleMaintainRatio);
    formatSelect.addEventListener('change', handleFormatChange);
    qualityInput.addEventListener('input', updateQualityValue);
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const option = button.dataset.option;
            optionContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${option}-options`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Functions
    function handleFileSelect(e) {
        files = Array.from(e.target.files);
        updateUI();
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        dropArea.classList.add('highlight');
    }
    
    function handleDragLeave() {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        dropArea.classList.remove('highlight');
        
        if (e.dataTransfer.files.length) {
            files = Array.from(e.dataTransfer.files);
            fileInput.files = e.dataTransfer.files;
            updateUI();
        }
    }
    
    function updateUI() {
        if (files.length > 0) {
            resizeBtn.disabled = false;
            dropArea.querySelector('p').textContent = `${files.length} file(s) selected`;
        } else {
            resizeBtn.disabled = true;
            dropArea.querySelector('p').textContent = 'Drag & drop images here or click to browse';
        }
        
        // Clear previous previews
        previewSection.style.display = 'none';
        previewGrid.innerHTML = '';
        downloadAllBtn.style.display = 'none';
        resizedImages = [];
    }
    
    function handleMaintainRatio() {
        if (maintainRatio.checked) {
            widthInput.addEventListener('input', updateHeightBasedOnWidth);
            heightInput.addEventListener('input', updateWidthBasedOnHeight);
        } else {
            widthInput.removeEventListener('input', updateHeightBasedOnWidth);
            heightInput.removeEventListener('input', updateWidthBasedOnHeight);
        }
    }
    
    function updateHeightBasedOnWidth() {
        if (!widthInput.value) return;
        const ratio = heightInput.dataset.original / widthInput.dataset.original;
        heightInput.value = Math.round(widthInput.value * ratio);
    }
    
    function updateWidthBasedOnHeight() {
        if (!heightInput.value) return;
        const ratio = widthInput.dataset.original / heightInput.dataset.original;
        widthInput.value = Math.round(heightInput.value * ratio);
    }
    
    function handleFormatChange() {
        if (formatSelect.value === 'jpg' || formatSelect.value === 'webp') {
            qualityContainer.style.display = 'block';
        } else {
            qualityContainer.style.display = 'none';
        }
    }
    
    function updateQualityValue() {
        qualityValue.textContent = qualityInput.value;
    }
    
    function resizeImages() {
        if (files.length === 0) return;
        
        resizedImages = [];
        previewGrid.innerHTML = '';
        
        const activeTab = document.querySelector('.tab-btn.active').dataset.option;
        const outputFormat = formatSelect.value;
        const quality = qualityInput.value / 100;
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Store original dimensions
                    widthInput.dataset.original = img.width;
                    heightInput.dataset.original = img.height;
                    
                    let newWidth, newHeight;
                    
                    if (activeTab === 'dimensions') {
                        newWidth = widthInput.value ? parseInt(widthInput.value) : img.width;
                        newHeight = heightInput.value ? parseInt(heightInput.value) : img.height;
                        
                        if (maintainRatio.checked) {
                            const ratio = img.width / img.height;
                            if (widthInput.value && !heightInput.value) {
                                newHeight = Math.round(newWidth / ratio);
                            } else if (!widthInput.value && heightInput.value) {
                                newWidth = Math.round(newHeight * ratio);
                            } else if (widthInput.value && heightInput.value) {
                                // Use the dimension that requires less scaling
                                const widthRatio = newWidth / img.width;
                                const heightRatio = newHeight / img.height;
                                
                                if (widthRatio < heightRatio) {
                                    newHeight = Math.round(newWidth / ratio);
                                } else {
                                    newWidth = Math.round(newHeight * ratio);
                                }
                            }
                        }
                    } else {
                        const scale = parseInt(scaleInput.value) / 100;
                        newWidth = Math.round(img.width * scale);
                        newHeight = Math.round(img.height * scale);
                    }
                    
                    // Create canvas and resize
                    const canvas = document.createElement('canvas');
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // Get the resized image data
                    let mimeType;
                    switch (outputFormat) {
                        case 'jpg':
                            mimeType = 'image/jpeg';
                            break;
                        case 'png':
                            mimeType = 'image/png';
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            break;
                        default:
                            // Use original format
                            mimeType = file.type;
                    }
                    
                    canvas.toBlob(function(blob) {
                        const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.' + (outputFormat === 'original' ? file.name.split('.').pop() : outputFormat), {
                            type: mimeType
                        });
                        
                        resizedImages.push({
                            original: file,
                            resized: resizedFile,
                            url: URL.createObjectURL(resizedFile)
                        });
                        
                        // Create preview
                        createPreview(resizedFile, index);
                        
                        // If all images are processed, show preview section
                        if (resizedImages.length === files.length) {
                            previewSection.style.display = 'block';
                            if (resizedImages.length > 1) {
                                downloadAllBtn.style.display = 'inline-block';
                            }
                        }
                    }, mimeType, outputFormat === 'jpg' || outputFormat === 'webp' ? quality : 1);
                };
                
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    function createPreview(file, index) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            previewItem.innerHTML = `
                <img src="${e.target.result}" class="preview-img" alt="Resized preview">
                <div class="preview-info">
                    <p class="preview-name">${file.name}</p>
                    <p class="preview-size">${formatFileSize(file.size)}</p>
                    <a href="#" class="download-btn" data-index="${index}">Download</a>
                </div>
            `;
            
            previewGrid.appendChild(previewItem);
            
            // Add download event listener
            previewItem.querySelector('.download-btn').addEventListener('click', function(e) {
                e.preventDefault();
                downloadImage(index);
            });
        };
        
        reader.readAsDataURL(file);
    }
    
    function downloadImage(index) {
        const a = document.createElement('a');
        a.href = resizedImages[index].url;
        a.download = resizedImages[index].resized.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function downloadAllImages() {
        resizedImages.forEach((image, index) => {
            // Small delay to prevent browser blocking multiple downloads
            setTimeout(() => {
                downloadImage(index);
            }, index * 200);
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Initialize
    handleFormatChange();
    updateQualityValue();
});
