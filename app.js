"use strict";

const GRADE_NAMES = {
  1: "الأول الابتدائي",
  2: "الثاني الابتدائي",
  3: "الثالث الابتدائي",
  4: "الرابع الابتدائي",
  5: "الخامس الابتدائي",
  6: "السادس الابتدائي",
  7: "الأول المتوسط",
  8: "الثاني المتوسط",
  9: "الثالث المتوسط",
  10: "الأول الثانوي",
  11: "الثاني الثانوي",
  12: "الثالث الثانوي"
};
const GRADE_IDS = Object.keys(GRADE_NAMES).map(Number);
const GRADE_STAGE_GROUPS = [
  {label: "المرحلة الابتدائية", ids: [1, 2, 3, 4, 5, 6]},
  {label: "المرحلة المتوسطة", ids: [7, 8, 9]},
  {label: "المرحلة الثانوية", ids: [10, 11, 12]}
];
const ORDINAL_WORDS = {
  1: ["اول", "الاول"],
  2: ["ثاني", "الثاني"],
  3: ["ثالث", "الثالث"],
  4: ["رابع", "الرابع"],
  5: ["خامس", "الخامس"],
  6: ["سادس", "السادس"]
};
const MODES = {
  semester: {
    id: "semester",
    name: "نتيجة الفصل الدراسي",
    reportTitle: "تحليل نتائج الفصل الدراسي",
    period: "الفصل الدراسي",
    requiresClasses: true,
    supportsClassAnalysis: true,
    supportsShortTests: false,
    supportsFinalExams: true,
    categories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    reportCategories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    filesHelp: "اختر ملفًا تفصيليًا لكل صف. يجب أن تحتوي أوراق الطلاب على رقم الفصل، ولإظهار ضعاف المواد يجب أن يظهر عمود «اختبار نهاية الفصل» داخل كشف كل طالب.",
    usageHelp: "اختر ملفات نتيجة الفصل الدراسي وحدد الصف الصحيح لكل ملف. سيستخرج التطبيق الفصول ويقارن بينها، ويحسب نسبة كل طالب في اختبار نهاية الفصل ويرصد من هم أقل من النسبة المحددة.",
    notesPlaceholder: "مثال: الفصل 1/1 فصل موهوبين، أو ملاحظات المتابعة للحالات المتعثرة."
  },
  past: {
    id: "past",
    name: "تحليل نتيجة العام الماضي",
    reportTitle: "تحليل نتيجة العام الماضي",
    period: "العام الماضي",
    requiresClasses: false,
    supportsClassAnalysis: false,
    supportsShortTests: false,
    supportsFinalExams: true,
    categories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول"],
    reportCategories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول"],
    filesHelp: "اختر ملفًا تفصيليًا لكل صف. لا يشترط وجود رقم فصل، ولإظهار ضعاف المواد يجب أن تتضمن أوراق الطلاب عمود «اختبار نهاية الفصل»؛ ملفات المعدلات المختصرة وحدها لا تكفي.",
    usageHelp: "اختر ملفات النتائج النهائية للعام الماضي وحدد الصف الصحيح لكل ملف. سيُنشأ التحليل على مستوى الصفوف، مع رصد ضعاف اختبار نهاية الفصل عند توافر الدرجات التفصيلية.",
    notesPlaceholder: "أضف أي ملاحظات تفسيرية عن نتائج العام الماضي أو برامج دعم الطلاب."
  },
  period: {
    id: "period",
    name: "تحليل الفترة",
    reportTitle: "تحليل نتائج الفترة",
    period: "الفترة الأولى",
    requiresClasses: false,
    supportsClassAnalysis: true,
    supportsShortTests: true,
    supportsFinalExams: false,
    categories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    reportCategories: ["100%", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
    filesHelp: "ارفع ملفات نتائج الفترة لكل فصل. إذا لم يوجد حقل «المعدل» سيحسبه التطبيق تلقائيًا من مجموع درجات المواد ودرجاتها القصوى، ويمكن رفع أكثر من ملف للصف نفسه.",
    usageHelp: "حدد الصف الصحيح لكل ملف. يستخرج التطبيق رقم الفصل من الملف أو من اسم الملف مثل 1-1، ويحسب المعدل تلقائيًا، ويعرض تحليل الفصول وأفضل خمسة طلاب بكل فصل، ويحوّل الاختبارات القصيرة إلى نسب مئوية.",
    notesPlaceholder: "أضف ملاحظات الفترة، وأسباب الضعف في مواد محددة، وخطط المعالجة المقترحة."
  }
};

const decoder = new TextDecoder("utf-8");
const state = {mode: null, files: [], result: null, user: null, profile: null, archive: []};
const SUPABASE_URL = "https://fpicgtldwfevdvpbxkjf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3C7eKHRkzE2T-OLOpfue4g_i3u4R7Ay";
const db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}
});
const BRAND_ASSETS = {
  school: "assets/school-logo.png",
  guidance: "assets/student-guidance-logo.png"
};
let brandDataCache = null;

async function fileToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`تعذر تحميل أصل الهوية: ${url}`);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("تعذر تحويل الشعار."));
    reader.readAsDataURL(blob);
  });
}

async function getBrandData() {
  if (brandDataCache) return brandDataCache;
  try {
    const [school, guidance] = await Promise.all([
      fileToDataUrl(BRAND_ASSETS.school),
      fileToDataUrl(BRAND_ASSETS.guidance)
    ]);
    brandDataCache = {school, guidance};
  } catch (error) {
    console.warn("تعذر تضمين الشعارات داخل ملف Word، وسيستمر التصدير دون تعطيل.", error);
    brandDataCache = {school: BRAND_ASSETS.school, guidance: BRAND_ASSETS.guidance};
  }
  return brandDataCache;
}

const el = {
  setupPanel: document.getElementById("setupPanel"),
  modeHint: document.getElementById("modeHint"),
  selectedModeName: document.getElementById("selectedModeName"),
  filesHelp: document.getElementById("filesHelp"),
  usageHelp: document.getElementById("usageHelp"),
  fileInput: document.getElementById("fileInput"),
  dropZone: document.getElementById("dropZone"),
  fileList: document.getElementById("fileList"),
  reportTitle: document.getElementById("reportTitle"),
  period: document.getElementById("period"),
  schoolName: document.getElementById("schoolName"),
  academicYear: document.getElementById("academicYear"),
  threshold: document.getElementById("threshold"),
  shortTestThresholdRow: document.getElementById("shortTestThresholdRow"),
  shortTestThreshold: document.getElementById("shortTestThreshold"),
  finalExamThresholdRow: document.getElementById("finalExamThresholdRow"),
  finalExamThreshold: document.getElementById("finalExamThreshold"),
  includeNames: document.getElementById("includeNames"),
  notes: document.getElementById("notes"),
  analyzeButton: document.getElementById("analyzeButton"),
  resetButton: document.getElementById("resetButton"),
  exportButton: document.getElementById("exportButton"),
  printButton: document.getElementById("printButton"),
  statusBox: document.getElementById("statusBox"),
  resultsPanel: document.getElementById("resultsPanel"),
  resultModeBadge: document.getElementById("resultModeBadge"),
  resultsSubtitle: document.getElementById("resultsSubtitle"),
  kpiGrid: document.getElementById("kpiGrid"),
  classesTabButton: document.getElementById("classesTabButton"),
  overviewTab: document.getElementById("overviewTab"),
  classesTab: document.getElementById("classesTab"),
  topTab: document.getElementById("topTab"),
  riskTab: document.getElementById("riskTab"),
  subjectsTab: document.getElementById("subjectsTab"),
  shortTestsTabButton: document.getElementById("shortTestsTabButton"),
  shortTestsTab: document.getElementById("shortTestsTab"),
  finalExamsTabButton: document.getElementById("finalExamsTabButton"),
  finalExamsTab: document.getElementById("finalExamsTab"),
  printReportTitle: document.getElementById("printReportTitle"),
  printSchoolName: document.getElementById("printSchoolName"),
  printPeriodYear: document.getElementById("printPeriodYear"),
  authGuest: document.getElementById("authGuest"),
  authUser: document.getElementById("authUser"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authFullName: document.getElementById("authFullName"),
  signInButton: document.getElementById("signInButton"),
  signUpButton: document.getElementById("signUpButton"),
  signOutButton: document.getElementById("signOutButton"),
  currentUserName: document.getElementById("currentUserName"),
  currentUserRole: document.getElementById("currentUserRole"),
  databaseStatus: document.getElementById("databaseStatus"),
  openArchiveButton: document.getElementById("openArchiveButton"),
  archivePanel: document.getElementById("archivePanel"),
  archiveSearch: document.getElementById("archiveSearch"),
  archiveTypeFilter: document.getElementById("archiveTypeFilter"),
  refreshArchiveButton: document.getElementById("refreshArchiveButton"),
  archiveList: document.getElementById("archiveList"),
  saveAnalysisButton: document.getElementById("saveAnalysisButton")
};

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function cleanText(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function normalizeArabic(value) {
  return cleanText(value).replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}
function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString("ar-EG", {minimumFractionDigits: digits, maximumFractionDigits: digits});
}
function formatFileSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} كيلوبايت` : `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
}
function showStatus(message, isError = false) {
  el.statusBox.hidden = false;
  el.statusBox.className = `status-box${isError ? " error" : ""}`;
  el.statusBox.textContent = message;
}
function hideStatus() { el.statusBox.hidden = true; }
function activeMode() {
  if (!state.mode || !MODES[state.mode]) throw new Error("اختر نوع التحليل أولًا.");
  return MODES[state.mode];
}
function setActiveTab(tabName) {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === tabName));
  document.querySelectorAll(".tab-content").forEach(x => x.classList.toggle("active", x.id === `${tabName}Tab`));
}

function selectMode(modeId) {
  if (!MODES[modeId]) return;
  const changed = state.mode && state.mode !== modeId;
  state.mode = modeId;
  const mode = MODES[modeId];
  document.querySelectorAll(".mode-card").forEach(card => {
    const selected = card.dataset.mode === modeId;
    card.classList.toggle("active", selected);
    card.setAttribute("aria-checked", selected ? "true" : "false");
  });
  el.modeHint.textContent = `تم اختيار: ${mode.name}`;
  el.modeHint.classList.add("selected");
  el.setupPanel.hidden = false;
  el.selectedModeName.textContent = mode.name;
  el.filesHelp.textContent = mode.filesHelp;
  el.usageHelp.textContent = mode.usageHelp;
  el.reportTitle.value = mode.reportTitle;
  el.period.value = mode.period;
  el.notes.placeholder = mode.notesPlaceholder;
  el.shortTestThresholdRow.hidden = !mode.supportsShortTests;
  el.finalExamThresholdRow.hidden = !mode.supportsFinalExams;
  if (mode.supportsShortTests) el.shortTestThreshold.value = "50";
  if (mode.supportsFinalExams) el.finalExamThreshold.value = "50";
  if (changed) resetFilesAndResults();
  el.setupPanel.scrollIntoView({behavior: "smooth", block: "start"});
}

function gradeStage(gradeNumber) {
  if (gradeNumber >= 1 && gradeNumber <= 6) return "primary";
  if (gradeNumber >= 7 && gradeNumber <= 9) return "middle";
  if (gradeNumber >= 10 && gradeNumber <= 12) return "secondary";
  return "middle";
}
function gradeOrdinal(gradeNumber) {
  if (gradeNumber >= 1 && gradeNumber <= 6) return gradeNumber;
  if (gradeNumber >= 7 && gradeNumber <= 9) return gradeNumber - 6;
  if (gradeNumber >= 10 && gradeNumber <= 12) return gradeNumber - 9;
  return 1;
}
function makeClassLabel(gradeNumber, classNumber) {
  return classNumber ? `${gradeOrdinal(Number(gradeNumber))}/${classNumber}` : "";
}
function gradeOptionsHtml(selectedGrade) {
  return GRADE_STAGE_GROUPS.map(group => `
    <optgroup label="${group.label}">
      ${group.ids.map(id => `<option value="${id}" ${Number(selectedGrade) === id ? "selected" : ""}>${GRADE_NAMES[id]}</option>`).join("")}
    </optgroup>`).join("");
}
function inferGrade(filename) {
  const normalized = normalizeArabic(filename);
  const hasPrimary = /ابتدائي|ابتدائيه/.test(normalized);
  const hasMiddle = /متوسط|متوسطه/.test(normalized);
  const hasSecondary = /ثانوي|ثانويه/.test(normalized);

  let ordinal = null;
  for (const [number, aliases] of Object.entries(ORDINAL_WORDS)) {
    if (aliases.some(alias => normalized.includes(alias))) {
      ordinal = Number(number);
      break;
    }
  }
  if (!ordinal) {
    const numericPrefix = cleanText(filename).match(/(?:^|[^0-9])(1[0-2]|[1-9])\s*[-_/]/);
    if (numericPrefix) ordinal = Number(numericPrefix[1]);
  }

  if (hasPrimary && ordinal && ordinal <= 6) return ordinal;
  if (hasMiddle && ordinal && ordinal <= 3) return ordinal + 6;
  if (hasSecondary && ordinal && ordinal <= 3) return ordinal + 9;

  // الملفات المختصرة مثل 1-1 و2-3 لا توضح المرحلة؛ نحافظ على التوافق
  // مع ملفات المدرسة الحالية بافتراض المرحلة المتوسطة، ويمكن تعديل الصف من القائمة.
  if (ordinal && ordinal <= 3) return ordinal + 6;
  if (ordinal && ordinal <= 6) return ordinal;
  return 7;
}
function inferClassNumber(filename, gradeNumber = null) {
  const base = cleanText(filename).replace(/\.[^.]+$/, "");
  const pair = base.match(/(?:^|[^0-9])(1[0-2]|[1-9])\s*[-_/]\s*(\d{1,2})(?:[^0-9]|$)/);
  const expectedOrdinal = gradeNumber ? gradeOrdinal(Number(gradeNumber)) : null;
  if (pair && (!expectedOrdinal || Number(pair[1]) === expectedOrdinal)) return pair[2];
  const labeled = normalizeArabic(base).match(/(?:الفصل|فصل|class)\s*[:\-]?\s*(\d{1,2})/i);
  return labeled ? labeled[1] : null;
}
function setFiles(fileList) {
  const incoming = Array.from(fileList).filter(file => file.name.toLowerCase().endsWith(".xlsx"));
  for (const file of incoming) {
    if (!state.files.some(x => x.file.name === file.name && x.file.size === file.size)) {
      state.files.push({file, grade: inferGrade(file.name)});
    }
  }
  renderFileList();
}
function renderFileList() {
  if (!state.files.length) {
    el.fileList.className = "file-list empty-state";
    el.fileList.textContent = "لم يتم اختيار ملفات.";
    return;
  }
  el.fileList.className = "file-list";
  el.fileList.innerHTML = state.files.map((item, index) => `
    <div class="file-row">
      <div class="file-name"><strong>${escapeHtml(item.file.name)}</strong><small>${formatFileSize(item.file.size)}</small></div>
      <select data-grade-index="${index}" aria-label="الصف الدراسي للملف ${escapeHtml(item.file.name)}">
        ${gradeOptionsHtml(item.grade)}
      </select>
      <button type="button" data-remove-index="${index}" aria-label="حذف الملف">×</button>
    </div>`).join("");
  el.fileList.querySelectorAll("select[data-grade-index]").forEach(node => node.addEventListener("change", e => {
    state.files[Number(e.target.dataset.gradeIndex)].grade = Number(e.target.value);
  }));
  el.fileList.querySelectorAll("button[data-remove-index]").forEach(node => node.addEventListener("click", e => {
    state.files.splice(Number(e.target.dataset.removeIndex), 1);
    renderFileList();
  }));
}

