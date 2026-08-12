const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const searchRegex = /value=\{adjExclusionsComment\}\s*onChange=\{\(e\) => setAdjExclusionsComment\(e\.target\.value\)\}\s*\/>\s*<\/div>\s*<\/div>\s*\{\/\* Alert Component \*\/\}/;

const replaceString = `value={adjExclusionsComment}
                          onChange={(e) => setAdjExclusionsComment(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAdjustmentModal(false)}
                        disabled={savingAdjustment}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-wider"
                      >
                        CANCEL
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAdjustment}
                        disabled={savingAdjustment}
                        className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        {savingAdjustment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            SAVING...
                          </>
                        ) : (
                          'SAVE ADJUSTMENTS'
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            </>
          )}
        </div>
      )}

      {/* Alert Component */}`;

if(searchRegex.test(content)) {
  content = content.replace(searchRegex, replaceString);
  content = content.replace("{alert && stage !== 'new' && stage !== 'update' && (", "{alert && stage !== 'dashboard' && stage !== 'new' && stage !== 'update' && (");
  fs.writeFileSync('src/app/page.tsx', content);
  console.log('Fixed successfully');
} else {
  console.log('Search string not found!');
}
