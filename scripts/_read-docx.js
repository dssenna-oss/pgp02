// Extrai texto de um .docx sem dependências externas — descompacta via
// fflate (já dependência transitiva do projeto) e grep nos <w:t>.
// Uso: node scripts/_read-docx.js <arquivo.docx>
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const file = process.argv[2];
if (!file) {
  console.error("Uso: node _read-docx.js <arquivo.docx>");
  process.exit(1);
}

// Parser ZIP minimalista (Local File Header)
function unzip(buf) {
  const files = {};
  let off = 0;
  while (off < buf.length - 4) {
    const sig = buf.readUInt32LE(off);
    if (sig !== 0x04034b50) break;
    const compMethod = buf.readUInt16LE(off + 8);
    const compSize = buf.readUInt32LE(off + 18);
    const uncompSize = buf.readUInt32LE(off + 22);
    const nameLen = buf.readUInt16LE(off + 26);
    const extraLen = buf.readUInt16LE(off + 28);
    const name = buf.slice(off + 30, off + 30 + nameLen).toString("utf-8");
    const dataStart = off + 30 + nameLen + extraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    let decompressed;
    if (compMethod === 0) decompressed = data;
    else if (compMethod === 8) decompressed = zlib.inflateRawSync(data);
    else throw new Error(`Método de compressão não suportado: ${compMethod}`);
    files[name] = decompressed;
    off = dataStart + compSize;
  }
  return files;
}

const buf = fs.readFileSync(file);
const files = unzip(buf);
const docXml = files["word/document.xml"]?.toString("utf-8");
if (!docXml) {
  console.error("word/document.xml não encontrado");
  process.exit(1);
}

// Extração: cada <w:p> = parágrafo, dentro tem <w:t>...</w:t> com texto.
// Concatena <w:t> dentro de cada <w:p>.
const paragraphs = [];
const pRegex = /<w:p[\s>][^]*?<\/w:p>/g;
let pMatch;
while ((pMatch = pRegex.exec(docXml)) !== null) {
  const pXml = pMatch[0];
  const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
  let text = "";
  let tMatch;
  while ((tMatch = tRegex.exec(pXml)) !== null) {
    text += tMatch[1];
  }
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  paragraphs.push(text);
}

console.log(paragraphs.filter(p => p.trim()).join("\n\n"));
