document.addEventListener('DOMContentLoaded', function() {
    var files = [
        { name: '文件1.txt', url: 'cs.txt', type: 'text/plain' },
        { name: '文件2.jpg', url: '1.jpg', type: 'image/jpeg' },
        { name: '文件3.zip', url: '1.zip', type: 'application/zip' },
        { name: '文件4.gz', url: '1.gz', type: 'application/gzip' },
        { 
            name: '文件夹1', 
            url: '1', 
            type: 'directory',
            children: [
                { name: '子文件1.txt', url: '1/子文件1.txt', type: 'text/plain' },
                { name: '子文件2.jpg', url: '1/子文件2.jpg', type: 'image/jpeg' },
                { name: '应用.apk', url: '1/app.apk', type: 'application/vnd.android.package-archive' }
            ]
        }
        // 更多文件...
    ];

    var fileList = document.getElementById('file-list');

    files.forEach(function(file) {
        var li = document.createElement('li');
        li.innerHTML = '<div class="file-info">' + getIconForType(file.type) + file.name + '</div>';
        if (file.type === 'directory' || file.type === 'application/zip') {
            li.onclick = function() {
                openInNewWindow(file.url, file.type, file.name, file.children);
            };
        } else {
            li.onclick = function() {
                openFileOptions(file.url, file.type, file.name);
            };
        }
        fileList.appendChild(li);
    });

    window.openInNewWindow = openInNewWindow;
    window.getIconForType = getIconForType;
    window.renderZipContents = renderZipContents;
    window.renderFolderContents = renderFolderContents;
    window.downloadFile = downloadFile;
});

function getIconForType(type) {
    switch (type) {
        case 'application/zip':
            return '<span class="icon">&#128196;</span>'; // ZIP 文件图标 🗂️
        case 'application/gzip':
            return '<span class="icon">&#128196;</span>'; // GZIP 文件图标 🗂️
        case 'application/vnd.android.package-archive':
            return '<span class="icon">&#128170;</span>'; // APK 文件图标 📲
        case 'text/plain':
            return '<span class="icon">&#128203;</span>'; // 文本文件图标 📝
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
            return '<span class="icon">&#128247;</span>'; // 图像文件图标 🖼️
        case 'directory':
            return '<svg fill="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon hope-icon hope-c-XNyZK hope-c-PJLV hope-c-PJLV-idBSAKG-css" height="1em" width="1em" style="overflow: visible;"><path d="M496 152a56 56 0 00-56-56H220.11a23.89 23.89 0 01-13.31-4L179 73.41A55.77 55.77 0 00147.89 64H72a56 56 0 00-56 56v48a8 8 0 008 8h464a8 8 0 008-8zM16 392a56 56 0 0056 56h368a56 56 0 0056-56V216a8 8 0 00-8-8H24a8 8 0 00-8 8z"></path></svg>'; // 文件夹图标
        default:
            return '<span class="icon">&#128205;</span>'; // 默认文件图标 📋
    }
}

function openFileOptions(url, type, fileName) {
    var newWindow = window.open('', '_blank');
    newWindow.document.write('<html><head><title>' + fileName + ' 选项</title><link rel="stylesheet" href="styles.css"></head><body class="new-window-body">');
    
    newWindow.document.write('<div class="new-window-header">');
    newWindow.document.write('<div class="new-window-title">' + fileName + '</div>');
    newWindow.document.write('<button class="close-button" onclick="window.close()">关闭</button>');
    newWindow.document.write('</div>');

    newWindow.document.write('<div class="content-container" id="content-container">');
    newWindow.document.write('<p>请选择操作：</p>');
    newWindow.document.write('<div class="action-buttons">');
    newWindow.document.write('<button class="action-button preview-button" onclick="window.opener.openInNewWindow(\'' + url + '\', \'' + type + '\', \'' + fileName + '\')">预览</button>');
    newWindow.document.write('<button class="action-button download-button" onclick="window.opener.downloadFile(\'' + url + '\', \'' + fileName + '\')">下载</button>');
    newWindow.document.write('</div>');
    newWindow.document.write('</div>');
    
    newWindow.document.write('<script>');
    newWindow.document.write('function previewFile(url, type, fileName) {');
    newWindow.document.write('    window.opener.openInNewWindow(url, type, fileName);');
    newWindow.document.write('}');
    newWindow.document.write('function downloadFile(url, fileName) {');
    newWindow.document.write('    var a = window.opener.document.createElement(\'a\');');
    newWindow.document.write('    a.href = url;');
    newWindow.document.write('    a.download = fileName;');
    newWindow.document.write('    window.opener.document.body.appendChild(a);');
    newWindow.document.write('    a.click();');
    newWindow.document.write('    window.opener.document.body.removeChild(a);');
    newWindow.document.write('}');
    newWindow.document.write('<\/script>');

    newWindow.document.write('</body></html>');
}