function u16(view, offset) { return view.getUint16(offset, true); }
function u32(view, offset) { return view.getUint32(offset, true); }
async function inflateRaw(bytes) {
  if (!("DecompressionStream" in window)) throw new Error("المتصفح قديم. استخدم أحدث إصدار من Chrome أو Edge.");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzipXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  const start = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= start; i--) {
    if (u32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("الملف ليس XLSX صالحًا أو تالف.");
  const entryCount = u16(view, eocd + 10);
  let pos = u32(view, eocd + 16);
  const index = new Map();
  const cache = new Map();
  for (let i = 0; i < entryCount; i++) {
    if (u32(view, pos) !== 0x02014b50) throw new Error("تعذر قراءة بنية ملف Excel.");
    const method = u16(view, pos + 10);
    const compressedSize = u32(view, pos + 20);
    const nameLen = u16(view, pos + 28);
    const extraLen = u16(view, pos + 30);
    const commentLen = u16(view, pos + 32);
    const localOffset = u32(view, pos + 42);
    const name = decoder.decode(bytes.slice(pos + 46, pos + 46 + nameLen)).replace(/^\//, "");
    const localNameLen = u16(view, localOffset + 26);
    const localExtraLen = u16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    index.set(name, {method, compressedSize, dataStart});
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return {
    has(name) { return index.has(name); },
    async get(name) {
      if (cache.has(name)) return cache.get(name);
      const meta = index.get(name);
      if (!meta) return undefined;
      const compressed = bytes.slice(meta.dataStart, meta.dataStart + meta.compressedSize);
      let data;
      if (meta.method === 0) data = compressed;
      else if (meta.method === 8) data = await inflateRaw(compressed);
      else throw new Error(`طريقة ضغط غير مدعومة داخل Excel: ${meta.method}`);
      cache.set(name, data);
      return data;
    }
  };
}
function xmlDoc(bytes, label) {
  if (!bytes) throw new Error(`ملف Excel لا يحتوي على ${label}.`);
  const doc = new DOMParser().parseFromString(decoder.decode(bytes), "application/xml");
  if (doc.querySelector("parsererror")) throw new Error(`تعذر قراءة ${label} داخل ملف Excel.`);
  return doc;
}
function localNameElements(parent, name) { return Array.from(parent.getElementsByTagNameNS("*", name)); }
function normalizePath(base, target) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/");
  parts.pop();
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop(); else parts.push(part);
  }
  return parts.join("/");
}
async function readSharedStrings(entries) {
  const raw = await entries.get("xl/sharedStrings.xml");
  if (!raw) return [];
  const doc = xmlDoc(raw, "النصوص المشتركة");
  return localNameElements(doc, "si").map(si => localNameElements(si, "t").map(t => t.textContent || "").join(""));
}
async function readSheetPaths(entries) {
  const workbookPath = "xl/workbook.xml";
  const wb = xmlDoc(await entries.get(workbookPath), "هيكل المصنف");
  const rels = xmlDoc(await entries.get("xl/_rels/workbook.xml.rels"), "علاقات المصنف");
  const relMap = new Map(localNameElements(rels, "Relationship").map(r => [r.getAttribute("Id"), r.getAttribute("Target")]));
  return localNameElements(wb, "sheet").map(s => {
    const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const target = relMap.get(rid);
    return {name: s.getAttribute("name") || "Sheet", path: normalizePath(workbookPath, target)};
  });
}
async function parseWorksheet(entries, path, shared) {
  const doc = xmlDoc(await entries.get(path), path);
  const cells = {};
  for (const c of localNameElements(doc, "c")) {
    const ref = c.getAttribute("r");
    if (!ref) continue;
    const type = c.getAttribute("t");
    let value = null;
    if (type === "inlineStr") value = localNameElements(c, "t").map(t => t.textContent || "").join("");
    else {
      const v = localNameElements(c, "v")[0];
      if (!v) continue;
      const raw = v.textContent || "";
      if (type === "s") value = shared[Number(raw)] ?? raw;
      else if (type === "b") value = raw === "1";
      else if (type === "str" || type === "e") value = raw;
      else {
        const n = Number(raw);
        value = Number.isFinite(n) ? n : raw;
      }
    }
    if (value !== null) cells[ref] = value;
  }
  return cells;
}
function splitRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return [0, 0];
  let col = 0;
  for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64;
  return [col, Number(m[2])];
}
function parsePercentage(value) {
  if (typeof value === "number" && value >= 0 && value <= 100) return value;
  if (typeof value !== "string") return null;
  const m = value.replaceAll("،", ".").replaceAll(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return n >= 0 && n <= 100 ? n : null;
}
function findLabel(cells, exactLabels, startsWith = []) {
  const exact = new Set(exactLabels.map(cleanText));
  for (const [ref, val] of Object.entries(cells)) {
    const txt = cleanText(val);
    if (exact.has(txt) || startsWith.some(x => txt.startsWith(cleanText(x)))) return [ref, val];
  }
  return null;
}
function findAverage(cells) {
  const label = findLabel(cells, ["المعدل"]) || findLabel(cells, ["The Grand Point Average"]);
  if (!label) return null;
  const [labelCol, row] = splitRef(label[0]);
  for (const targetRow of [row, row - 1, row + 1]) {
    const candidates = [];
    for (const [ref, val] of Object.entries(cells)) {
      const [col, r] = splitRef(ref);
      if (r !== targetRow || ref === label[0]) continue;
      const n = parsePercentage(val);
      if (n === null) continue;
      candidates.push({priority: typeof val === "string" && val.includes("%") ? 1 : 0, col, n, dist: Math.abs(col - labelCol)});
    }
    if (candidates.length) {
      candidates.sort((a, b) => b.priority - a.priority || b.col - a.col || a.dist - b.dist);
      return candidates[0].n;
    }
  }
  return null;
}
function findClassNumber(cells) {
  const label = findLabel(cells, ["الفصل :", "الفصل:", "Class :", "Class:"]);
  if (label) {
    const [labelCol, row] = splitRef(label[0]);
    const nearby = [];
    for (const [ref, val] of Object.entries(cells)) {
      const [col, r] = splitRef(ref);
      const txt = cleanText(val);
      if (r === row && Math.abs(col - labelCol) <= 12 && /^\d{1,2}$/.test(txt)) nearby.push([Math.abs(col - labelCol), txt]);
    }
    nearby.sort((a, b) => a[0] - b[0]);
    if (nearby.length) return nearby[0][1];
  }
  const fallback = cleanText(cells.AA28);
  return /^\d{1,2}$/.test(fallback) ? fallback : null;
}
function findStudentName(cells) {
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const m = cleanText(val).match(/^اسم الطالب\s*:\s*(.+)$/);
    if (m) return m[1].trim();
  }
  return null;
}
function findSchoolName(cells) {
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const txt = cleanText(val);
    const labeled = txt.match(/^اسم المدرسة\s*:\s*(.+)$/);
    if (labeled) return labeled[1].trim();
  }
  const known = cleanText(cells.AD26);
  if (known && !["مدير المدرسة", "المعدل"].includes(known)) return known;
  const candidates = [];
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const txt = cleanText(val);
    if (["مدرسة", "متوسطة", "ثانوية", "ابتدائية"].some(x => txt.includes(x)) && txt.length <= 90) candidates.push(txt);
  }
  candidates.sort((a, b) => a.length - b.length);
  return candidates[0] || "";
}
function findYears(cells) {
  let hijri = "", gregorian = "";
  for (const val of Object.values(cells)) {
    if (typeof val !== "string") continue;
    const txt = cleanText(val);
    if (/^14\d{2}(?:\/14\d{2})?$/.test(txt)) hijri = txt;
    else if (/^20\d{2}(?:\/20\d{2})?$/.test(txt)) gregorian = txt;
  }
  return [hijri, gregorian];
}
function validSubjectName(text) {
  if (!text || text.length > 80) return false;
  const normalized = normalizeArabic(text);
  const blocked = [
    "المواد", "المواد الدراسية", "النتيجة", "المعدل", "التقدير العام", "المجموع الكلي للدرجة الموزونة",
    "مجموع الدرجات الموزونة", "السلوك", "المواظبة", "النشاط", "مدير المدرسة", "الختم",
    "الرقم المرجعي", "الجنسية", "تاريخ الميلاد"
  ].map(normalizeArabic);
  return !blocked.includes(normalized);
}
function findHeaderCell(cells, aliases, preferredRow = null) {
  const normalizedAliases = aliases.map(normalizeArabic);
  const matches = [];
  for (const [ref, value] of Object.entries(cells)) {
    const text = normalizeArabic(value);
    if (!text) continue;
    if (!normalizedAliases.some(alias => text === alias || text.includes(alias))) continue;
    const [col, row] = splitRef(ref);
    matches.push({ref, col, row, value: cleanText(value), rowDistance: preferredRow === null ? 0 : Math.abs(row - preferredRow)});
  }
  matches.sort((a, b) => a.rowDistance - b.rowDistance || b.col - a.col);
  return matches[0] || null;
}
function numToColumn(number) {
  let output = "";
  let value = Number(number);
  while (value > 0) {
    value--;
    output = String.fromCharCode(65 + (value % 26)) + output;
    value = Math.floor(value / 26);
  }
  return output;
}
function extractSubjectDetails(cells) {
  const subjects = {};
  const short_tests = {};
  const subject_details = {};

  // تحديد أعمدة جدول المواد ديناميكيًا لأن مواقع الأعمدة تختلف بين
  // إشعار الفترة والنتيجة الفصلية.
  const subjectHeader = findHeaderCell(cells, ["المواد الدراسية", "subjects"]);
  if (subjectHeader) {
    const headerRow = subjectHeader.row;
    const nearHeader = (aliases) => {
      const candidates = [];
      const normalizedAliases = aliases.map(normalizeArabic);
      for (const [ref, value] of Object.entries(cells)) {
        const [col, row] = splitRef(ref);
        if (Math.abs(row - headerRow) > 3 || col >= subjectHeader.col) continue;
        const text = normalizeArabic(value);
        if (!normalizedAliases.some(alias => text === alias || text.includes(alias))) continue;
        candidates.push({ref, col, row, value: cleanText(value), distance: Math.abs(row - headerRow) + Math.abs(subjectHeader.col - col) / 100});
      }
      candidates.sort((a, b) => a.distance - b.distance);
      return candidates[0] || null;
    };

    const totalHeader = nearHeader(["المجموع", "total"]);
    const shortHeader = nearHeader(["اختبارات قصيرة", "short tests"]);
    const evaluationHeader = nearHeader(["أدوات تقييم متنوعة", "evaluation tools"]);
    const finalHeader = nearHeader(["اختبارات نهاية الفترة", "اختبار نهاية الفصل", "end of period tests", "final exam"]);
    const weightedHeader = nearHeader(["الدرجة الموزونة", "weighted mark"]);
    const maxRow = Math.min(maxRowNumber(cells), headerRow + 70);

    for (let row = headerRow + 1; row <= maxRow; row++) {
      const subject = cleanText(cells[`${numToColumn(subjectHeader.col)}${row}`]);
      if (!validSubjectName(subject)) continue;
      const total = totalHeader ? parsePercentage(cells[`${numToColumn(totalHeader.col)}${row}`]) : null;
      const short = shortHeader ? parsePercentage(cells[`${numToColumn(shortHeader.col)}${row}`]) : null;
      const evaluation = evaluationHeader ? parsePercentage(cells[`${numToColumn(evaluationHeader.col)}${row}`]) : null;
      const finalExam = finalHeader ? parsePercentage(cells[`${numToColumn(finalHeader.col)}${row}`]) : null;
      if (total !== null) subjects[subject] = total;
      if (short !== null) short_tests[subject] = short;
      if (total !== null || short !== null || evaluation !== null || finalExam !== null) {
        subject_details[subject] = {total, short, evaluation, final_exam: finalExam};
      }
    }

    if (Object.keys(subject_details).length) {
      return {
        subjects,
        short_tests,
        subject_details,
        table_kind: weightedHeader ? "percentage" : "period_raw"
      };
    }
  }

  // نموذج قديم للنتيجة النهائية: اسم المادة في U والدرجة المحصلة في M.
  for (let row = 25; row <= 120; row++) {
    const subject = cleanText(cells[`U${row}`]);
    const score = parsePercentage(cells[`M${row}`]);
    if (validSubjectName(subject) && score !== null) subjects[subject] = score;
  }
  return {subjects, short_tests, subject_details, table_kind: "unknown"};
}
const PERIOD_100_POINT_SUBJECTS = new Set([
  "التربية البدنية والدفاع عن النفس",
  "التربية الفنية",
  "المهارات الحياتية والأسرية",
  "التفكير الناقد"
].map(normalizeArabic));
function inferPeriodProfiles(records) {
  const grouped = new Map();
  for (const record of records) {
    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      if (!grouped.has(subject)) grouped.set(subject, []);
      grouped.get(subject).push({...detail, table_kind: record.subject_table_kind});
    }
  }
  const profiles = {};
  for (const [subject, samples] of grouped.entries()) {
    const numbers = key => samples.map(item => Number(item[key])).filter(Number.isFinite);
    const totals = numbers("total");
    const evaluations = numbers("evaluation");
    const finals = numbers("final_exam");
    const shorts = numbers("short");
    const isPercentageTable = samples.some(item => item.table_kind === "percentage");
    const normalizedSubject = normalizeArabic(subject);
    let totalMax;
    if (isPercentageTable) totalMax = 100;
    else if (
      PERIOD_100_POINT_SUBJECTS.has(normalizedSubject) ||
      Math.max(0, ...totals) > 60.0001 ||
      Math.max(0, ...evaluations) > 40.0001 ||
      Math.max(0, ...finals) > 40.0001
    ) totalMax = 100;
    else totalMax = 60;

    let shortMax = 0;
    const maxShortObserved = Math.max(0, ...shorts);
    if (maxShortObserved > 0) {
      if (
        normalizedSubject.includes(normalizeArabic("التربية البدنية")) ||
        Math.max(0, ...evaluations) > 80.0001
      ) shortMax = 10;
      else shortMax = 20;
      if (maxShortObserved > shortMax) shortMax = Math.ceil(maxShortObserved);
    }
    profiles[subject] = {total_max: totalMax, short_max: shortMax};
  }
  return profiles;
}
function finalizePeriodDetailedRecords(records) {
  const profiles = inferPeriodProfiles(records);
  for (const record of records) {
    if (record.source_kind !== "detailed") continue;
    const normalizedSubjects = {};
    const normalizedShortTests = {};
    let earned = 0;
    let possible = 0;

    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      const profile = profiles[subject];
      if (!profile) continue;
      const total = Number(detail.total);
      if (Number.isFinite(total) && profile.total_max > 0) {
        earned += total;
        possible += profile.total_max;
        normalizedSubjects[subject] = Math.round(total / profile.total_max * 10000) / 100;
      }
      const shortScore = Number(detail.short);
      if (Number.isFinite(shortScore) && profile.short_max > 0) {
        normalizedShortTests[subject] = {
          score: Math.round(shortScore * 100) / 100,
          max: profile.short_max,
          percentage: Math.round(shortScore / profile.short_max * 10000) / 100
        };
      }
    }

    record.subjects = Object.keys(normalizedSubjects).length ? normalizedSubjects : record.subjects;
    record.short_tests = normalizedShortTests;
    if (!Number.isFinite(record.average) && possible > 0) {
      record.average = Math.round(earned / possible * 1000000) / 10000;
      record.average_source = "calculated";
      record.average_calculation = {earned: Math.round(earned * 100) / 100, possible};
    } else if (Number.isFinite(record.average)) {
      record.average_source = record.average_source || "file";
    }
    if (Number.isFinite(record.average)) record.category = classifyAverage(record.average, "period");
  }
  return records;
}
function inferFinalExamMax(observedMax) {
  const value = Number(observedMax);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // في النماذج السعودية الشائعة تكون درجة اختبار نهاية الفصل 40 درجة،
  // مع إبقاء دعم مرن لأي نموذج يستخدم 50 أو 60 أو 100 درجة.
  if (value <= 40.0001) return 40;
  if (value <= 50.0001) return 50;
  if (value <= 60.0001) return 60;
  return 100;
}
function finalizeFinalExamRecords(records) {
  const groups = new Map();
  for (const record of records) {
    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      const score = Number(detail?.final_exam);
      if (!Number.isFinite(score)) continue;
      const key = `${record.grade_number}|||${subject}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(score);
    }
  }
  const profiles = new Map();
  for (const [key, scores] of groups.entries()) {
    const observedMax = Math.max(0, ...scores);
    const max = inferFinalExamMax(observedMax);
    if (max > 0) profiles.set(key, max);
  }
  for (const record of records) {
    const normalized = {};
    for (const [subject, detail] of Object.entries(record.subject_details || {})) {
      const score = Number(detail?.final_exam);
      const max = profiles.get(`${record.grade_number}|||${subject}`) || 0;
      if (!Number.isFinite(score) || max <= 0) continue;
      normalized[subject] = {
        score: Math.round(score * 100) / 100,
        max,
        percentage: Math.round(score / max * 10000) / 100
      };
    }
    record.final_exams = normalized;
  }
  return records;
}

function classifyAverage(value, modeId) {
  if (Math.abs(value - 100) <= 0.005) return "100%";
  if (value >= 90) return "ممتاز";
  if (value >= 80) return "جيد جداً";
  if (value >= 70) return "جيد";
  if (modeId === "past") return "مقبول";
  if (value >= 60) return "مقبول";
  return "ضعيف";
}

function maxRowNumber(cells) {
  return Math.max(0, ...Object.keys(cells).map(ref => splitRef(ref)[1]));
}
function findAllStudentTableHeaders(cells) {
  const rows = [];
  for (let row = 1; row <= maxRowNumber(cells); row++) {
    if (normalizeArabic(cells[`B${row}`]) === normalizeArabic("الطالب") && normalizeArabic(cells[`D${row}`]) === normalizeArabic("النسبة")) rows.push(row);
  }
  return rows;
}
function parseTabularPeriodSheet(cells, fileName, gradeNumber, sheetName, modeId) {
  const sectionRows = Object.entries(cells)
    .filter(([, value]) => normalizeArabic(value) === normalizeArabic("معدلات جميع الطلاب"))
    .map(([ref]) => splitRef(ref)[1]);
  const headers = findAllStudentTableHeaders(cells);
  if (!headers.length) return [];
  let headerRow;
  if (sectionRows.length) headerRow = headers.find(row => row > sectionRows.at(-1)) || headers.at(-1);
  else headerRow = headers.at(-1);
  const records = [];
  const seen = new Set();
  for (let row = headerRow + 1; row <= maxRowNumber(cells); row++) {
    const studentName = cleanText(cells[`B${row}`]);
    const average = parsePercentage(cells[`D${row}`]);
    if (!studentName || average === null || normalizeArabic(studentName) === normalizeArabic("الطالب")) continue;
    const key = `${normalizeArabic(studentName)}|${average}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const gradeName = GRADE_NAMES[gradeNumber] || cleanText(cells[`E${row}`]);
    const periodLabel = cleanText(cells[`G${row}`]);
    const semesterLabel = cleanText(cells[`H${row}`]);
    const academicYear = cleanText(cells[`I${row}`]);
    const inferredClass = inferClassNumber(fileName, gradeNumber);
    records.push({
      workbook_name: fileName,
      sheet_name: sheetName,
      grade_number: gradeNumber,
      grade_name: gradeName,
      class_number: inferredClass,
      class_label: makeClassLabel(gradeNumber, inferredClass),
      student_name: studentName,
      average: Math.round(average * 10000) / 10000,
      category: classifyAverage(average, modeId),
      school_name: "",
      academic_year_hijri: academicYear,
      academic_year_gregorian: "",
      period_label: periodLabel,
      semester_label: semesterLabel,
      subjects: {},
      short_tests: {},
      final_exams: {},
      subject_details: {},
      subject_table_kind: "summary",
      average_source: "file",
      source_kind: "summary"
    });
  }
  return records;
}

