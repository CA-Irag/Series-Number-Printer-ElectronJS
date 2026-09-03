const fontPreviews = [document.getElementById("fontPreview1"), document.getElementById("fontPreview2")];
const prefixPreviews = [document.getElementById("prefixPreview1"), document.getElementById("prefixPreview2")];
const startPreviews = [document.getElementById("startPreview1"), document.getElementById("startPreview2")];
const suffixPreviews = [document.getElementById("suffixPreview1"), document.getElementById("suffixPreview2")];
const panelSecondNumber = document.getElementById("panelSecondNumber");
let currentEnableSecondValue = false;
let numberCurrentPreviewValues = [
  { // First Number
    start: "",
    digits: "",
    prefix: "",
    suffix: "",
    fontSize: "",
    font: "",
    color: "",
    fontWeight: "",
    fontStyle: "",
  },
  { // Second Number
    start: "",
    digits: "",
    prefix: "",
    suffix: "",
    fontSize: "",
    font: "",
    color: "",
    fontWeight: "",
    fontStyle: "",
  }
];

function updatePrefixPreview(idx) {
  prefixPreviews[idx].innerText = numberCurrentPreviewValues[idx].prefix;
}

function updateStartPreview(idx) {
  startPreviews[idx].innerText = String(numberCurrentPreviewValues[idx].start).padStart(numberCurrentPreviewValues[idx].digits, "0");
}

function updateSuffixPreview(idx) {
  suffixPreviews[idx].innerText = numberCurrentPreviewValues[idx].suffix;
}


function updateFontPreview(idx) {
  fontPreviews[idx].style.fontFamily = numberCurrentPreviewValues[idx].font;
  fontPreviews[idx].style.fontSize = numberCurrentPreviewValues[idx].fontSize;
  fontPreviews[idx].style.fontWeight = numberCurrentPreviewValues[idx].fontWeight;
  fontPreviews[idx].style.fontStyle = numberCurrentPreviewValues[idx].fontStyle;
  fontPreviews[idx].style.color = numberCurrentPreviewValues[idx].color;
}

function updateEnableSecondBox() {
  if (currentEnableSecondValue) {
    panelSecondNumber.classList.remove('panel-disabled');
  } else {
    panelSecondNumber.classList.add('panel-disabled');
  }
}

async function loadPrinters() {
  const printers = await window.api.getPrinters();

  const select = document.getElementById("printerSelect");

  printers.forEach(printer => {
    const option = document.createElement('option');

    option.value = printer.name;
    option.textContent = printer.isDefault
      ? `${printer.name} (Default)`
      : printer.name;

    select.appendChild(option);
  });
}

async function loadFontsCore() {
  const fonts = await window.api.getFontsCore();

  // Inject @font-face dynamically
  const style = document.createElement("style");
  fonts.forEach(f => {
    style.innerHTML += `
      @font-face {
        font-family: '${f.name}';
        src: url('${f.path}');
      }
    `;
  });
  document.head.appendChild(style);
}

async function loadFonts() {
  const fonts = await window.api.getFonts();
  const fontSelects = [document.getElementById("font1"), document.getElementById("font2")];

  // Inject @font-face dynamically
  const style = document.createElement("style");
  fonts.forEach(f => {
    style.innerHTML += `
      @font-face {
        font-family: '${f.name}';
        src: url('${f.path}');
      }
    `;
  });
  document.head.appendChild(style);

  // Populate font dropdowns
  fontSelects.forEach((select, idx) => {
    select.innerHTML = "";
    fonts.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.name;
      opt.textContent = f.name;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      numberCurrentPreviewValues[idx].font = select.value;
      updateFontPreview(idx);
    });
    // set default preview
    numberCurrentPreviewValues[idx].font = fonts[0]?.name || "sans-serif";
    updateFontPreview(idx);
  });
}

function loadPageSettings() {
  const pageSize = document.getElementById("pageSize");
  const pageWidth = document.getElementById("pageWidth");
  const pageHeight = document.getElementById("pageHeight");

  const pageSizeMap = {
    letter: { width: 216, height: 279 },
    folio: { width: 216, height: 330 },
    legal: { width: 216, height: 356 },
    a4: { width: 210, height: 297 },
  };

  pageSize.addEventListener("change", () => {

    if (pageSize.value == "custom") {
      pageWidth.removeAttribute('readonly');
      pageHeight.removeAttribute('readonly');
      pageWidth.classList.remove('readonly');
      pageHeight.classList.remove('readonly');
      return;
    }

    pageWidth.setAttribute('readonly', true);
    pageHeight.setAttribute('readonly', true);
    pageWidth.classList.add('readonly');
    pageHeight.classList.add('readonly');

    pageWidth.value = pageSizeMap[pageSize.value].width;
    pageHeight.value = pageSizeMap[pageSize.value].height;
  });
}