function openInNewWindow(url, type, fileName, children) {
    var newWindow = window.open('', '_blank');
    newWindow.document.write('<html><head><title>' + fileName + ' 预览</title><link rel="stylesheet" href="styles.css"><script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js"></script></head><body class="new-window-body">');
    
    newWindow.document.write('<div class="new-window-header">');
    newWindow.document.write('<div class="new-window-title">' + fileName + '</div>');
    newWindow.document.write('<button class="close-button" onclick="window.close()">关闭</button>');
    newWindow.document.write('</div>');

    newWindow.document.write('<div class="content-container" id="content-container"></div>');
    newWindow.document.write('<div class="error-message" id="error-message"></div>');
    
    var contentContainer = newWindow.document.getElementById('content-container');
    var errorMessage = newWindow.document.getElementById('error-message');
    
    if (type === 'application/zip') {
        contentContainer.innerHTML += '<h2>ZIP 文件内容</h2>';
        contentContainer.innerHTML += '<ul id="zip-file-list" class="file-list"></ul>';
        
        var zipFileList = newWindow.document.getElementById('zip-file-list');
        var zip = new JSZip();
        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                return response.blob();
            })
            .then(function(blob) {
                return blob.arrayBuffer();
            })
            .then(function(arrayBuffer) {
                return zip.loadAsync(arrayBuffer);
            })
            .then(function(zip) {
                renderZipContents(zip.files, zipFileList, newWindow);
            })
            .catch(function(e) {
                errorMessage.innerHTML = '无法加载 ZIP 文件：' + e.message;
            });
    } else if (type === 'directory') {
        contentContainer.innerHTML += '<h2>文件夹内容</h2>';
        contentContainer.innerHTML += '<ul id="folder-file-list" class="file-list"></ul>';
        
        var folderFileList = newWindow.document.getElementById('folder-file-list');
        renderFolderContents(children, folderFileList, newWindow);
    } else if (type === 'application/gzip') {
        contentContainer.innerHTML += '<h2>GZIP 文件内容</h2>';
        contentContainer.innerHTML += '<pre id="gzip-content"></pre>';
        
        var gzipContent = newWindow.document.getElementById('gzip-content');
        fetch(url)
            .then(function(response) {
                return response.blob();
            })
            .then(function(blob) {
                return blob.arrayBuffer();
            })
            .then(function(data) {
                var inflated = pako.inflate(data);
                var text = new TextDecoder('utf-8').decode(inflated);
                gzipContent.textContent = text;
            })
            .catch(function(e) {
                errorMessage.innerHTML = '无法解压 GZIP 文件：' + e.message;
            });
    } else if (type === 'text/plain') {
        contentContainer.innerHTML += '<h2>文本文件内容</h2>';
        contentContainer.innerHTML += '<pre id="text-content"></pre>';
        
        var textContent = newWindow.document.getElementById('text-content');
        fetch(url)
            .then(function(response) {
                return response.text();
            })
            .then(function(text) {
                textContent.textContent = text;
            })
            .catch(function(e) {
                errorMessage.innerHTML = '无法加载文本文件：' + e.message;
            });
    } else if (type === 'image/jpeg' || type === 'image/png' || type === 'image/gif') {
        contentContainer.innerHTML += '<h2>图像文件预览</h2>';
        contentContainer.innerHTML += '<img id="image-preview" alt="Image Preview">';
        
        var imagePreview = newWindow.document.getElementById('image-preview');
        imagePreview.src = url;
        imagePreview.onerror = function() {
            errorMessage.innerHTML = '无法加载图像文件';
        };
    } else if (type === 'application/pdf') {
        contentContainer.innerHTML += '<h2>PDF 文件预览</h2>';
        contentContainer.innerHTML += '<iframe id="pdf-preview" title="PDF 预览"></iframe>';
        
        var pdfPreview = newWindow.document.getElementById('pdf-preview');
        pdfPreview.src = url;
        pdfPreview.width = '100%';
        pdfPreview.height = '600px'; // 可以根据需要调整高度
        pdfPreview.onerror = function() {
            errorMessage.innerHTML = '无法加载 PDF 文件';
        };
    } else {
        errorMessage.innerHTML = '不支持的文件类型：' + type;
    }
    
    newWindow.document.write('<script>');
    newWindow.document.write('window.openInNewWindow = opener.openInNewWindow;');
    newWindow.document.write('window.getIconForType = opener.getIconForType;');
    newWindow.document.write('window.renderZipContents = opener.renderZipContents;');
    newWindow.document.write('window.renderFolderContents = opener.renderFolderContents;');
    newWindow.document.write('window.downloadFile = opener.downloadFile;');
    newWindow.document.write('<\/script>');

    newWindow.document.write('</body></html>');
}

