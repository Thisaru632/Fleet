const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* Form Content */}')) {
        startIdx = i;
    }
    if (startIdx !== -1 && lines[i].includes('{/* PWA Install Popup */}')) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    let section = lines.slice(startIdx, endIdx);
    let newSection = [];

    for (let i = 0; i < section.length; i++) {
        let line = section[i];

        // 1. ADD WRAPPER
        if (line.includes('<motion.div') && i + 1 < section.length && section[i + 1].includes('initial={{ opacity: 0, y: 20 }}') && i < 15) {
            newSection.push('          <div className="bg-[#f59e0b] p-1 sm:p-1.5 rounded-3xl max-w-md mx-auto">');
            newSection.push('            <div className="bg-[#f4f7f9] text-slate-800 font-sans p-4 sm:p-6 rounded-[22px] pb-10 min-h-[calc(100vh-1rem)] space-y-5">');
            newSection.push(line.replace('          <motion.div', '              <motion.div'));
            continue;
        }

        // 2. CLOSE WRAPPER
        if (line.includes('</motion.div>') && i + 1 < section.length && section[i + 1].trim() === ')}' && section[i + 2].trim() === '</AnimatePresence>' && i > section.length - 15) {
            newSection.push(line.replace('          </motion.div>', '              </motion.div>\n            </div>\n          </div>'));
            continue;
        }

        // Cards
        line = line.replace(/glass-card/g, 'bg-white rounded-3xl shadow-sm border border-slate-200/80');
        line = line.replace(/bg-slate-900\/60/g, 'bg-slate-50');

        // Buttons
        if (line.includes('btn-gradient')) {
            line = line.replace('btn-gradient text-white font-bold rounded-2xl', 'bg-[#18859c] hover:bg-[#157489] text-white font-extrabold rounded-3xl shadow-sm');
        }

        if (line.includes('hover:bg-white/5 transition-colors')) {
            line = line.replace('hover:bg-white/5 transition-colors', 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all font-extrabold shadow-sm rounded-3xl cursor-pointer');
        }

        if (line.includes('w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest')) {
            line = line.replace('w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest', 'w-full py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all text-xs font-extrabold uppercase tracking-wider shadow-sm cursor-pointer');
        }

        if (line.includes('mt-6 px-8 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold')) {
            line = line.replace('mt-6 px-8 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold', 'mt-6 px-8 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all text-sm font-extrabold shadow-sm cursor-pointer');
        }

        // Inputs
        if (line.includes('input-field')) {
            line = line.replace('input-field py-3 text-white bg-white/5 border-white/10', 'w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#18859c] transition-all font-medium shadow-inner py-3');
            line = line.replace('input-field py-3', 'w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#18859c] transition-all font-medium shadow-inner py-3');
            line = line.replace('input-field py-2 text-[10px]', 'w-full bg-slate-50 border border-slate-200 rounded-2xl p-2 text-[10px] text-slate-800 focus:outline-none focus:border-[#18859c] transition-all font-medium shadow-inner');
            line = line.replace('input-field py-2 pr-10 text-[10px]', 'w-full bg-slate-50 border border-slate-200 rounded-2xl p-2 pr-10 text-[10px] text-slate-800 focus:outline-none focus:border-[#18859c] transition-all font-medium shadow-inner');
        }

        // Text colors & Borders
        line = line.replace(/text-white/g, 'text-slate-900');
        line = line.replace(/text-slate-400/g, 'text-slate-500');
        line = line.replace(/text-slate-200/g, 'text-slate-600');
        line = line.replace(/border-white\/10/g, 'border-slate-200');
        line = line.replace(/border-white\/5/g, 'border-slate-100');
        line = line.replace(/bg-white\/5/g, 'bg-white');
        line = line.replace(/bg-white\/10/g, 'bg-slate-200');

        // Fix motion.div indentation inside the wrapper
        if (line.startsWith('          ') && !line.startsWith('            ')) {
            if (line.includes('motion.div') || line.includes('className="space-y-6"') || line.includes('initial={{') || line.includes('animate={{') || line.includes('exit={{')) {
                line = '  ' + line;
            }
        }

        newSection.push(line);
    }

    lines.splice(startIdx, endIdx - startIdx, ...newSection);

    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('Updated src/app/page.tsx successfully.');
} else {
    console.log('Section not found.');
}
