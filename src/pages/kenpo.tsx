import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist/types/src/display/api";
import { type RenderTask } from "pdfjs-dist/types/src/display/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

const Kenpo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfPath = "/pdf/日本国憲法.pdf";
  let renderTask: RenderTask | null = null;

  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    void loadingTask.promise.then(async (pdf: PDFDocumentProxy) => {
      const page: PDFPageProxy = await pdf.getPage(1);
      const scale = 1.0;
      const viewport = page.getViewport({ scale });
      const outputScale = window.devicePixelRatio || 1;

      const canvas = canvasRef.current;
      if (canvas && renderTask) {
        renderTask.cancel();
        renderTask = null;
      }

      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

          const renderContext = {
            canvasContext: context,
            viewport,
            ...(transform && { transform: transform }),
          };

          try {
            renderTask = page.render(renderContext);
            await renderTask.promise;
          }catch(e){
            console.log(e);
          }
        }
      }
    });
  }, []);

  return (
    <>
      <div>日本国憲法</div>
      <canvas ref={canvasRef}></canvas>
    </>
  );
};

export default Kenpo;