async function parseWorkbook(file, gradeNumber, modeId = state.mode) {
  const mode = MODES[modeId];
  if (!mode) throw new Error("نوع التحليل غير صالح.");
  const entries = await unzipXlsx(await file.arrayBuffer());
  const shared = await readSharedStrings(entries);
  const sheetPaths = await readSheetPaths(entries);
  const parsedSheets = [];
  for (const sheet of sheetPaths) parsedSheets.push({sheet, cells: await parseWorksheet(entries, sheet.path, shared)});

  // ملفات تحليل الفترة المجمعة: نقرأ قسم «معدلات جميع الطلاب»، ونحتفظ كذلك بأي كشوف تفصيلية
  // داخل الملف نفسه حتى يمكن دمج المعدل العام مع درجات الاختبارات القصيرة دون تكرار الطالب.
  const tabularRecords = modeId === "period"
    ? parsedSheets.flatMap(({sheet, cells}) => parseTabularPeriodSheet(cells, file.name, gradeNumber, sheet.name, modeId))
    : [];

  const records = [];
  for (const {sheet, cells} of parsedSheets) {
    const detectedAverage = findAverage(cells);
    const studentName = findStudentName(cells);
    const classNumber = (mode.requiresClasses || mode.supportsClassAnalysis)
      ? (findClassNumber(cells) || inferClassNumber(file.name, gradeNumber))
      : null;
    const subjectDetails = extractSubjectDetails(cells);
    const hasSubjectResults = Object.keys(subjectDetails.subject_details || {}).length > 0 ||
      Object.keys(subjectDetails.subjects || {}).length > 0;

    if (detectedAverage === null && studentName === null && classNumber === null && !hasSubjectResults) continue;
    if (mode.requiresClasses && classNumber === null) {
      throw new Error(`لم يتم العثور على رقم الفصل في الورقة ${sheet.name} داخل ${file.name}. تأكد أنك اخترت «نتيجة الفصل الدراسي».`);
    }
    if (detectedAverage === null && modeId !== "period") {
      throw new Error(`لم يتم العثور على المعدل في الورقة ${sheet.name} داخل ${file.name}.`);
    }
    if (detectedAverage === null && modeId === "period" && !hasSubjectResults) {
      throw new Error(`لم يتم العثور على معدل أو نتائج مواد قابلة للحساب في الورقة ${sheet.name} داخل ${file.name}.`);
    }

    const [hijri, gregorian] = findYears(cells);
    const average = detectedAverage === null ? null : Math.round(detectedAverage * 10000) / 10000;
    records.push({
      workbook_name: file.name,
      sheet_name: sheet.name,
      grade_number: gradeNumber,
      grade_name: GRADE_NAMES[gradeNumber],
      class_number: classNumber,
      class_label: makeClassLabel(gradeNumber, classNumber),
      student_name: studentName || `طالب بدون اسم (${sheet.name})`,
      average,
      category: Number.isFinite(average) ? classifyAverage(average, modeId) : "",
      school_name: findSchoolName(cells),
      academic_year_hijri: hijri,
      academic_year_gregorian: gregorian,
      period_label: "",
      semester_label: "",
      subjects: subjectDetails.subjects,
      short_tests: subjectDetails.short_tests,
      final_exams: {},
      subject_details: subjectDetails.subject_details,
      subject_table_kind: subjectDetails.table_kind,
      average_source: Number.isFinite(average) ? "file" : "pending_calculation",
      source_kind: "detailed"
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (modeId === "period") finalizePeriodDetailedRecords(records);
  if (mode.supportsFinalExams) finalizeFinalExamRecords(records);
  const unresolved = records.find(record => !Number.isFinite(record.average));
  if (unresolved) {
    throw new Error(`تعذر حساب المعدل من نتائج المواد في الورقة ${unresolved.sheet_name} داخل ${file.name}. تأكد من وجود أسماء المواد وعمود المجموع.`);
  }

  const combined = modeId === "period" ? mergePeriodRecords([...tabularRecords, ...records], modeId) : records;
  if (!combined.length) throw new Error(`لم يتم العثور على بيانات طلاب داخل ${file.name}.`);
  return combined;
}

function mergePeriodRecords(records, modeId = "period") {
  const merged = new Map();
  for (const record of records) {
    const normalizedName = normalizeArabic(record.student_name);
    const anonymous = !normalizedName || normalizedName.startsWith(normalizeArabic("طالب بدون اسم"));
    const key = anonymous
      ? `${record.grade_number}|${record.workbook_name}|${record.sheet_name}`
      : `${record.grade_number}|${normalizedName}`;

    if (!merged.has(key)) {
      merged.set(key, {
        ...record,
        subjects: {...(record.subjects || {})},
        short_tests: {...(record.short_tests || {})},
        final_exams: {...(record.final_exams || {})},
        subject_details: {...(record.subject_details || {})}
      });
      continue;
    }

    const current = merged.get(key);
    const currentHasSummary = String(current.source_kind || "").includes("summary");
    const incomingIsSummary = record.source_kind === "summary";

    // المعدل الوارد في ملف «معدلات جميع الطلاب» هو المرجع الأول.
    // عند عدم وجوده نستخدم المعدل المحسوب من مجموع درجات المواد.
    if (
      incomingIsSummary ||
      (!currentHasSummary && !Number.isFinite(current.average) && Number.isFinite(record.average))
    ) {
      current.average = record.average;
      current.category = classifyAverage(record.average, modeId);
      current.average_source = record.average_source || (incomingIsSummary ? "file" : "calculated");
      current.average_calculation = record.average_calculation || current.average_calculation;
    }

    current.subjects = {...current.subjects, ...(record.subjects || {})};
    current.short_tests = {...current.short_tests, ...(record.short_tests || {})};
    current.final_exams = {...current.final_exams, ...(record.final_exams || {})};
    current.subject_details = {...current.subject_details, ...(record.subject_details || {})};
    current.class_number = current.class_number || record.class_number || null;
    current.class_label = current.class_label || record.class_label || "";
    current.school_name = current.school_name || record.school_name || "";
    current.academic_year_hijri = current.academic_year_hijri || record.academic_year_hijri || "";
    current.academic_year_gregorian = current.academic_year_gregorian || record.academic_year_gregorian || "";
    current.period_label = current.period_label || record.period_label || "";
    current.semester_label = current.semester_label || record.semester_label || "";

    const kinds = new Set(
      `${current.source_kind || ""}+${record.source_kind || ""}`
        .split("+")
        .filter(Boolean)
    );
    current.source_kind = [...kinds].join("+");
  }

  const output = [...merged.values()].filter(record => Number.isFinite(record.average));
  return output.sort((a, b) =>
    a.grade_number - b.grade_number || a.student_name.localeCompare(b.student_name, "ar")
  );
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}
function roundedPct(count, total) { return Math.round((total ? count / total * 100 : 0) * 100) / 100; }
function summaryGroup(records, modeId) {
  const mode = MODES[modeId];
  const counts = Object.fromEntries(mode.categories.map(category => [category, 0]));
  for (const record of records) counts[record.category] = (counts[record.category] || 0) + 1;
  const total = records.length;
  const average = total ? records.reduce((sum, record) => sum + record.average, 0) / total : 0;
  const excellentCount = (counts["100%"] || 0) + (counts["ممتاز"] || 0);
  return {
    total,
    average: Math.round(average * 100) / 100,
    counts,
    percentages: Object.fromEntries(mode.categories.map(category => [category, roundedPct(counts[category] || 0, total)])),
    excellent_including_100: excellentCount,
    excellent_rate_including_100: roundedPct(excellentCount, total)
  };
}
function topStudents(records, limit) {
  const sorted = [...records].sort((a, b) => b.average - a.average || a.student_name.localeCompare(b.student_name, "ar"));
  const output = [];
  let previousAverage = null;
  let rank = 0;
  for (let index = 0; index < sorted.length; index++) {
    const record = sorted[index];
    const roundedAverage = Math.round(record.average * 100) / 100;
    if (previousAverage === null || Math.abs(roundedAverage - previousAverage) > 0.0001) rank = index + 1;
    if (rank > limit) break;
    output.push({
      rank,
      student_name: record.student_name,
      grade_name: record.grade_name,
      class_label: record.class_label,
      average: roundedAverage,
      category: record.category
    });
    previousAverage = roundedAverage;
  }
  return output;
}
function mostCommon(values) {
  const map = countBy(values.filter(Boolean), value => value);
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}
function buildNarrative(analysis, threshold, notes, modeId) {
  const mode = MODES[modeId];
  const overall = analysis.overall;
  const rate = overall.excellent_rate_including_100;
  const average = overall.average;
  const level = rate >= 90 ? "مرتفعًا جدًا" : rate >= 75 ? "مرتفعًا" : rate >= 50 ? "جيدًا بوجه عام" : "بحاجة واضحة إلى التحسين";
  const opening = `تعكس النتائج مستوى ${level} من التحصيل؛ إذ بلغت نسبة الحاصلين على ممتاز فأعلى ${rate.toFixed(1)}%، وبلغ المتوسط العام ${average.toFixed(2)}%.`;
  const insights = [];
  const recommendations = [];

  const classItemsForNarrative = Object.values(analysis.classes).sort((a, b) => b.average - a.average);
  if (MODES[modeId].supportsClassAnalysis && classItemsForNarrative.length) {
    const highClass = classItemsForNarrative[0];
    const lowClass = classItemsForNarrative.at(-1);
    const spread = highClass && lowClass ? Math.round((highClass.average - lowClass.average) * 100) / 100 : 0;
    if (highClass) insights.push(`حقق الفصل ${highClass.class_label} أعلى متوسط فصلي بنسبة ${highClass.average.toFixed(2)}%.`);
    if (lowClass && highClass && lowClass.class_label !== highClass.class_label) insights.push(`بلغ أقل متوسط فصلي ${lowClass.average.toFixed(2)}% في الفصل ${lowClass.class_label}، وبلغ الفارق بين أعلى وأقل فصل ${spread.toFixed(2)} نقطة مئوية.`);
    recommendations.push(spread >= 5
      ? "تحليل ممارسات الفصول الأعلى أداءً ونقل الممارسات الفعالة إلى الفصول الأقل متوسطًا."
      : "الحفاظ على تقارب مستويات الفصول وتعزيز الممارسات التعليمية المشتركة بين المعلمين.");
  }

  if (modeId !== "semester") {
    const grades = Object.values(analysis.grades).sort((a, b) => b.average - a.average);
    const high = grades[0];
    const low = grades.at(-1);
    if (high) insights.push(`حقق ${high.grade_name} أعلى متوسط بين الصفوف بنسبة ${high.average.toFixed(2)}%.`);
    if (high && low && high.grade_number !== low.grade_number) insights.push(`بلغ الفارق بين أعلى وأقل متوسط للصفوف ${(high.average - low.average).toFixed(2)} نقطة مئوية.`);
    if (modeId === "past") insights.push("هذا النوع من التحليل مبني على نتائج الصفوف النهائية ولا يعتمد على بيانات الفصول.");
    if (modeId === "period") {
      insights.push("تحليل الفترة يعرض النتائج على مستوى الصفوف والفصول، ويستخرج درجات الاختبارات القصيرة تلقائيًا.");
      if (!classItemsForNarrative.length) insights.push("لم تتوافر أرقام فصول قابلة للاستخراج؛ لذلك اقتصر العرض الحالي على مستوى الصفوف.");
      if (analysis.calculated_average_count) insights.push(`تم حساب معدل ${analysis.calculated_average_count} طالبًا تلقائيًا من مجموع درجات المواد مقارنة بدرجاتها القصوى لعدم وجود حقل معدل داخل الملفات.`);
    }
    recommendations.push(modeId === "past"
      ? "مقارنة مؤشرات كل صف بنتائجه في العام الحالي لقياس التحسن أو التراجع وتحديد أسباب الفروق."
      : "مراجعة مؤشرات الفترة مع المعلمين وتحديد التدخلات السريعة قبل الاختبارات اللاحقة.");
  }

  const absentCategories = mode.reportCategories.filter(category => (overall.counts[category] || 0) === 0);
  if (absentCategories.length) {
    const scope = mode.supportsClassAnalysis && Object.keys(analysis.classes).length
      ? "على مستوى جميع الصفوف والفصول"
      : "على مستوى جميع الصفوف";
    insights.push(`لم يُسجل أي طالب ضمن مستويات ${formatArabicList(absentCategories.map(categoryLabel))} ${scope}؛ لذلك لم تظهر هذه المستويات في الجداول لعدم وجود بيانات.`);
  }

  insights.push(`بلغ عدد الطلاب الحاصلين على أقل من ${threshold}% عدد ${analysis.at_risk_count} من أصل ${overall.total} طالبًا بنسبة ${roundedPct(analysis.at_risk_count, overall.total).toFixed(2)}%.`);
  if (modeId === "period") {
    if (analysis.short_test_summary.length) {
      const highest = analysis.short_test_summary.slice().sort((a, b) => b.weak_count - a.weak_count || b.weak_rate - a.weak_rate)[0];
      insights.push(`تم رصد ${analysis.short_test_weak_count} حالة ضعف في الاختبارات القصيرة لدى ${analysis.short_test_weak_student_count} طالبًا وفق حد ${analysis.short_test_threshold}%.`);
      if (highest) insights.push(`سجلت مادة ${highest.subject} في ${highest.grade_name} أعلى عدد حالات ضعف (${highest.weak_count} حالة).`);
      recommendations.push("إعداد قوائم علاجية حسب المادة للطلاب الأقل من نسبة الضعف المحددة، ثم إعادة القياس باختبار قصير لاحق.");
    } else {
      insights.push("لم تُكتشف بيانات تفصيلية لعمود الاختبارات القصيرة في الملفات الحالية؛ لذلك لم تُنشأ قائمة ضعاف المواد.");
      recommendations.push("لإظهار ضعاف المواد، ارفع كشوف الطلاب التفصيلية التي تتضمن عمود «اختبارات قصيرة» بجانب اسم كل مادة.");
    }
  }
  if (mode.supportsFinalExams) {
    if (analysis.final_exam_summary.length) {
      if (analysis.final_exam_weak_count) {
        const highest = analysis.final_exam_summary.slice().sort((a, b) => b.weak_count - a.weak_count || b.weak_rate - a.weak_rate)[0];
        insights.push(`تم رصد ${analysis.final_exam_weak_count} حالة ضعف في اختبار نهاية الفصل لدى ${analysis.final_exam_weak_student_count} طالبًا وفق حد أقل من ${analysis.final_exam_threshold}%.`);
        if (highest?.weak_count) insights.push(`سجلت مادة ${highest.subject} في ${highest.grade_name} أعلى عدد حالات ضعف في اختبار نهاية الفصل (${highest.weak_count} حالة).`);
        recommendations.push("إعداد خطط علاجية حسب المادة للطلاب الأقل من نسبة الضعف المحددة في اختبار نهاية الفصل، وربطها بنتائج القياس اللاحق.");
      } else {
        insights.push(`لم يُسجل أي طالب أقل من ${analysis.final_exam_threshold}% في اختبار نهاية الفصل ضمن المواد التي تحتوي على اختبار.`);
        recommendations.push("المحافظة على مستوى التحصيل في اختبار نهاية الفصل مع تقديم إثراء للطلاب المتفوقين ومتابعة أي تراجع مبكر.");
      }
    } else {
      insights.push("لم تُكتشف درجات تفصيلية لاختبار نهاية الفصل في الملفات المرفوعة؛ لذلك لم تُنشأ قائمة ضعاف المواد لهذا الاختبار.");
      recommendations.push("لإظهار ضعاف اختبار نهاية الفصل، استخدم ملفات النتائج التفصيلية التي تتضمن عمود «اختبار نهاية الفصل» لكل مادة؛ ملفات المعدلات المختصرة وحدها لا تكفي.");
    }
  }
  if (analysis.at_risk_count) {
    recommendations.push("إعداد خطط علاجية فردية للطلاب الأولى بالرعاية مع توثيق التدخلات وقياس أثرها دوريًا.", "تفعيل التواصل المنتظم مع أولياء الأمور للحالات المتعثرة وربط المتابعة بمؤشرات قابلة للقياس.");
  } else recommendations.push("الاستمرار في التدخلات الوقائية التي حافظت على انخفاض التعثر الدراسي.");
  recommendations.push("تقديم برامج إثرائية للطلاب المتفوقين لضمان استمرار النمو وعدم الاكتفاء بمستوى التحصيل الحالي.", "مراجعة نتائج المواد الأقل متوسطًا ووضع تدخلات تعليمية محددة لها.");
  return {opening, insights, recommendations, school_notes: cleanText(notes)};
}
function analyzeRecords(records, threshold, notes, modeId = state.mode, shortTestThreshold = 50, finalExamThreshold = 50) {
  const mode = MODES[modeId];
  if (!mode) throw new Error("نوع التحليل غير صالح.");
  const grades = {};
  const classes = {};
  for (const gradeNumber of [...new Set(records.map(record => record.grade_number))].sort()) {
    const group = records.filter(record => record.grade_number === gradeNumber);
    const risk = group.filter(record => record.average < threshold).sort((a, b) => a.average - b.average);
    grades[gradeNumber] = {
      ...summaryGroup(group, modeId), grade_number: gradeNumber, grade_name: GRADE_NAMES[gradeNumber],
      top_students: topStudents(group, 10), at_risk_count: risk.length,
      at_risk_students: risk.map(record => ({student_name: record.student_name, class_label: record.class_label, average: Math.round(record.average * 100) / 100}))
    };
  }
  if (mode.supportsClassAnalysis) {
    const classKeys = [...new Set(records
      .filter(record => record.class_label)
      .map(record => `${record.grade_number}|||${record.class_label}`)
    )].sort((a, b) => {
      const [gradeA, labelA] = a.split("|||");
      const [gradeB, labelB] = b.split("|||");
      const classA = Number(labelA.split("/")[1] || 0);
      const classB = Number(labelB.split("/")[1] || 0);
      return Number(gradeA) - Number(gradeB) || classA - classB;
    });
    for (const key of classKeys) {
      const [gradeValue, label] = key.split("|||");
      const gradeNumber = Number(gradeValue);
      const group = records.filter(record => record.grade_number === gradeNumber && record.class_label === label);
      classes[key] = {...summaryGroup(group, modeId), class_label: label, grade_number: gradeNumber, grade_name: GRADE_NAMES[gradeNumber],
        top_students: topStudents(group, 5), at_risk_count: group.filter(record => record.average < threshold).length};
    }
  }
  const subjectMap = new Map();
  for (const record of records) for (const [subject, value] of Object.entries(record.subjects || {})) {
    if (!subjectMap.has(subject)) subjectMap.set(subject, []);
    subjectMap.get(subject).push(value);
  }
  const subject_summary = [...subjectMap.entries()]
    .map(([subject, values]) => ({subject, average: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100, students: values.length}))
    .sort((a, b) => b.average - a.average);

  // تحليل الاختبارات القصيرة حسب الصف والمادة.
  // الدرجة القصوى تُقرأ من بنية نتيجة الفترة وتُحوَّل كل درجة إلى نسبة مئوية.
  const shortTestGroups = new Map();
  for (const record of records) {
    for (const [subject, rawValue] of Object.entries(record.short_tests || {})) {
      let score;
      let maxScore;
      let percentage;
      if (rawValue && typeof rawValue === "object") {
        score = Number(rawValue.score);
        maxScore = Number(rawValue.max);
        percentage = Number(rawValue.percentage);
      } else {
        score = Number(rawValue);
        maxScore = null;
        percentage = null;
      }
      if (!Number.isFinite(score)) continue;
      const key = `${record.grade_number}|||${subject}`;
      if (!shortTestGroups.has(key)) {
        shortTestGroups.set(key, {
          grade_number: record.grade_number,
          grade_name: record.grade_name,
          subject,
          entries: []
        });
      }
      shortTestGroups.get(key).entries.push({record, score, maxScore, percentage});
    }
  }

  const short_test_summary = [];
  const short_test_weak_students = [];
  for (const group of shortTestGroups.values()) {
    const declaredMax = Math.max(0, ...group.entries.map(item => Number(item.maxScore)).filter(Number.isFinite));
    const observedMax = Math.max(0, ...group.entries.map(item => item.score));
    const maxScore = declaredMax > 0 ? declaredMax : observedMax;
    if (maxScore <= 0) continue;

    const assessed = group.entries.map(item => {
      const pct = Number.isFinite(item.percentage)
        ? item.percentage
        : Math.round(item.score / maxScore * 10000) / 100;
      return {...item, percentage: pct};
    });
    const weak = assessed.filter(item => item.percentage < shortTestThreshold);
    const averagePercent = assessed.reduce((sum, item) => sum + item.percentage, 0) / assessed.length;

    short_test_summary.push({
      grade_number: group.grade_number,
      grade_name: group.grade_name,
      subject: group.subject,
      max_score: maxScore,
      students: assessed.length,
      weak_count: weak.length,
      weak_rate: roundedPct(weak.length, assessed.length),
      average_percent: Math.round(averagePercent * 100) / 100
    });

    for (const item of weak) {
      short_test_weak_students.push({
        student_name: item.record.student_name,
        grade_name: item.record.grade_name,
        grade_number: item.record.grade_number,
        class_label: item.record.class_label,
        subject: group.subject,
        score: item.score,
        max_score: maxScore,
        percentage: item.percentage
      });
    }
  }
  short_test_summary.sort((a, b) => a.grade_number - b.grade_number || b.weak_count - a.weak_count || a.subject.localeCompare(b.subject, "ar"));
  short_test_weak_students.sort((a, b) => a.grade_number - b.grade_number || a.subject.localeCompare(b.subject, "ar") || a.percentage - b.percentage);

  // تحليل اختبار نهاية الفصل حسب الصف والمادة.
  const finalExamGroups = new Map();
  for (const record of records) {
    for (const [subject, rawValue] of Object.entries(record.final_exams || {})) {
      const score = Number(rawValue?.score ?? rawValue);
      const maxScore = Number(rawValue?.max);
      const percentage = Number(rawValue?.percentage);
      if (!Number.isFinite(score)) continue;
      const key = `${record.grade_number}|||${subject}`;
      if (!finalExamGroups.has(key)) finalExamGroups.set(key, {
        grade_number: record.grade_number,
        grade_name: record.grade_name,
        subject,
        entries: []
      });
      finalExamGroups.get(key).entries.push({record, score, maxScore, percentage});
    }
  }

  const final_exam_summary = [];
  const final_exam_weak_students = [];
  for (const group of finalExamGroups.values()) {
    const declaredMax = Math.max(0, ...group.entries.map(item => item.maxScore).filter(Number.isFinite));
    const observedMax = Math.max(0, ...group.entries.map(item => item.score));
    const maxScore = declaredMax > 0 ? declaredMax : inferFinalExamMax(observedMax);
    if (maxScore <= 0) continue;
    const assessed = group.entries.map(item => ({
      ...item,
      percentage: Number.isFinite(item.percentage)
        ? item.percentage
        : Math.round(item.score / maxScore * 10000) / 100
    }));
    const weak = assessed.filter(item => item.percentage < finalExamThreshold);
    const averagePercent = assessed.reduce((sum, item) => sum + item.percentage, 0) / assessed.length;
    final_exam_summary.push({
      grade_number: group.grade_number,
      grade_name: group.grade_name,
      subject: group.subject,
      max_score: maxScore,
      students: assessed.length,
      weak_count: weak.length,
      weak_rate: roundedPct(weak.length, assessed.length),
      average_percent: Math.round(averagePercent * 100) / 100
    });
    for (const item of weak) final_exam_weak_students.push({
      student_name: item.record.student_name,
      grade_name: item.record.grade_name,
      grade_number: item.record.grade_number,
      class_label: item.record.class_label,
      subject: group.subject,
      score: item.score,
      max_score: maxScore,
      percentage: item.percentage
    });
  }
  final_exam_summary.sort((a, b) => a.grade_number - b.grade_number || b.weak_count - a.weak_count || a.subject.localeCompare(b.subject, "ar"));
  final_exam_weak_students.sort((a, b) => a.grade_number - b.grade_number || a.subject.localeCompare(b.subject, "ar") || a.percentage - b.percentage);

  const atRisk = records.filter(record => record.average < threshold).sort((a, b) => {
    const classDiff = mode.supportsClassAnalysis ? Number(a.class_number || 0) - Number(b.class_number || 0) : 0;
    return a.grade_number - b.grade_number || classDiff || a.average - b.average;
  });
  const uniqueWeakStudents = new Set(short_test_weak_students.map(item => `${item.grade_number}|${normalizeArabic(item.student_name)}|${item.class_label}`));
  const uniqueFinalWeakStudents = new Set(final_exam_weak_students.map(item => `${item.grade_number}|${normalizeArabic(item.student_name)}|${item.class_label}`));
  const analysis = {
    mode_id: modeId, mode_name: mode.name, overall: summaryGroup(records, modeId), grades, classes,
    at_risk_count: atRisk.length,
    at_risk_students: atRisk.map(record => ({student_name: record.student_name, grade_name: record.grade_name, class_label: record.class_label, average: Math.round(record.average * 100) / 100})),
    top_students_school: topStudents(records, 10), subject_summary,
    short_test_threshold: shortTestThreshold,
    short_test_summary,
    short_test_weak_students,
    short_test_weak_count: short_test_weak_students.length,
    short_test_weak_student_count: uniqueWeakStudents.size,
    final_exam_threshold: finalExamThreshold,
    final_exam_summary,
    final_exam_weak_students,
    final_exam_weak_count: final_exam_weak_students.length,
    final_exam_weak_student_count: uniqueFinalWeakStudents.size,
    calculated_average_count: records.filter(record => record.average_source === "calculated").length,
    threshold,
    school_name_detected: mostCommon(records.map(record => record.school_name)),
    academic_year_hijri_detected: mostCommon(records.map(record => record.academic_year_hijri)),
    academic_year_gregorian_detected: mostCommon(records.map(record => record.academic_year_gregorian)),
    period_detected: mostCommon(records.map(record => record.period_label)),
    records
  };
  analysis.narrative = buildNarrative(analysis, threshold, notes, modeId);
  return analysis;
}

function buildTable(headers, rows, nameCol = -1) {
  const body = rows.length
    ? rows.map(row => `<tr>${row.map((cell, index) => `<td class="${index === nameCol ? "name-cell" : ""}">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}">لا توجد بيانات.</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function buildBarChart(items, suffix = "") {
  const max = Math.max(...items.map(item => Number(item.value)), 1);
  return `<div class="chart">${items.map(item => `
    <div class="chart-row">
      <span class="chart-label">${escapeHtml(item.label)}</span>
      <div class="chart-track"><div class="chart-bar" style="width:${Math.max(1, Number(item.value) / max * 100)}%"></div></div>
      <span class="chart-value">${escapeHtml(item.display ?? item.value)}${escapeHtml(suffix)}</span>
    </div>`).join("")}</div>`;
}
function categoryLabel(category) { return category === "جيد جداً" ? "جيد جدًا" : category; }
function categoryHeaders(mode, categories = mode.reportCategories) { return categories.map(categoryLabel); }
function categoryValues(summary, mode, categories = mode.reportCategories) { return categories.map(category => summary.counts[category] || 0); }
function categoriesWithData(summaries, mode) {
  const groups = Array.isArray(summaries) ? summaries : [summaries];
  return mode.reportCategories.filter(category => groups.some(summary => (summary?.counts?.[category] || 0) > 0));
}
function formatArabicList(items) {
  const values = items.filter(Boolean);
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} أو ${values[1]}`;
  return `${values.slice(0, -1).join("، ")} أو ${values.at(-1)}`;
}

function renderKpis(result) {
  const overall = result.overall;
  let html = `
    <article class="kpi"><span>إجمالي الطلاب</span><strong>${overall.total.toLocaleString("ar-EG")}</strong></article>
    <article class="kpi"><span>المتوسط العام</span><strong>${formatNumber(overall.average)}%</strong></article>
    <article class="kpi"><span>ممتاز فأعلى</span><strong>${formatNumber(overall.excellent_rate_including_100)}%</strong></article>
    <article class="kpi warning"><span>أقل من ${result.threshold}%</span><strong>${result.at_risk_count.toLocaleString("ar-EG")}</strong></article>`;
  if (result.mode_id === "period") html += `
    ${result.calculated_average_count ? `<article class="kpi"><span>معدلات محسوبة تلقائيًا</span><strong>${result.calculated_average_count.toLocaleString("ar-EG")}</strong></article>` : ""}
    <article class="kpi warning"><span>طلاب ضعاف الاختبار القصير</span><strong>${result.short_test_weak_student_count.toLocaleString("ar-EG")}</strong></article>
    <article class="kpi warning"><span>حالات ضعف المواد</span><strong>${result.short_test_weak_count.toLocaleString("ar-EG")}</strong></article>`;
  if (MODES[result.mode_id].supportsFinalExams) html += `
    <article class="kpi warning"><span>طلاب ضعاف اختبار نهاية الفصل</span><strong>${result.final_exam_weak_student_count.toLocaleString("ar-EG")}</strong></article>
    <article class="kpi warning"><span>حالات ضعف مواد الاختبار النهائي</span><strong>${result.final_exam_weak_count.toLocaleString("ar-EG")}</strong></article>`;
  el.kpiGrid.innerHTML = html;
}
function renderOverview(result) {
  const mode = MODES[result.mode_id];
  const gradeItems = Object.values(result.grades);
  const activeCategories = categoriesWithData(gradeItems, mode);
  const rows = gradeItems.map(grade => [
    grade.grade_name,
    ...categoryValues(grade, mode, activeCategories),
    grade.total,
    `${formatNumber(grade.average)}%`
  ]);
  const chartItems = activeCategories.map(category => ({label: categoryLabel(category), value: result.overall.counts[category] || 0}));
  const narrative = result.narrative;
  el.overviewTab.innerHTML = `
    <section class="section-block">
      <h3>التحليل العام على مستوى المدرسة</h3>
      ${buildTable(["الصف", ...categoryHeaders(mode, activeCategories), "الإجمالي", "المتوسط"], rows)}
      ${buildBarChart(chartItems)}
    </section>
    <section class="section-block">
      <h3>قراءة تحليلية</h3>
      <div class="narrative"><strong>${escapeHtml(narrative.opening)}</strong><ul>${narrative.insights.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${narrative.school_notes ? `<p><b>ملاحظات المدرسة:</b> ${escapeHtml(narrative.school_notes)}</p>` : ""}</div>
      <h3>توصيات مقترحة</h3>
      <div class="narrative"><ul>${narrative.recommendations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
    </section>`;
}
function renderClasses(result) {
  const mode = MODES[result.mode_id];
  const values = Object.values(result.classes).sort((a, b) =>
    a.grade_number - b.grade_number || Number(a.class_number || a.class_label.split("/")[1] || 0) - Number(b.class_number || b.class_label.split("/")[1] || 0)
  );
  if (!mode.supportsClassAnalysis || !values.length) {
    el.classesTab.innerHTML = `<div class="narrative">لم تتوافر بيانات فصول قابلة للتحليل في الملفات المرفوعة.</div>`;
    return;
  }

  const gradeTables = Object.values(result.grades).sort((a, b) => a.grade_number - b.grade_number).map(grade => {
    const classItems = values.filter(item => item.grade_number === grade.grade_number);
    if (!classItems.length) return "";
    const activeCategories = categoriesWithData([grade, ...classItems], mode);
    const rows = activeCategories.map(category => [
      categoryLabel(category),
      ...classItems.map(item => item.counts[category] || 0),
      grade.counts[category] || 0
    ]);
    rows.push(["الإجمالي", ...classItems.map(item => item.total), grade.total]);
    rows.push(["المتوسط", ...classItems.map(item => `${formatNumber(item.average)}%`), `${formatNumber(grade.average)}%`]);
    return `<section class="section-block class-analysis-block">
      <h3>تحليل النتائج على مستوى فصول ${escapeHtml(grade.grade_name)}</h3>
      ${buildTable(["مستوى التحصيل", ...classItems.map(item => `الفصل ${item.class_label}`), "مجموع الصف"], rows)}
    </section>`;
  }).join("");

  const activeClassCategories = categoriesWithData(values, mode);
  el.classesTab.innerHTML = `
    ${gradeTables}
    <section class="section-block">
      <h3>مؤشرات الفصول</h3>
      <div class="cards-grid">${values.map(item => `
        <article class="summary-card">
          <h3>الفصل ${escapeHtml(item.class_label)}</h3>
          <div class="meta"><span>عدد الطلاب</span><strong>${item.total}</strong></div>
          <div class="meta"><span>المتوسط</span><strong>${formatNumber(item.average)}%</strong></div>
          <div class="meta"><span>ممتاز فأعلى</span><strong>${item.excellent_including_100}</strong></div>
          <div class="meta"><span>أولى بالرعاية</span><strong>${item.at_risk_count}</strong></div>
        </article>`).join("")}</div>
    </section>
    <section class="section-block">
      <h3>مقارنة متوسطات الفصول</h3>
      ${buildBarChart(values.map(item => ({label: item.class_label, value: item.average, display: formatNumber(item.average)})), "%")}
      ${buildTable(["الفصل", "الصف", "الطلاب", "المتوسط", ...categoryHeaders(mode, activeClassCategories), "أولى بالرعاية"], values.map(item => [
        item.class_label, item.grade_name, item.total, `${formatNumber(item.average)}%`,
        ...categoryValues(item, mode, activeClassCategories), item.at_risk_count
      ]))}
    </section>`;
}

function renderTop(result) {
  const mode = MODES[result.mode_id];
  const classItems = Object.values(result.classes).sort((a, b) =>
    a.grade_number - b.grade_number || Number(a.class_label.split("/")[1] || 0) - Number(b.class_label.split("/")[1] || 0)
  );
  const hasClassAnalysis = mode.supportsClassAnalysis && classItems.length > 0;
  if (!hasClassAnalysis) {
    let html = `<section class="section-block"><h3>العشرة الأوائل على مستوى المدرسة</h3>${buildTable(["الترتيب", "اسم الطالب", "الصف", "المعدل"], result.top_students_school.map(item => [item.rank, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]), 1)}</section>`;
    html += Object.values(result.grades).map(grade => `
      <section class="section-block">
        <h3>${result.mode_id === "past" ? "فرسان" : "العشرة الأوائل —"} ${escapeHtml(grade.grade_name)}</h3>
        ${buildTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], grade.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), 1)}
      </section>`).join("");
    el.topTab.innerHTML = html;
    return;
  }
  let html = `<section class="section-block"><h3>العشرة الأوائل على مستوى المدرسة</h3>${buildTable(["الترتيب", "اسم الطالب", "الصف", "الفصل", "المعدل"], result.top_students_school.map(item => [item.rank, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]), 1)}</section>`;
  for (const grade of Object.values(result.grades).sort((a, b) => a.grade_number - b.grade_number)) html += `<section class="section-block"><h3>العشرة الأوائل — ${escapeHtml(grade.grade_name)}</h3>${buildTable(["الترتيب", "اسم الطالب", "الفصل", "المعدل"], grade.top_students.map(item => [item.rank, item.student_name, item.class_label, `${formatNumber(item.average)}%`]), 1)}</section>`;
  html += `<section class="section-block"><h3>أفضل خمسة طلاب في كل فصل</h3>`;
  for (const classItem of classItems) html += `<h4>الفصل ${escapeHtml(classItem.class_label)}</h4>${buildTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], classItem.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]), 1)}`;
  el.topTab.innerHTML = html + `</section>`;
}

function renderRisk(result) {
  if (!result.at_risk_students.length) {
    el.riskTab.innerHTML = `<div class="narrative">لا يوجد طلاب حاصلون على أقل من ${result.threshold}%.</div>`;
    return;
  }
  const withClasses = MODES[result.mode_id].supportsClassAnalysis && Object.keys(result.classes).length > 0;
  const headers = withClasses ? ["م", "اسم الطالب", "الصف", "الفصل", "المعدل"] : ["م", "اسم الطالب", "الصف", "المعدل"];
  const rows = result.at_risk_students.map((item, index) => withClasses
    ? [index + 1, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]
    : [index + 1, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]);
  el.riskTab.innerHTML = `<section class="section-block"><h3>الطلاب الحاصلون على أقل من ${result.threshold}% <span class="badge danger">${result.at_risk_count} طلاب</span></h3>${buildTable(headers, rows, 1)}<div class="narrative">هذه القائمة مبنية على المعدل فقط. تُضاف الظروف الخاصة وخطة المتابعة من خانة ملاحظات المدرسة.</div></section>`;
}
function renderSubjects(result) {
  if (!result.subject_summary.length) {
    el.subjectsTab.innerHTML = `<div class="narrative">لم يتم العثور على بيانات مواد قابلة للتحليل في الملفات المختارة.</div>`;
    return;
  }
  const rows = result.subject_summary.map(item => [item.subject, `${formatNumber(item.average)}%`, item.students]);
  const chart = result.subject_summary.slice().sort((a, b) => a.average - b.average).slice(0, 12).map(item => ({label: item.subject, value: item.average, display: formatNumber(item.average)}));
  el.subjectsTab.innerHTML = `<section class="section-block"><h3>متوسطات المواد</h3>${buildTable(["المادة", "متوسط الدرجة", "عدد الطلاب"], rows, 0)}<h3>المواد الأقل متوسطًا</h3>${buildBarChart(chart, "%")}</section>`;
}
function renderFinalExams(result) {
  const mode = MODES[result.mode_id];
  if (!mode.supportsFinalExams) {
    el.finalExamsTab.innerHTML = "";
    return;
  }
  if (!result.final_exam_summary.length) {
    el.finalExamsTab.innerHTML = `<div class="narrative"><strong>لم يتم العثور على درجات اختبار نهاية الفصل.</strong><p>لإظهار ضعاف المواد ارفع ملفات النتائج التفصيلية التي يظهر فيها عمود «اختبار نهاية الفصل» داخل كشف كل طالب. ملفات المعدلات أو النتائج المجمعة فقط لا تحتوي على التفاصيل اللازمة.</p></div>`;
    return;
  }
  const summaryRows = result.final_exam_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]);
  const hasClasses = result.final_exam_weak_students.some(item => item.class_label);
  const detailHeaders = hasClasses
    ? ["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"]
    : ["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"];
  const detailRows = result.final_exam_weak_students.map((item, index) => hasClasses
    ? [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]
    : [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]);
  const weakDetails = detailRows.length
    ? buildTable(detailHeaders, detailRows, 1)
    : `<div class="narrative">لا يوجد طلاب أقل من ${result.final_exam_threshold}% في اختبار نهاية الفصل.</div>`;
  el.finalExamsTab.innerHTML = `
    <section class="section-block">
      <h3>ملخص ضعف المواد في اختبار نهاية الفصل — أقل من ${result.final_exam_threshold}%</h3>
      <div class="narrative">تُحسب النسبة بقسمة درجة الطالب في اختبار نهاية الفصل على الدرجة القصوى للاختبار في المادة. الحد الافتراضي أقل من 50%، ويمكن تعديله قبل التحليل. المواد التي لا تحتوي على اختبار نهاية فصل تُستبعد تلقائيًا.</div>
      ${buildTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب المقيمون", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], summaryRows, 1)}
      <h3>قائمة الطلاب الضعاف حسب المادة <span class="badge danger">${result.final_exam_weak_count} حالة</span></h3>
      ${weakDetails}
    </section>`;
}

function renderShortTests(result) {
  if (result.mode_id !== "period") {
    el.shortTestsTab.innerHTML = "";
    return;
  }
  if (!result.short_test_summary.length) {
    el.shortTestsTab.innerHTML = `<div class="narrative"><strong>لم يتم العثور على درجات الاختبارات القصيرة.</strong><p>ملفات «معدلات جميع الطلاب» تحتوي على المعدل العام فقط. لإظهار ضعاف المواد ارفع كشوف الطلاب التفصيلية التي يظهر فيها عمود «اختبارات قصيرة».</p></div>`;
    return;
  }
  const summaryRows = result.short_test_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]);
  const hasClasses = result.short_test_weak_students.some(item => item.class_label);
  const detailHeaders = hasClasses
    ? ["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"]
    : ["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"];
  const detailRows = result.short_test_weak_students.map((item, index) => hasClasses
    ? [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]
    : [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]);
  el.shortTestsTab.innerHTML = `
    <section class="section-block">
      <h3>ملخص ضعف المواد في الاختبار القصير — أقل من ${result.short_test_threshold}%</h3>
      <div class="narrative">تُحسب نسبة الطالب بقسمة درجته على الدرجة القصوى المخصصة للاختبار القصير في المادة. يُعد الطالب ضعيفًا عندما تكون النسبة أقل من الحد المحدد، والحد الافتراضي 50%. المواد التي لا تحتوي على اختبار قصير تُستبعد تلقائيًا.</div>
      ${buildTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب المقيمون", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], summaryRows, 1)}
      <h3>قائمة الطلاب الضعاف حسب المادة <span class="badge danger">${result.short_test_weak_count} حالة</span></h3>
      ${buildTable(detailHeaders, detailRows, 1)}
    </section>`;
}

function renderResult(result) {
  state.result = result;
  if (el.saveAnalysisButton) el.saveAnalysisButton.hidden = !(state.user && state.profile?.role === "admin");
  const mode = MODES[result.mode_id];
  el.resultsPanel.hidden = false;
  const hasClassAnalysis = mode.supportsClassAnalysis && Object.keys(result.classes).length > 0;
  el.classesTabButton.hidden = !hasClassAnalysis;
  el.shortTestsTabButton.hidden = !mode.supportsShortTests;
  el.finalExamsTabButton.hidden = !mode.supportsFinalExams;
  const activeTab = document.querySelector(".tab.active")?.dataset.tab;
  if (
    (!hasClassAnalysis && activeTab === "classes") ||
    (!mode.supportsShortTests && activeTab === "shortTests") ||
    (!mode.supportsFinalExams && activeTab === "finalExams")
  ) setActiveTab("overview");
  el.resultModeBadge.textContent = mode.name;
  const school = result.metadata.school_name || result.school_name_detected || "المدرسة";
  const year = result.metadata.academic_year || result.academic_year_hijri_detected || "";
  el.resultsSubtitle.textContent = `${school}${year ? ` — ${year}` : ""}`;
  if (el.printReportTitle) el.printReportTitle.textContent = result.metadata.report_title || mode.reportTitle || "تحليل النتائج التعليمية";
  if (el.printSchoolName) el.printSchoolName.textContent = school;
  if (el.printPeriodYear) {
    const period = result.metadata.period || result.period_detected || mode.period || "";
    el.printPeriodYear.textContent = [period, year].filter(Boolean).join(" - ");
  }
  renderKpis(result);
  renderOverview(result);
  renderClasses(result);
  renderTop(result);
  renderRisk(result);
  renderSubjects(result);
  renderFinalExams(result);
  renderShortTests(result);
  setActiveTab("overview");
  el.resultsPanel.scrollIntoView({behavior: "smooth", block: "start"});
}

function reportTable(headers, rows) {
  return `<table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function reportObjectives(modeId) {
  if (modeId === "past") return [
    "الوقوف على المستوى الفعلي للطلاب من واقع نتائج العام الماضي.", "التعرف على نسب الطلاب في مستويات التحصيل المختلفة على مستوى كل صف.",
    "مقارنة متوسطات الصفوف المرفوعة وتحديد الصف الأعلى أداءً.", "حصر العشرة الأوائل في كل صف وتقديم برامج إثرائية مناسبة لهم.",
    "تحديد الطلاب الأولى بالرعاية ووضع توصيات داعمة لهم.", "رصد ضعاف المواد في اختبار نهاية الفصل وفق نسبة ضعف قابلة للتعديل.", "الخروج بتوصيات وفقًا لمؤشرات التقرير."
  ];
  if (modeId === "period") return [
    "الوقوف على المستوى الفعلي للطلاب خلال الفترة المحددة.", "تحليل مستويات التحصيل على مستوى كل صف وكل فصل.",
    "حصر العشرة الأوائل في كل صف وأفضل خمسة طلاب في كل فصل.", "رصد ضعاف المواد في الاختبارات القصيرة وفق نسبة ضعف قابلة للتعديل.",
    "تحديد المواد الأعلى في عدد حالات الضعف واقتراح تدخلات علاجية سريعة.", "الخروج بتوصيات وفقًا لمؤشرات الفترة."
  ];
  return [
    "الوقوف على المستوى الفعلي للطلاب من واقع الاختبارات.", "التعرف على نسبة الطلاب الممتازين والعمل على زيادتها.",
    "التعرف على الطلاب الحاصلين على جيد أو أقل وتقديم البرامج المناسبة لهم.", "المقارنة بين فصول الصف الواحد ومعرفة الفروق في المستوى التحصيلي.",
    "مقارنة متوسط كل فصل وتعزيز أعلى نسبة.", "حصر العشرة الأوائل في كل صف وأفضل خمسة طلاب في كل فصل.", "رصد ضعاف المواد في اختبار نهاية الفصل وفق نسبة ضعف قابلة للتعديل.", "الخروج بتوصيات وفقًا لنتائج التقرير."
  ];
}
function wordReportHtml(result, brandLogos = {}) {
  const mode = MODES[result.mode_id];
  const metadata = result.metadata;
  const school = metadata.school_name || result.school_name_detected || "المدرسة";
  const year = metadata.academic_year || result.academic_year_hijri_detected || "";
  const gradeItems = Object.values(result.grades);
  const activeSchoolCategories = categoriesWithData(gradeItems, mode);
  const gradeRows = gradeItems.map(grade => [
    grade.grade_name,
    ...categoryValues(grade, mode, activeSchoolCategories),
    grade.total,
    `${formatNumber(grade.average)}%`
  ]);
  const objectives = reportObjectives(result.mode_id);
  const mechanism = result.mode_id === "past"
    ? ["توزيع الطلاب على مستويات: 100%، ممتاز، جيد جدًا، جيد، مقبول.", "إعداد إحصائية مجمعة لكل صف على حدة.", "حساب متوسطات الصفوف والمواد وحصر العشرة الأوائل والطلاب الأولى بالرعاية.", `تحويل درجات اختبار نهاية الفصل إلى نسب مئوية ورصد النتائج الأقل من ${result.final_exam_threshold}%.`]
    : result.mode_id === "period"
      ? ["استخراج المعدل من الملف، أو حسابه تلقائيًا من مجموع درجات المواد ودرجاتها القصوى عند غيابه.", "توزيع الطلاب على مستويات التحصيل وحساب متوسط كل صف وكل فصل وحصر الأوائل والطلاب الأولى بالرعاية.", "إعداد جدول تحليل مستقل لفصول كل صف وحصر أفضل خمسة طلاب في كل فصل.", `تحويل درجات الاختبارات القصيرة إلى نسب مئوية ورصد النسب الأقل من ${result.short_test_threshold}%.`]
      : ["توزيع الطلاب على مستويات: 100%، ممتاز، جيد جدًا، جيد، مقبول، ضعيف.", "إعداد إحصائية مجمعة لكل فصل ولكل صف.", "حساب متوسطات الفصول والمواد وتحديد الطلاب الأولى بالرعاية والأوائل.", `تحويل درجات اختبار نهاية الفصل إلى نسب مئوية ورصد النتائج الأقل من ${result.final_exam_threshold}%.`];

  const schoolLogo = brandLogos.school || BRAND_ASSETS.school;
  const guidanceLogo = brandLogos.guidance || BRAND_ASSETS.guidance;
  const classItemsAll = Object.values(result.classes).sort((a, b) => a.grade_number - b.grade_number || Number(a.class_label.split("/")[1] || 0) - Number(b.class_label.split("/")[1] || 0));
  const hasClassAnalysis = mode.supportsClassAnalysis && classItemsAll.length > 0;
  let body = `
    <div class="cover">
      <table class="brand-table" role="presentation"><tr>
        <td class="brand-logo"><img src="${schoolLogo}" width="120" height="86" alt="شعار المدرسة"></td>
        <td class="brand-heading"><span>مدارس المشكاة الأهلية بالدمام</span><strong>إدارة التوجيه الطلابي</strong></td>
        <td class="brand-logo guidance-brand"><img src="${guidanceLogo}" width="170" height="72" alt="شعار التوجيه الطلابي"></td>
      </tr></table>
      <div class="cover-line"></div>
      <div class="cover-content"><h1>${escapeHtml(metadata.report_title)}</h1><h2>${escapeHtml(school)}</h2><p>${escapeHtml(metadata.period)} ${year ? `- ${escapeHtml(year)}` : ""}</p></div>
      <div class="cover-tag">منصة التحليل الذكي للنتائج التعليمية</div>
    </div>
    <div class="page-break"></div>
    <h2>أهداف التقرير</h2><ul>${objectives.map(item => `<li>${item}</li>`).join("")}</ul>
    <h2>آلية إعداد التقرير</h2><ul>${mechanism.map(item => `<li>${item}</li>`).join("")}</ul>
    <h2>أولًا: التحليل العام على مستوى المدرسة</h2>
    <p class="lead">${escapeHtml(result.narrative.opening)}</p>
    <table class="summary-table"><tr>
      <td><span>إجمالي الطلاب</span><strong>${result.overall.total.toLocaleString("ar-EG")}</strong></td>
      <td><span>المتوسط العام</span><strong>${formatNumber(result.overall.average)}%</strong></td>
      <td><span>ممتاز فأعلى</span><strong>${formatNumber(result.overall.excellent_rate_including_100)}%</strong></td>
      <td class="summary-warning"><span>أقل من ${result.threshold}%</span><strong>${result.at_risk_count.toLocaleString("ar-EG")}</strong></td>
    </tr></table>
    ${reportTable(["الصف", ...categoryHeaders(mode, activeSchoolCategories), "الإجمالي", "المتوسط"], gradeRows)}
    <div class="notice"><b>إجمالي الطلاب الأقل من ${result.threshold}%:</b> ${result.at_risk_count} طالبًا.</div>`;

  if (!hasClassAnalysis) {
    for (const grade of Object.values(result.grades)) {
      body += `<div class="page-break"></div><h2>${result.mode_id === "past" ? "فرسان" : "العشرة الأوائل —"} ${escapeHtml(grade.grade_name)}</h2>`;
      if (metadata.include_names) body += reportTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], grade.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]));
      else body += `<p>تم إخفاء أسماء الطلاب حسب إعدادات التصدير.</p>`;
    }
  } else {
    for (const grade of Object.values(result.grades)) {
      const classItems = Object.values(result.classes).filter(item => item.grade_number === grade.grade_number);
      const activeCategories = categoriesWithData([grade, ...classItems], mode);
      const rows = activeCategories.map(category => [categoryLabel(category), ...classItems.map(item => item.counts[category] || 0), grade.counts[category] || 0]);
      rows.push(["الإجمالي", ...classItems.map(item => item.total), grade.total]);
      rows.push(["المتوسط", ...classItems.map(item => `${formatNumber(item.average)}%`), `${formatNumber(grade.average)}%`]);
      body += `<div class="page-break"></div><h2>تحليل ${escapeHtml(grade.grade_name)}</h2>${reportTable(["التقدير", ...classItems.map(item => item.class_label), "المجموع"], rows)}`;
      if (metadata.include_names) {
        body += `<h3>العشرة الأوائل — ${escapeHtml(grade.grade_name)}</h3>${reportTable(["الترتيب", "اسم الطالب", "الفصل", "المعدل"], grade.top_students.map(item => [item.rank, item.student_name, item.class_label, `${formatNumber(item.average)}%`]))}`;
        body += `<h3>أفضل خمسة طلاب في فصول ${escapeHtml(grade.grade_name)}</h3>`;
        for (const classItem of classItems) body += `<h4>الفصل ${escapeHtml(classItem.class_label)}</h4>${reportTable(["الترتيب", "اسم الطالب", "المعدل", "التقدير"], classItem.top_students.map(item => [item.rank, item.student_name, `${formatNumber(item.average)}%`, item.category]))}`;
      }
    }
  }

  body += `<div class="page-break"></div><h2>قراءة تحليلية للنتائج</h2><p class="lead">${escapeHtml(result.narrative.opening)}</p><ul>${result.narrative.insights.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  if (result.narrative.school_notes) body += `<h3>ملاحظات المدرسة</h3><p>${escapeHtml(result.narrative.school_notes)}</p>`;
  body += `<h2>دلالات وتوصيات</h2><ul>${result.narrative.recommendations.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  if (metadata.include_names) {
    const headers = hasClassAnalysis ? ["م", "اسم الطالب", "الصف", "الفصل", "المعدل"] : ["م", "اسم الطالب", "الصف", "المعدل"];
    const rows = result.at_risk_students.map((item, index) => hasClassAnalysis
      ? [index + 1, item.student_name, item.grade_name, item.class_label, `${formatNumber(item.average)}%`]
      : [index + 1, item.student_name, item.grade_name, `${formatNumber(item.average)}%`]);
    body += `<h2>الطلاب الأولى بالرعاية</h2>${rows.length ? reportTable(headers, rows) : "<p>لا يوجد طلاب أقل من الحد المحدد.</p>"}`;
  }
  if (mode.supportsFinalExams) {
    body += `<h2>ضعاف المواد في اختبار نهاية الفصل — أقل من ${result.final_exam_threshold}%</h2>`;
    if (result.final_exam_summary.length) {
      body += reportTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب", "عدد الضعاف", "نسبة الضعف", "متوسط الاختبار"], result.final_exam_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`, `${formatNumber(item.average_percent)}%`]));
      if (metadata.include_names) {
        if (result.final_exam_weak_students.length) body += hasClassAnalysis
          ? reportTable(["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.final_exam_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]))
          : reportTable(["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.final_exam_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]));
        else body += `<p>لا يوجد طلاب أقل من ${result.final_exam_threshold}% في اختبار نهاية الفصل.</p>`;
      }
    } else body += `<p>لم تتوافر درجات تفصيلية لاختبار نهاية الفصل في الملفات المرفوعة.</p>`;
  }
  if (result.mode_id === "period") {
    body += `<h2>ضعاف المواد في الاختبار القصير — أقل من ${result.short_test_threshold}%</h2>`;
    if (result.short_test_summary.length) {
      body += reportTable(["الصف", "المادة", "الدرجة القصوى", "الطلاب", "عدد الضعاف", "نسبة الضعف"], result.short_test_summary.map(item => [item.grade_name, item.subject, formatNumber(item.max_score, 2), item.students, item.weak_count, `${formatNumber(item.weak_rate)}%`]));
      if (metadata.include_names) body += hasClassAnalysis
        ? reportTable(["م", "اسم الطالب", "الصف", "الفصل", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.short_test_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.class_label, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]))
        : reportTable(["م", "اسم الطالب", "الصف", "المادة", "الدرجة", "الدرجة القصوى", "النسبة"], result.short_test_weak_students.map((item, index) => [index + 1, item.student_name, item.grade_name, item.subject, formatNumber(item.score, 2), formatNumber(item.max_score, 2), `${formatNumber(item.percentage)}%`]));
    } else body += `<p>لم تتوافر درجات تفصيلية للاختبارات القصيرة في الملفات المرفوعة.</p>`;
  }
  if (result.subject_summary.length) body += `<h2>متوسطات المواد</h2>${reportTable(["المادة", "المتوسط", "عدد الطلاب"], result.subject_summary.map(item => [item.subject, `${formatNumber(item.average)}%`, item.students]))}`;
  body += `<table class="report-end" role="presentation"><tr><td><img src="${schoolLogo}" width="82" height="58" alt="شعار المدرسة"></td><td><strong>مدارس المشكاة الأهلية</strong><span>إدارة التوجيه الطلابي - تقرير مولد من منصة تحليل النتائج التعليمية</span></td><td><img src="${guidanceLogo}" width="125" height="52" alt="شعار التوجيه الطلابي"></td></tr></table>`;

  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
    @page{size:21cm 29.7cm;margin:1.35cm 1.25cm 1.55cm}html,body{margin:0;padding:0;background:#fff}body{font-family:Cairo,Arial,Tahoma,sans-serif;direction:rtl;color:#19303f;line-height:1.72;font-size:10.5pt}
    *{box-sizing:border-box}h1,h2,h3,h4{page-break-after:avoid}h1{color:#073f65}h2{color:#073f65;font-size:16pt;margin:22px 0 12px;padding:8px 12px;border-right:5px solid #73a944;border-bottom:1px solid #c9dce4;background:#f2f8fa}h3{color:#39752f;font-size:13pt;margin:18px 0 9px}h4{color:#294252;font-size:11.5pt;margin:16px 0 8px}
    .cover{text-align:center;padding:28px 26px 20px;height:24.2cm;border:8px solid #eaf4f7;outline:2px solid #0b628f;outline-offset:-14px;position:relative;page-break-after:always;page-break-inside:avoid;overflow:hidden}.brand-table{width:100%;border:0;border-collapse:collapse;margin:0;padding:0;border-bottom:1px solid #cbdde5}.brand-table td{border:0;padding:5px;vertical-align:middle;background:#fff}.brand-logo{width:25%;text-align:center}.brand-heading{width:50%;text-align:center}.brand-heading span,.brand-heading strong{display:block}.brand-heading span{font-size:10.5pt;color:#607684}.brand-heading strong{font-size:16pt;color:#073f65;margin-top:5px}.cover-line{height:6px;background:#0b628f;margin:22px auto 82px;width:72%;border-right:58px solid #73a944;border-left:58px solid #f7941d}.cover-content{margin:0 auto}.cover h1{font-size:24pt;margin:0 0 12px;line-height:1.35}.cover h2{font-size:17pt;color:#39752f;background:none;border:0;padding:0;margin:0 0 8px}.cover p{font-size:12.5pt;color:#607684}.cover-tag{margin:72px auto 0;display:inline-block;padding:8px 18px;background:#eef7e9;border:1px solid #c9dec0;color:#39752f;border-radius:20px}
    .summary-table{border:0;border-collapse:separate;border-spacing:6px;margin:10px 0 18px}.summary-table td{border:1px solid #c9dce4;background:#f4fafc;padding:12px 6px;width:25%}.summary-table span,.summary-table strong{display:block}.summary-table span{font-size:9pt;color:#607684}.summary-table strong{font-size:17pt;color:#0b628f;margin-top:4px}.summary-table .summary-warning{background:#fff7e9;border-color:#f1d7a1}.summary-table .summary-warning strong{color:#a45e00}
    table{width:100%;border-collapse:collapse;margin:10px 0 18px;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid;page-break-after:auto}th,td{border:1px solid #8ca0aa;padding:6px 5px;text-align:center;vertical-align:middle}th{background:#0b628f;color:#fff;font-weight:700}tbody tr:nth-child(even) td{background:#f4f8fa}tbody tr:last-child td{border-bottom:2px solid #39752f}.lead{font-size:11.5pt;font-weight:bold;color:#294252;background:#f7fbf4;border-right:4px solid #73a944;padding:10px 12px}.notice{background:#fff7e9;border:1px solid #f1d7a1;border-right:5px solid #f7941d;padding:9px 12px;margin:10px 0 18px}.page-break{page-break-before:always}li{margin-bottom:5px}.report-end{width:100%;margin-top:28px;border-collapse:collapse;border:0;border-top:3px solid #0b628f;color:#607684}.report-end td{border:0;padding:10px 6px;vertical-align:middle;background:#fff}.report-end td:first-child,.report-end td:last-child{width:22%;text-align:center}.report-end td:nth-child(2){text-align:center}.report-end strong,.report-end span{display:block}.report-end strong{color:#073f65;font-size:12pt}.report-end span{font-size:8.5pt}
  </style></head><body>${body}</body></html>`;
}
async function downloadWord() {
  if (!state.result) return;
  const originalText = el.exportButton.textContent;
  el.exportButton.disabled = true;
  el.exportButton.textContent = "جارٍ تجهيز التقرير...";
  try {
    const brandLogos = await getBrandData();
    const html = "\ufeff" + wordReportHtml(state.result, brandLogos);
    const blob = new Blob([html], {type: "application/msword;charset=utf-8"});
    const school = state.result.metadata.school_name || state.result.school_name_detected || "المدرسة";
    const safeSchool = school.replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
    const safeTitle = state.result.metadata.report_title.replace(/[\\/:*?"<>|]/g, "").slice(0, 60);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${safeTitle} - ${safeSchool}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) {
    console.error(error);
    showStatus("تعذر تجهيز تقرير Word. أعد المحاولة أو استخدم الطباعة بصيغة PDF.", true);
  } finally {
    el.exportButton.disabled = false;
    el.exportButton.textContent = originalText;
  }
}

async function analyzeFiles() {
  if (!state.mode) { showStatus("اختر نوع التحليل أولًا.", true); return; }
  if (!state.files.length) { showStatus("اختر ملف Excel واحدًا على الأقل.", true); return; }
  const grades = state.files.map(item => item.grade);
  if (state.mode !== "period" && new Set(grades).size !== grades.length) {
    showStatus("لا يمكن رفع ملفين للصف الدراسي نفسه في هذا النوع من التحليل.", true);
    return;
  }
  const threshold = Number(el.threshold.value || 85);
  const shortTestThreshold = Number(el.shortTestThreshold.value || 50);
  const finalExamThreshold = Number(el.finalExamThreshold.value || 50);
  if (!(threshold >= 0 && threshold <= 100)) { showStatus("حد الرعاية يجب أن يكون بين 0 و100.", true); return; }
  if (!(shortTestThreshold >= 0 && shortTestThreshold <= 100)) { showStatus("نسبة ضعف الاختبار القصير يجب أن تكون بين 0 و100.", true); return; }
  if (!(finalExamThreshold >= 0 && finalExamThreshold <= 100)) { showStatus("نسبة ضعف اختبار نهاية الفصل يجب أن تكون بين 0 و100.", true); return; }

  el.analyzeButton.disabled = true;
  el.analyzeButton.textContent = "جارٍ التحليل...";
  showStatus("جارٍ قراءة ملفات Excel. قد تستغرق العملية عدة ثوانٍ...");
  try {
    let records = [];
    for (let index = 0; index < state.files.length; index++) {
      const item = state.files[index];
      showStatus(`جارٍ تحليل ${item.file.name} (${index + 1}/${state.files.length})...`);
      records = records.concat(await parseWorkbook(item.file, item.grade, state.mode));
    }
    if (state.mode === "period") records = mergePeriodRecords(records, state.mode);
    const result = analyzeRecords(records, threshold, el.notes.value, state.mode, shortTestThreshold, finalExamThreshold);
    result.metadata = {
      school_name: cleanText(el.schoolName.value),
      academic_year: cleanText(el.academicYear.value),
      period: cleanText(el.period.value) || result.period_detected || activeMode().period,
      report_title: cleanText(el.reportTitle.value) || activeMode().reportTitle,
      include_names: el.includeNames.checked
    };
    renderResult(result);
    const calculatedMessage = result.calculated_average_count
      ? ` وتم حساب معدل ${result.calculated_average_count} طالبًا تلقائيًا من نتائج المواد.`
      : "";
    showStatus(`تم تحليل ${result.overall.total} طالبًا بنجاح بنمط «${result.mode_name}».${calculatedMessage}`);
  } catch (error) {
    console.error(error);
    showStatus(error?.message || "حدث خطأ أثناء تحليل الملفات.", true);
  } finally {
    el.analyzeButton.disabled = false;
    el.analyzeButton.textContent = "تحليل النتائج";
  }
}
function resetFilesAndResults() {
  state.files = [];
  state.result = null;
  el.fileInput.value = "";
  el.resultsPanel.hidden = true;
  renderFileList();
  hideStatus();
}
function setupTabs() {
  document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
    if (button.hidden) return;
    setActiveTab(button.dataset.tab);
  }));
}


function showDatabaseStatus(message, isError = false) {
  el.databaseStatus.hidden = false;
  el.databaseStatus.textContent = message;
  el.databaseStatus.classList.toggle("error", isError);
}
function hideDatabaseStatus() { el.databaseStatus.hidden = true; }
function roleLabel(role) { return role === "admin" ? "مدير — حفظ وتعديل وحذف" : "مستخدم عرض — فتح وتصدير فقط"; }
function modeDbName(mode) { return MODES[mode]?.name || mode; }
async function loadProfile(user) {
  if (!db || !user) return null;
  const {data, error} = await db.from("profiles").select("id,full_name,role,is_active").eq("id", user.id).single();
  if (error) throw error;
  return data;
}
async function applySession(session) {
  state.user = session?.user || null;
  state.profile = null;
  if (state.user) {
    try { state.profile = await loadProfile(state.user); }
    catch (error) { console.error(error); showDatabaseStatus("تم تسجيل الدخول، لكن تعذر تحميل الصلاحيات.", true); }
  }
  const loggedIn = Boolean(state.user && state.profile?.is_active);
  el.authGuest.hidden = loggedIn;
  el.authUser.hidden = !loggedIn;
  if (loggedIn) {
    el.currentUserName.textContent = state.profile.full_name || state.user.email;
    el.currentUserRole.textContent = roleLabel(state.profile.role);
    if (el.saveAnalysisButton) el.saveAnalysisButton.hidden = !(state.result && state.profile.role === "admin");
  } else {
    el.archivePanel.hidden = true;
    if (el.saveAnalysisButton) el.saveAnalysisButton.hidden = true;
  }
}
async function signIn() {
  hideDatabaseStatus();
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;
  if (!email || !password) return showDatabaseStatus("أدخل البريد الإلكتروني وكلمة المرور.", true);
  el.signInButton.disabled = true;
  try {
    const {data, error} = await db.auth.signInWithPassword({email, password});
    if (error) throw error;
    await applySession(data.session);
    showDatabaseStatus("تم تسجيل الدخول بنجاح.");
  } catch (error) { showDatabaseStatus(error.message || "تعذر تسجيل الدخول.", true); }
  finally { el.signInButton.disabled = false; }
}
async function signUp() {
  hideDatabaseStatus();
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;
  const full_name = el.authFullName.value.trim();
  if (!email || !password || !full_name) return showDatabaseStatus("أدخل الاسم والبريد وكلمة المرور لإنشاء الحساب.", true);
  if (password.length < 6) return showDatabaseStatus("كلمة المرور يجب ألا تقل عن 6 أحرف.", true);
  el.signUpButton.disabled = true;
  try {
    const {data, error} = await db.auth.signUp({email, password, options: {data: {full_name}}});
    if (error) throw error;
    if (data.session) {
      await applySession(data.session);
      showDatabaseStatus("تم إنشاء الحساب وتسجيل الدخول. أول حساب في القاعدة يحصل على صلاحية المدير تلقائيًا.");
    } else showDatabaseStatus("تم إنشاء الحساب. افتح رسالة تأكيد البريد الإلكتروني ثم سجّل الدخول.");
  } catch (error) { showDatabaseStatus(error.message || "تعذر إنشاء الحساب.", true); }
  finally { el.signUpButton.disabled = false; }
}
async function signOut() {
  await db.auth.signOut();
  await applySession(null);
  showDatabaseStatus("تم تسجيل الخروج.");
}
function buildSavedPayload() {
  const r = state.result;
  if (!r) throw new Error("لا يوجد تحليل لحفظه.");
  const meta = r.metadata || {};
  return {
    created_by: state.user.id,
    title: meta.report_title || modeDbName(state.mode),
    analysis_type: state.mode,
    school_name: meta.school_name || r.school_name_detected || "مدارس المشكاة الأهلية",
    academic_year: meta.academic_year || r.academic_year_detected || "",
    period_name: meta.period || r.period_detected || "",
    care_threshold: Number(el.threshold.value || 85),
    weakness_threshold: Number(state.mode === "period" ? el.shortTestThreshold.value : el.finalExamThreshold.value || 50),
    include_names: Boolean(meta.include_names),
    notes: el.notes.value.trim() || null,
    grade_labels: (r.grade_summaries || []).map(x => x.grade_name).filter(Boolean),
    student_count: r.overall?.total || 0,
    overall_average: r.overall?.average ?? null,
    weak_student_count: (r.at_risk_students || []).length,
    summary: {overall: r.overall, categories: r.overall?.categories || {}, mode_name: r.mode_name},
    report_data: r,
    app_version: "v12-database"
  };
}
async function saveCurrentAnalysis() {
  if (!state.user || state.profile?.role !== "admin") return showDatabaseStatus("الحفظ متاح لحساب المدير فقط.", true);
  if (!state.result) return;
  const original = el.saveAnalysisButton.textContent;
  el.saveAnalysisButton.disabled = true;
  el.saveAnalysisButton.textContent = "جارٍ الحفظ...";
  try {
    const {data, error} = await db.from("saved_analyses").insert(buildSavedPayload()).select("id").single();
    if (error) throw error;
    showDatabaseStatus(`تم حفظ التحليل في الأرشيف بنجاح. رقم الحفظ: ${data.id.slice(0, 8)}`);
    await loadArchive();
  } catch (error) { console.error(error); showDatabaseStatus(error.message || "تعذر حفظ التحليل.", true); }
  finally { el.saveAnalysisButton.disabled = false; el.saveAnalysisButton.textContent = original; }
}
function escapeHtmlDb(value) { return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch])); }
function renderArchive() {
  const q = el.archiveSearch.value.trim().toLowerCase();
  const t = el.archiveTypeFilter.value;
  const rows = state.archive.filter(item => (!t || item.analysis_type === t) && (!q || [item.title,item.academic_year,item.period_name,...(item.grade_labels||[])].join(" ").toLowerCase().includes(q)));
  if (!rows.length) { el.archiveList.innerHTML = '<div class="empty-state">لا توجد تحليلات مطابقة.</div>'; return; }
  el.archiveList.innerHTML = rows.map(item => `<article class="archive-card">
    <div class="archive-card-head"><div><span>${escapeHtmlDb(modeDbName(item.analysis_type))}</span><h3>${escapeHtmlDb(item.title)}</h3></div><time>${new Date(item.created_at).toLocaleString("ar-SA")}</time></div>
    <div class="archive-meta"><span>العام: ${escapeHtmlDb(item.academic_year || "—")}</span><span>الفترة: ${escapeHtmlDb(item.period_name || "—")}</span><span>الطلاب: ${item.student_count}</span><span>المتوسط: ${item.overall_average == null ? "—" : Number(item.overall_average).toFixed(2)+"%"}</span></div>
    <div class="archive-grades">${(item.grade_labels||[]).map(x=>`<b>${escapeHtmlDb(x)}</b>`).join("")}</div>
    <div class="actions inline-actions"><button class="primary-button" data-open-analysis="${item.id}" type="button">فتح التحليل</button>${state.profile?.role === "admin" ? `<button class="danger-button" data-delete-analysis="${item.id}" type="button">حذف</button>` : ""}</div>
  </article>`).join("");
  el.archiveList.querySelectorAll("[data-open-analysis]").forEach(b=>b.addEventListener("click",()=>openSavedAnalysis(b.dataset.openAnalysis)));
  el.archiveList.querySelectorAll("[data-delete-analysis]").forEach(b=>b.addEventListener("click",()=>deleteSavedAnalysis(b.dataset.deleteAnalysis)));
}
async function loadArchive() {
  if (!state.user) return;
  el.archiveList.innerHTML = '<div class="empty-state">جارٍ تحميل الأرشيف...</div>';
  const {data, error} = await db.from("saved_analyses").select("id,title,analysis_type,academic_year,period_name,grade_labels,student_count,overall_average,created_at").order("created_at", {ascending:false});
  if (error) { el.archiveList.innerHTML = `<div class="status-box error">${escapeHtmlDb(error.message)}</div>`; return; }
  state.archive = data || [];
  renderArchive();
}
async function openSavedAnalysis(id) {
  const {data, error} = await db.from("saved_analyses").select("report_data").eq("id", id).single();
  if (error) return showDatabaseStatus(error.message, true);
  const r = data.report_data;
  state.mode = r.mode || r.analysis_type || state.mode || "semester";
  document.querySelectorAll(".mode-card").forEach(card => { const selected = card.dataset.mode === state.mode; card.classList.toggle("selected", selected); card.setAttribute("aria-checked", selected ? "true" : "false"); });
  renderResult(r);
  el.archivePanel.hidden = true;
  showDatabaseStatus("تم فتح التحليل المحفوظ. يمكنك عرضه أو تصديره Word وPDF.");
}
async function deleteSavedAnalysis(id) {
  if (state.profile?.role !== "admin" || !confirm("هل تريد حذف هذا التحليل نهائيًا؟")) return;
  const {error} = await db.from("saved_analyses").delete().eq("id", id);
  if (error) return showDatabaseStatus(error.message, true);
  await loadArchive();
  showDatabaseStatus("تم حذف التحليل.");
}
async function initDatabase() {
  if (!db) return showDatabaseStatus("تعذر تحميل مكتبة الاتصال بقاعدة البيانات.", true);
  const {data} = await db.auth.getSession();
  await applySession(data.session);
  db.auth.onAuthStateChange((_event, session) => setTimeout(() => applySession(session), 0));
}

document.querySelectorAll(".mode-card").forEach(card => card.addEventListener("click", () => selectMode(card.dataset.mode)));
el.fileInput.addEventListener("change", event => setFiles(event.target.files));
el.dropZone.addEventListener("dragover", event => { event.preventDefault(); el.dropZone.classList.add("dragging"); });
el.dropZone.addEventListener("dragleave", () => el.dropZone.classList.remove("dragging"));
el.dropZone.addEventListener("drop", event => { event.preventDefault(); el.dropZone.classList.remove("dragging"); setFiles(event.dataTransfer.files); });
el.analyzeButton.addEventListener("click", analyzeFiles);
el.resetButton.addEventListener("click", resetFilesAndResults);
el.exportButton.addEventListener("click", downloadWord);
el.printButton.addEventListener("click", () => window.print());
el.signInButton?.addEventListener("click", signIn);
el.signUpButton?.addEventListener("click", signUp);
el.signOutButton?.addEventListener("click", signOut);
el.openArchiveButton?.addEventListener("click", async () => { el.archivePanel.hidden = !el.archivePanel.hidden; if (!el.archivePanel.hidden) { await loadArchive(); el.archivePanel.scrollIntoView({behavior:"smooth"}); } });
el.refreshArchiveButton?.addEventListener("click", loadArchive);
el.archiveSearch?.addEventListener("input", renderArchive);
el.archiveTypeFilter?.addEventListener("change", renderArchive);
el.saveAnalysisButton?.addEventListener("click", saveCurrentAnalysis);
setupTabs();
renderFileList();
initDatabase();

window.__APP_TEST__ = {selectMode, parseWorkbook, analyzeRecords, classifyAverage, parseTabularPeriodSheet, extractSubjectDetails, finalizeFinalExamRecords, inferFinalExamMax, mergePeriodRecords, inferGrade, inferClassNumber, gradeOrdinal, makeClassLabel, gradeOptionsHtml, categoriesWithData, categoryLabel, formatArabicList, renderOverview, renderClasses, wordReportHtml, getMode: id => MODES[id], getState: () => state};
