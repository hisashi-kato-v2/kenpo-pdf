import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist/types/src/display/api";
import {
  type RenderTask,
  type TextItem,
} from "pdfjs-dist/types/src/display/api";
import { renderTextLayer } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

const Kenpo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfText, setPdfText] = useState("");
  const pdfPath = "/pdf/日本国憲法.pdf";
  let renderTask: RenderTask | null = null;

  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    void loadingTask.promise.then(async (pdf: PDFDocumentProxy) => {
      const page: PDFPageProxy = await pdf.getPage(1);
      const scale = 1.0;
      const viewport = page.getViewport({ scale });
      const outputScale = window.devicePixelRatio || 1;

      const textLayerDiv = document.getElementById("textLayer");
      const textContent = await page.getTextContent();

      const canvas = canvasRef.current;
      if (canvas && renderTask) {
        renderTask.cancel();
        renderTask = null;
      }

      // テキストレイヤーのレンダリング
      // TODO:各ノードは現状1文字など区切りがバラバラなため文字列に対してアンダーラインが引けない
      if (textLayerDiv) {
        const textLayerRenderTask = renderTextLayer({
          textContentSource: textContent, // テキストコンテンツの指定
          container: textLayerDiv, // コンテナ要素
          viewport: viewport, // ビューポート
        });
        await textLayerRenderTask.promise;
        const textLayerNodes = await document.querySelectorAll("#textLayer");
        textLayerNodes.forEach((node) => {
          console.log(node);
          node.querySelectorAll("span").forEach((span) => {
            if (span.textContent?.includes("国")) {
              span.classList.add("bg-yellow-200");
            }
          });
        });
      }

      // キャンバスへの描画
      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const transform =
            outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

          const renderContext = {
            canvasContext: context,
            viewport,
            ...(transform && { transform: transform }),
          };

          try {
            renderTask = page.render(renderContext);
            await renderTask.promise;

            // テキストコンテンツの取得
            await getPdfText();
          } catch (e) {
            console.log(e);
          }
        }
      }

      async function getPdfText() {
        const textContent = await page.getTextContent();
        const textItems = textContent.items
          .filter((item): item is TextItem => "str" in item)
          .map((item) => item.str)
          .join(" ");
        setPdfText(textItems);
        console.log(textItems);
      }
    });
  }, []);

  return (
    <div id="pdf-container">
      {/* <canvas ref={canvasRef}></canvas> */}
      <div
        id="textLayer"
        style={{ position: "absolute", left: 0, top: 0 }}
      ></div>
    </div>
  );
};

export default Kenpo;