function loadMain() {
  const enableSecond = document.getElementById("enableSecond");
  enableSecond.addEventListener("change", () => {
    currentEnableSecondValue = !currentEnableSecondValue;
    updateEnableSecondBox();
  });

  const prefixs = [document.getElementById("prefix1"), document.getElementById("prefix2")];
  prefixs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      numberCurrentPreviewValues[idx].prefix = input.value;
      updatePrefixPreview(idx);
    });
    numberCurrentPreviewValues[idx].prefix = input.value;
  });

  const starts = [document.getElementById("start1"), document.getElementById("start2")];
  starts.forEach((input, idx) => {
    input.addEventListener("input", () => {
      numberCurrentPreviewValues[idx].start = input.value;
      updateStartPreview(idx);
    });
    numberCurrentPreviewValues[idx].start = input.value;
  });

  const digits = [document.getElementById("digits1"), document.getElementById("digits2")];
  digits.forEach((input, idx) => {
    input.addEventListener("input", () => {
      numberCurrentPreviewValues[idx].digits = input.value;
      updateStartPreview(idx);
    });
    numberCurrentPreviewValues[idx].digits = input.value;
  });

  const suffixs = [document.getElementById("suffix1"), document.getElementById("suffix2")];
  suffixs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      numberCurrentPreviewValues[idx].suffix = input.value;
      updateSuffixPreview(idx);
    });
    numberCurrentPreviewValues[idx].suffix = input.value;
  });
  
  const fontSizes = [document.getElementById("fontSize1"), document.getElementById("fontSize2")];
  fontSizes.forEach((input, idx) => {
    input.addEventListener("change", () => {
      numberCurrentPreviewValues[idx].fontSize = input.value + 'px';
      updateFontPreview(idx);
    });
    numberCurrentPreviewValues[idx].fontSize = input.value + 'px';
  });
  const fontWeights = [document.getElementById("fontWeight1"), document.getElementById("fontWeight2")];
  fontWeights.forEach((input, idx) => {
    input.addEventListener("change", () => {
      numberCurrentPreviewValues[idx].fontWeight = input.value;
      updateFontPreview(idx);
    });
    numberCurrentPreviewValues[idx].fontWeight = input.value;
  });
  const fontStyles = [document.getElementById("fontStyle1"), document.getElementById("fontStyle2")];
  fontStyles.forEach((input, idx) => {
    input.addEventListener("change", () => {
      numberCurrentPreviewValues[idx].fontStyle = input.value;
      updateFontPreview(idx);
    });
    numberCurrentPreviewValues[idx].fontStyle = input.value;
  });
  const colors = [document.getElementById("color1"), document.getElementById("color2")];
  colors.forEach((input, idx) => {
    input.addEventListener("input", () => {
      numberCurrentPreviewValues[idx].color = input.value;
      updateFontPreview(idx);
    });
    numberCurrentPreviewValues[idx].color = input.value;
  });
}

function loadButton() {
  document.getElementById("printBtn").addEventListener("click", () => {
    const config = {
      pageWidth: parseFloat(document.getElementById("pageWidth").value),
      pageHeight: parseFloat(document.getElementById("pageHeight").value),
      iterations: parseInt(document.getElementById("iterations").value),
      orientation: document.getElementById("orientation").value,
      printer: document.getElementById("printerSelect").value,

      start1: parseInt(document.getElementById("start1").value),
      digits1: parseInt(document.getElementById("digits1").value),
      prefix1: document.getElementById("prefix1").value,
      suffix1: document.getElementById("suffix1").value,
      x1: parseFloat(document.getElementById("x1").value),
      y1: parseFloat(document.getElementById("y1").value),
      fontSize1: parseFloat(document.getElementById("fontSize1").value),
      font1: document.getElementById("font1").value,
      color1: document.getElementById("color1").value,
      fontWeight1: document.getElementById("fontWeight1").value,
      fontStyle1: document.getElementById("fontStyle1").value,

      enableSecond: document.getElementById("enableSecond").checked,
      start2: parseInt(document.getElementById("start2").value),
      digits2: parseInt(document.getElementById("digits2").value),
      prefix2: document.getElementById("prefix2").value,
      suffix2: document.getElementById("suffix2").value,
      x2: parseFloat(document.getElementById("x2").value),
      y2: parseFloat(document.getElementById("y2").value),
      fontSize2: parseFloat(document.getElementById("fontSize2").value),
      font2: document.getElementById("font2").value,
      color2: document.getElementById("color2").value,
      fontWeight2: document.getElementById("fontWeight2").value,
      fontStyle2: document.getElementById("fontStyle2").value,
    };

    window.api.printNumbers(config);
  });
}

function loadLogs() {
  window.api.onLog((data) => {
    const logs = document.getElementById('snp-logs-data');

    const log = document.createElement('div');

    log.classList.add(`${data.type}`);
    log.textContent = `[${data.timestamp}] [${data.type}] ${data.message}`;

    if (data.link) {
        const link = document.createElement('a');

        link.href = '#';
        link.textContent = data.link.text;

        link.addEventListener('click', (event) => {
            event.preventDefault();

            window.api.openPDF(data.link.path);
        });

        log.appendChild(document.createTextNode(' '));
        log.appendChild(link);
    }

    logs.prepend(log);
  });
}