function renderZipContents(files, container, newWindow) {
    Object.keys(files).forEach(function(relativePath) {
        var entry = files[relativePath];
        var li = newWindow.document.createElement('li');
        li.style.cursor = 'pointer';
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #eee';
        li.style.transition = 'background-color 0.3s';

        if (entry.dir) {
            li.innerHTML = '<div class="file-info">' + getIconForType('directory') + relativePath + '</div>';
            li.onmouseenter = function() {
                this.style.backgroundColor = '#f7f7f7';
            };
            li.onmouseleave = function() {
                this.style.backgroundColor = '';
            };
            li.onclick = function(event) {
                event.stopPropagation();
                openInNewWindow(entry.name, 'directory', entry.name, entry.children);
            };
        } else {
            li.innerHTML = '<div class="file-info">' + getIconForType(entry.name.split('.').pop()) + relativePath.split('/').pop() + '</div>';
            li.onmouseenter = function() {
                this.style.backgroundColor = '#f7f7f7';
            };
            li.onmouseleave = function() {
                this.style.backgroundColor = '';
            };
            li.onclick = function() {
                openFileOptions(entry.url, entry.type, relativePath.split('/').pop());
            };
        }

        container.appendChild(li);
    });
}

function renderFolderContents(files, container, newWindow) {
    files.forEach(function(file) {
        var li = newWindow.document.createElement('li');
        li.style.cursor = 'pointer';
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #eee';
        li.style.transition = 'background-color 0.3s';

        if (file.type === 'directory') {
            li.innerHTML = '<div class="file-info">' + getIconForType('directory') + file.name + '</div>';
            li.onmouseenter = function() {
                this.style.backgroundColor = '#f7f7f7';
            };
            li.onmouseleave = function() {
                this.style.backgroundColor = '';
            };
            li.onclick = function(event) {
                event.stopPropagation();
                openInNewWindow(file.url, file.type, file.name, file.children);
            };
        } else {
            li.innerHTML = '<div class="file-info">' + getIconForType(file.type) + file.name + '</div>';
            li.onmouseenter = function() {
                this.style.backgroundColor = '#f7f7f7';
            };
            li.onmouseleave = function() {
                this.style.backgroundColor = '';
            };
            li.onclick = function() {
                openFileOptions(file.url, file.type, file.name);
            };
        }

        container.appendChild(li);
    });
}

function downloadFile(url, fileName) {
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}