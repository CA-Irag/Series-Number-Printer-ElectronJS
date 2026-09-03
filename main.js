const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { pathToFileURL } = require('url');
const fs = require("fs");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 950,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "build", "webimo-icon.ico"),
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools();

  win.webContents.send('app-log', {
    type: 'SYS',
    message: 'Application starting ...',
    timestamp: new Date().toLocaleTimeString(),
  });
}

app.whenReady().then(() => {
  createWindow();
    
  win.webContents.send('app-log', {
    type: 'SYS',
    message: 'Loading window ...',
    timestamp: new Date().toLocaleTimeString(),
  });

  app.on("activate", () => {    
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  setTimeout(() => {
    win.webContents.send('app-log', {
      type: 'OK',
      message: 'Application is now ready',
      timestamp: new Date().toLocaleTimeString(),
    });
  }, 1000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ======================================================
// GET LIST OF PRINTERS
// ======================================================

ipcMain.handle("get-printers", async () => {
  win.webContents.send('app-log', {
    type: 'SYS',
    message: 'Loading system printers ...',
    timestamp: new Date().toLocaleTimeString(),
  });

  return await win.webContents.getPrintersAsync();
});

// ======================================================
// GET LIST OF CUSTOM FONTS
// ======================================================

ipcMain.handle("get-fonts", async () => {
  win.webContents.send('app-log', {
    type: 'SYS',
    message: 'Loading custom fonts ...',
    timestamp: new Date().toLocaleTimeString(),
  });

  const fontsDir = path.join(__dirname, "assets/fonts");

  if (!fs.existsSync(fontsDir)) {
    return [];
  }

  return fs
    .readdirSync(fontsDir)
    .filter((f) => f.toLowerCase().endsWith(".ttf"))
    .map((f) => ({
      name: path.parse(f).name,
      path: `assets/fonts/${f}`,
    }));
});

// ======================================================
// GET LIST OF CORE FONTS
// ======================================================

ipcMain.handle("get-fonts-core", async () => {
  win.webContents.send('app-log', {
    type: 'SYS',
    message: 'Loading core fonts ...',
    timestamp: new Date().toLocaleTimeString(),
  });

  const fontsDir = path.join(__dirname, "assets/fonts-core");

  if (!fs.existsSync(fontsDir)) {
    return [];
  }

  return fs
    .readdirSync(fontsDir)
    .filter((f) => f.toLowerCase().endsWith(".ttf"))
    .map((f) => ({
      name: path.parse(f).name,
      path: `assets/fonts/${f}`,
    }));
});

// ======================================================
// PRINT SERIES NUMBERS
// ======================================================

ipcMain.on("print-numbers", async (event, config) => {
  let printWindow = null;
  let pdfWindow = null;
  let pdfPath = null;

  try {
    console.log("========================================");
    console.log("Starting series number printing");
    console.log("Config:", config);
    console.log("========================================");

    // ==================================================
    // 1. GET FONT PATH
    // ==================================================

    const fontsDir = path.join(__dirname, "assets/fonts");

    function fontFilePath(fontName) {
      if (!fontName) {
        return "";
      }

      // Exact filename
      const candidate = path.join(fontsDir, `${fontName}.ttf`);

      if (fs.existsSync(candidate)) {
        return candidate;
      }

      // Case-insensitive fallback
      if (fs.existsSync(fontsDir)) {
        const files = fs.readdirSync(fontsDir);

        const match = files.find(
          (f) =>
            f.toLowerCase().startsWith(fontName.toLowerCase()) &&
            f.toLowerCase().endsWith(".ttf")
        );

        if (match) {
          return path.join(fontsDir, match);
        }
      }

      return "";
    }

    const font1Abs = fontFilePath(config.font1);
    const font2Abs = fontFilePath(config.font2);

    function fontToDataUrl(fontPath) {
      if (!fontPath || !fs.existsSync(fontPath)) {
        return "";
      }

      const fontData = fs.readFileSync(fontPath).toString("base64");
      return `data:font/ttf;base64,${fontData}`;
    }

    const font1DataUrl = fontToDataUrl(font1Abs);
    const font2DataUrl = fontToDataUrl(font2Abs);

    console.log("Selected Font 1:", config.font1);
    console.log("Font 1 File:", font1Abs);
    console.log("Font 1 Loaded:", !!font1DataUrl);

    console.log("Selected Font 2:", config.font2);
    console.log("Font 2 File:", font2Abs);
    console.log("Font 2 Loaded:", !!font2DataUrl);

    console.log("Font 1:", font1Abs);
    console.log("Font 2:", font2Abs);

    // ==================================================
    // 2. DETERMINE PAGE SIZE
    // ==================================================

    let pageWidth = Number(config.pageWidth);
    let pageHeight = Number(config.pageHeight);

    if (!pageWidth || !pageHeight) {
      throw new Error(
        `Invalid page size: ${config.pageWidth} x ${config.pageHeight}`
      );
    }

    /*
     * config.pageWidth / pageHeight are assumed to be MILLIMETERS.
     *
     * Example:
     *
     * Letter = 215.9 x 279.4 mm
     * Folio  = 215.9 x 330.2 mm
     * A4     = 210 x 297 mm
     */

    /*
     * IMPORTANT:
     *
     * We handle landscape by swapping the physical dimensions.
     *
     * The X/Y coordinates remain relative to the resulting page.
     */
    if (config.orientation === "landscape") {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    console.log("Final PDF page size:");
    console.log(`${pageWidth}mm x ${pageHeight}mm`);
    console.log("Orientation:", config.orientation);

    // ==================================================
    // 3. GENERATE ALL PAGES
    // ==================================================

    const pages = [];

    for (
      let i = Number(config.start1),
        counter = 1;
      counter <= Number(config.iterations);
      i++, counter++
    ) {
      // ----------------------------------------------
      // NUMBER 1
      // ----------------------------------------------

      const num1 =
        (config.prefix1 || "") +
        String(i).padStart(Number(config.digits1) || 0, "0") +
        (config.suffix1 || "");

      // ----------------------------------------------
      // NUMBER 2
      // ----------------------------------------------

      const num2 = config.enableSecond
        ? (config.prefix2 || "") +
          String(
            Number(config.start2) + (i - Number(config.start1))
          ).padStart(Number(config.digits2) || 0, "0") +
          (config.suffix2 || "")
        : "";

      // ----------------------------------------------
      // PAGE
      // ----------------------------------------------

      pages.push(`
        <div class="page">

          <div
            class="number number1"
            style="
              left: ${Number(config.x1) || 0}mm;
              top: ${Number(config.y1) || 0}mm;
              font-size: ${Number(config.fontSize1) || 24}px;
              font-family: '${escapeCssFont(config.font1 || "Arial")}';
              color: ${config.color1 || "red"};
              font-weight: ${config.fontWeight1 || "400"};
              font-style: ${config.fontStyle1 || "normal"};
            "
          >
            ${escapeHtml(num1)}
          </div>

          ${
            config.enableSecond
              ? `
            <div
              class="number number2"
              style="
                left: ${Number(config.x2) || 0}mm;
                top: ${Number(config.y2) || 0}mm;
                font-size: ${Number(config.fontSize2) || 24}px;
                font-family: '${escapeCssFont(config.font2 || "Arial")}';
                color: ${config.color2 || "red"};
                font-weight: ${config.fontWeight2 || "400"};
                font-style: ${config.fontStyle2 || "normal"};
              "
            >
              ${escapeHtml(num2)}
            </div>
            `
              : ""
          }

        </div>
      `);
    }

    // ==================================================
    // 4. CREATE PRINT WINDOW
    // ==================================================

    printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 800,
      webPreferences: {
        sandbox: false,
      },
    });

    // ==================================================
    // 5. CREATE COMPLETE HTML DOCUMENT
    // ==================================================

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <style>

    ${
      font1DataUrl
        ? `
      @font-face {
        font-family: '${escapeCssFont(config.font1)}';
        src: url('${font1DataUrl}') format('truetype');
        font-weight: ${config.fontWeight1 || "400"};
        font-style: ${config.fontStyle1 || "normal"};
        font-display: block;
      }
      `
        : ""
    }

    ${
      font2DataUrl
        ? `
      @font-face {
        font-family: '${escapeCssFont(config.font2)}';
        src: url('${font2DataUrl}') format('truetype');
        font-weight: ${config.fontWeight2 || "400"};
        font-style: ${config.fontStyle2 || "normal"};
        font-display: block;
      }
      `
        : ""
    }

    @page {
      size: ${pageWidth}mm ${pageHeight}mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html {
      margin: 0;
      padding: 0;
      width: ${pageWidth}mm;
    }

    body {
      margin: 0;
      padding: 0;
      width: ${pageWidth}mm;
      background: white;
    }

    .page {
      position: relative;

      width: ${pageWidth}mm;
      height: ${pageHeight}mm;

      margin: 0;
      padding: 0;

      overflow: hidden;

      background: white;

      page-break-after: always;
      break-after: page;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .number {
      position: absolute;

      white-space: nowrap;

      line-height: 1;

      margin: 0;
      padding: 0;

      /*
       * X/Y are now the TOP-LEFT position
       */
      transform: none;
    }

  </style>
</head>

<body>

  ${pages.join("\n")}

  <script>

    (async function() {

      try {

        await document.fonts.ready;

        ${
          config.font1
            ? `
        await document.fonts.load(
          "${Number(config.fontSize1) || 24}px '${escapeJs(
              config.font1
            )}'"
        );
        `
            : ""
        }

        ${
          config.enableSecond && config.font2
            ? `
        await document.fonts.load(
          "${Number(config.fontSize2) || 24}px '${escapeJs(
              config.font2
            )}'"
        );
        `
            : ""
        }

        await new Promise(
          resolve => setTimeout(resolve, 300)
        );

      } catch (error) {

        console.error(
          "Font loading error:",
          error
        );

      }

    })();

  </script>

</body>
</html>
`;

    // ==================================================
    // 6. LOAD HTML
    // ==================================================

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    // ==================================================
    // 7. WAIT FOR DOCUMENT + FONTS
    // ==================================================

    await printWindow.webContents.executeJavaScript(`
      (async () => {
        await document.fonts.ready;

        await new Promise(resolve => setTimeout(resolve, 200));

        return true;
      })()
    `);

    // Additional small delay for Chromium layout
    await new Promise((resolve) => setTimeout(resolve, 200));

    // ==================================================
    // 8. GENERATE ONE PDF
    // ==================================================

    console.log("Generating PDF...");

    win.webContents.send('app-log', {
      type: 'SYS',
      message: 'Generating PDF ...',
      timestamp: new Date().toLocaleTimeString(),
    });

    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,

      /*
       * VERY IMPORTANT:
       *
       * The CSS @page size controls the physical PDF
       * page size.
       *
       * Do NOT specify pageSize here.
       */
      preferCSSPageSize: true,

      margins: {
        marginType: "none",
      },
    });

    // ==================================================
    // 9. SAVE PDF
    // ==================================================

    pdfPath = path.join(
      app.getPath("temp"),
      `series-print-${Date.now()}.pdf`
    );

    fs.writeFileSync(pdfPath, pdfBuffer);

    console.log("----------------------------------------");
    console.log("PDF CREATED");
    console.log("Path:", pdfPath);
    console.log("Pages:", config.iterations);
    console.log(
      "Size:",
      `${pageWidth}mm x ${pageHeight}mm`
    );
    console.log("----------------------------------------");

    win.webContents.send('app-log', {
      type: 'OK',
      message: 'PDF file generated successfully',
      link: {
        text: pdfPath,
        path: pdfPath
      },
      timestamp: new Date().toLocaleTimeString(),
    });

    // ==================================================
    // 10. CREATE PDF WINDOW
    // ==================================================

    // pdfWindow = new BrowserWindow({
    //   show: false,
    //   width: 1000,
    //   height: 1000,
    //   webPreferences: {
    //     sandbox: false,
    //   },
    // });

    // // ==================================================
    // // 11. LOAD PDF
    // // ==================================================

    // await pdfWindow.loadURL(
    //   `file://${pdfPath}`
    // );

    // // ==================================================
    // // 12. WAIT FOR PDF TO FULLY LOAD
    // // ==================================================

    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // // ==================================================
    // // 13. PRINT PDF AS ONE PRINT JOB
    // // ==================================================

    // console.log("Sending PDF to printer...");
    // console.log("Printer:", config.selectedPrinter);

    // await new Promise((resolve, reject) => {

    //   pdfWindow.webContents.print(
    //     {
    //       silent: true,

    //       printBackground: true,

    //       deviceName: config.selectedPrinter,

    //       /*
    //        * IMPORTANT:
    //        *
    //        * DO NOT specify pageSize here.
    //        *
    //        * The PDF already contains the correct
    //        * physical page size.
    //        */
    //     },

    //     (success, failureReason) => {

    //       if (!success) {

    //         reject(
    //           new Error(
    //             failureReason || "Printing failed"
    //           )
    //         );

    //         return;
    //       }

    //       resolve();

    //     }
    //   );

    // });

    // ==================================================
    // 14. SUCCESS
    // ==================================================

    // console.log("----------------------------------------");
    // console.log(
    //   `SUCCESS: ${config.iterations} pages printed as ONE print job.`
    // );
    // console.log("----------------------------------------");

    // ==================================================
    // 15. CLOSE WINDOWS
    // ==================================================

    if (pdfWindow && !pdfWindow.isDestroyed()) {
      pdfWindow.close();
    }

    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.close();
    }

    pdfWindow = null;
    printWindow = null;

    // ==================================================
    // 16. TEMPORARILY KEEP PDF
    // ==================================================

    /*
     * KEEP THE PDF FOR NOW SO YOU CAN INSPECT IT.
     *
     * Once everything is confirmed working, you can
     * uncomment the fs.unlinkSync() section.
     */

    console.log("PDF retained for inspection:");
    console.log(pdfPath);

    /*
    try {
      fs.unlinkSync(pdfPath);
      console.log("Temporary PDF deleted.");
    } catch (err) {
      console.warn(
        "Could not delete temporary PDF:",
        err
      );
    }
    */

  } catch (error) {

    console.error("----------------------------------------");
    console.error("PRINTING ERROR");
    console.error(error);
    console.error("----------------------------------------");

    win.webContents.send('app-log', {
      type: 'ERR',
      message: 'Generating PDF failed',
      timestamp: new Date().toLocaleTimeString(),
    });

    // Close PDF window
    if (
      pdfWindow &&
      !pdfWindow.isDestroyed()
    ) {
      pdfWindow.close();
    }

    // Close print window
    if (
      printWindow &&
      !printWindow.isDestroyed()
    ) {
      printWindow.close();
    }
  }
});

ipcMain.handle('open-pdf', async (event, filePath) => {
  const fileUrl = pathToFileURL(filePath).href;
  console.log('Opening:', fileUrl);
  await shell.openExternal(fileUrl);
});

ipcMain.handle('save-print-config', async (event, config) => {
    const result = await dialog.showSaveDialog({
        title: 'Save Configuration',
        defaultPath: 'simple-form.snpconfig',
        filters: [
            {
                name: 'SNP Config',
                extensions: ['snpconfig']
            },
            {
                name: 'JSON',
                extensions: ['json']
            }
        ]
    });

    if (result.canceled) {
        return { canceled: true };
    }

    try {
        fs.writeFileSync(
            result.filePath,
            JSON.stringify(config, null, 2),
            'utf8'
        );

        win.webContents.send('app-log', {
          type: 'OK',
          message: `Saved new configuration at ${result.filePath}`,
          timestamp: new Date().toLocaleTimeString(),
        });

        return {
            canceled: false,
            filePath: result.filePath
        };

    } catch (error) {
        console.error('Failed to save config:', error);

        win.webContents.send('app-log', {
          type: 'ERR',
          message: `Failed to save configuration`,
          timestamp: new Date().toLocaleTimeString(),
        });

        return {
            canceled: false,
            error: error.message
        };
    }
});


ipcMain.handle('load-print-config', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Open Configuration',
        properties: ['openFile'],
        filters: [
            {
                name: 'SNP Config',
                extensions: ['snpconfig']
            },
            {
                name: 'JSON',
                extensions: ['json']
            }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
    }

    try {
        const filePath = result.filePaths[0];

        const fileContent = fs.readFileSync(
            filePath,
            'utf8'
        );

        const config = JSON.parse(fileContent);

        win.webContents.send('app-log', {
          type: 'OK',
          message: `Loaded configuration at ${filePath}`,
          timestamp: new Date().toLocaleTimeString(),
        });

        return {
            canceled: false,
            filePath,
            config
        };

    } catch (error) {
        console.error('Failed to load config:', error);

        win.webContents.send('app-log', {
          type: 'ERR',
          message: `Failed to load configuration`,
          timestamp: new Date().toLocaleTimeString(),
        });

        return {
            canceled: false,
            error: error.message
        };
    }
});

// ======================================================
// HELPER FUNCTIONS
// ======================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCssFont(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function escapeJs(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
}

function pathToFileUrl(filePath) {
  return `file://${filePath.replace(/\\/g, "/")}`;
}