function loadConfigSaveLoadFunction() {
  document.getElementById('saveConfig').addEventListener('click', async () => {
    const config = {
        pageSize: document.getElementById('pageSize').value,
        iterations: document.getElementById('iterations').value,
        pageWidth: document.getElementById('pageWidth').value,
        pageHeight: document.getElementById('pageHeight').value,
        orientation: document.getElementById('orientation').value,
        printerSelect: document.getElementById('printerSelect').value,

        start1: Number(document.getElementById('start1').value),
        digits1: Number(document.getElementById('digits1').value),
        prefix1: document.getElementById('prefix1').value,
        suffix1: document.getElementById('suffix1').value,
        x1: Number(document.getElementById('x1').value),
        y1: Number(document.getElementById('y1').value),
        fontSize1: Number(document.getElementById('fontSize1').value),
        fontWeight1: Number(document.getElementById('fontWeight1').value),
        fontStyle1: document.getElementById('fontStyle1').value,
        color1: document.getElementById('color1').value,
        font1: document.getElementById('font1').value,

        enableSecond: document.getElementById('enableSecond').checked,
        start2: Number(document.getElementById('start2').value),
        digits2: Number(document.getElementById('digits2').value),
        prefix2: document.getElementById('prefix2').value,
        suffix2: document.getElementById('suffix2').value,
        x2: Number(document.getElementById('x2').value),
        y2: Number(document.getElementById('y2').value),
        fontSize2: Number(document.getElementById('fontSize2').value),
        fontWeight2: Number(document.getElementById('fontWeight2').value),
        fontStyle2: document.getElementById('fontStyle2').value,
        color2: document.getElementById('color2').value,
        font2: document.getElementById('font2').value,
    };

    const result = await window.api.savePrintConfig(config);

    if (result.canceled) {
        return;
    }

    if (result.error) {
        alert('Failed to save configuration: ' + result.error);
        return;
    }

    console.log('Configuration saved:', result.filePath);
  });

  document.getElementById('loadConfig').addEventListener('click', async () => {
    const result = await window.api.loadPrintConfig();

    if (result.canceled) {
        return;
    }

    if (result.error) {
        alert('Failed to open configuration: ' + result.error);
        return;
    }

    const config = result.config;

    console.log('Loaded configuration:', config);

    document.getElementById('pageSize').value = config.pageSize;
    document.getElementById('iterations').value = config.iterations;
    document.getElementById('pageWidth').value = config.pageWidth;
    document.getElementById('pageHeight').value = config.pageHeight;
    document.getElementById('orientation').value = config.orientation;
    document.getElementById('printerSelect').value = config.printerSelect;

    document.getElementById('enableSecond').checked = config.enableSecond;
    currentEnableSecondValue = config.enableSecond;
    updateEnableSecondBox();

    for (let numberKey = 0; numberKey < 2; numberKey++ ) {
      document.getElementById(`start${numberKey+1}`).value = config[`start${numberKey+1}`];
      document.getElementById(`digits${numberKey+1}`).value = config[`digits${numberKey+1}`];
      document.getElementById(`prefix${numberKey+1}`).value = config[`prefix${numberKey+1}`];
      document.getElementById(`suffix${numberKey+1}`).value = config[`suffix${numberKey+1}`];
      document.getElementById(`x${numberKey+1}`).value = config[`x${numberKey+1}`];
      document.getElementById(`y${numberKey+1}`).value = config[`y${numberKey+1}`];
      document.getElementById(`fontSize${numberKey+1}`).value = config[`fontSize${numberKey+1}`];
      document.getElementById(`fontWeight${numberKey+1}`).value = config[`fontWeight${numberKey+1}`];
      document.getElementById(`fontStyle${numberKey+1}`).value = config[`fontStyle${numberKey+1}`];
      document.getElementById(`color${numberKey+1}`).value = config[`color${numberKey+1}`];
      document.getElementById(`font${numberKey+1}`).value = config[`font${numberKey+1}`];

      
      numberCurrentPreviewValues[numberKey].start = config[`start${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].digits = config[`digits${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].prefix = config[`prefix${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].suffix = config[`suffix${numberKey+1}`];
      updatePrefixPreview(numberKey);
      updateStartPreview(numberKey);
      updateSuffixPreview(numberKey);

      numberCurrentPreviewValues[numberKey].fontSize = config[`fontSize${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].fontWeight = config[`fontWeight${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].fontStyle = config[`fontStyle${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].color = config[`color${numberKey+1}`];
      numberCurrentPreviewValues[numberKey].font = config[`font${numberKey+1}`];
      updateFontPreview[numberKey];
    }
  });
}

loadFontsCore();
loadFonts();
loadPrinters();
loadPageSettings();
loadMain();
loadButton();
loadLogs();
loadConfigSaveLoadFunction();