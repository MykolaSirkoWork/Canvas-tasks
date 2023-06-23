import React, { useEffect, useRef } from "react";
import { createAPI } from "@novorender/webgl-api";
import { main } from "../main";

const CanvasComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const api = createAPI({
        scriptBaseUrl: `${window.location.origin}/novorender/webgl-api/`,
        // serviceUrl: "https://data.novorender.com/api",
      });
      main(api, canvas);
    }
  }, []);

  return <canvas ref={canvasRef} id="canvas" />;
};

export default CanvasComponent;

// import React, { useEffect, useRef } from "react";
// import { createAPI as createWebglAPI } from "@novorender/webgl-api";
// import { createAPI as createDataJsAPI } from "@novorender/data-js-api"; // Assuming this is how you import the dataJsApi
// import { main } from "../main";

// const CanvasComponent: React.FC = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const webglApi = createWebglAPI({
//         scriptBaseUrl: `${window.location.origin}/novorender/webgl-api/`,
//       });

//       const dataJsApi = createDataJsAPI({
//         serviceUrl: "https://data.novorender.com/api",
//       });

//       main({ webglApi, dataJsApi, canvas });
//     }
//   }, []);

//   return <canvas ref={canvasRef} id="canvas" />;
// };

// export default CanvasComponent;
