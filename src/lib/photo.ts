/**
 * Foto escolhida → quadrado de 256px (corte central), JPEG ~25KB, guardado no próprio
 * documento do perfil — sem Storage (porta de pgResizePhoto em wiki-core.js, arvore).
 */
export function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      cv.getContext("2d")!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem"));
    };
    img.src = url;
  });
}
