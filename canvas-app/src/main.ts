import { API, WellKnownSceneUrls } from "@novorender/webgl-api";
// import { createAPI } from "@novorender/webgl-api";

export async function main(api: API, canvas: HTMLCanvasElement) {
  // create a view
  const view = await api.createView(
    { background: { color: [0, 0, 0, 0] } }, // transparent
    canvas
  );

  // provide a camera controller
  view.camera.controller = api.createCameraController({ kind: "turntable" });
  // view.camera.controller = api.createCameraController({ kind: "flight" });

  // load the Condos demo scene
  view.scene = await api.loadScene(WellKnownSceneUrls.condos);
  // view.scene = await api.loadScene("3b5e65560dc4422da5c7c3f827b6a77c");

  // create a bitmap context to display render output
  const ctx = canvas.getContext("bitmaprenderer");

  // main render loop
  while (true) {
    // handle canvas resizes
    const { clientWidth, clientHeight } = canvas;
    view.applySettings({
      display: { width: clientWidth, height: clientHeight },
    });

    // render frame
    const output = await view.render();
    {
      // finalize output image
      const image = await output.getImage();
      if (image) {
        // display in canvas
        ctx?.transferFromImageBitmap(image);
        image.close();
      }
    }
  }
}

// // Assuming this function exists in your code and handles the main render loop
// // Please replace it with your actual implementation
// function run(view: any, canvas: HTMLCanvasElement) {
//   // main render loop
//   while (true) {
//     // handle canvas resizes
//     const { clientWidth, clientHeight } = canvas;
//     view.applySettings({
//       display: { width: clientWidth, height: clientHeight },
//     });

//     // render frame
//     const output = view.render();
//   }
// }

// export async function main({ webglApi, dataJsApi, canvas }: any) {
//   try {
//     const sceneData = await dataJsApi
//       .loadScene("3b5e65560dc4422da5c7c3f827b6a77c")
//       .then((res: any) => {
//         if ("error" in res) {
//           throw res;
//         } else {
//           console.log(res);
//           return res;
//         }
//       });

//     // Destructure relevant properties into variables
//     const { url, db, settings, camera: cameraParams } = sceneData;
//       console.log("sceneData=>>>>>>>>", sceneData)

//     // // initialize webgl api
//     const api = webglApi;

//     // // Load scene
//     const scene = await api.loadScene(url, db);

//     // // Create a view with the scene's saved settings
//     const view = await api.createView(settings, canvas);

//     // // Set resolution scale to 1
//     view.applySettings({ quality: { resolution: { value: 1 } } });

//     // // Create a camera controller with the saved parameters with turntable as fallback
//     const camera = cameraParams ?? ({ kind: "turntable" } as any);
//     view.camera.controller = api.createCameraController(camera, canvas);

//     // // Assign the scene to the view
//     view.scene = scene;

//     // // Run render loop and the resizeObserver
//     run(view, canvas);

    
//   } catch (e) {
//     // Handle errors however you like
//     console.warn(e);
//   }
// }
