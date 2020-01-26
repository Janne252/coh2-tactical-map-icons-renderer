export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve as () => void;
        image.onerror = reject;
        image.src = url;     
    });  
}

export function downloadBlob(blob: Blob, filename: string) {
    if (blob != null && navigator.msSaveOrOpenBlob) {
        return navigator.msSaveOrOpenBlob(blob, filename);
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();
    }, 10000);
}

export function fileToByteArray(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const array = new Uint8Array(arrayBuffer);

            resolve(array);
        }
        reader.readAsArrayBuffer(file);
    });
}

export function fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        }
        reader.readAsText(file);
    });
}
