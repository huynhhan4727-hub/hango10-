/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Word, Level, Category } from '../types';
import { CATEGORY_LABELS } from '../data/initialVocab';
import { 
  X, 
  Volume2, 
  Check, 
  Sparkles, 
  FileSpreadsheet,
  Edit3,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { playKoreanAudio } from '../utils/speech';
import { getHanjaAnalysis, getOnlineLookupUrls } from '../utils/bilingualLookup';
import { ExcelImportSection } from './ExcelImportSection';

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: Omit<Word, 'id'>, existingId?: string) => void;
  onBatchImport?: (words: Omit<Word, 'id'>[]) => void;
  initialWord?: Word | null;
  existingWords?: Word[];
}

type EntryMode = 'manual' | 'excel';

export const WordModal: React.FC<WordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onBatchImport,
  initialWord,
  existingWords = [],
}) => {
  // Mode: Manual entry or Excel import
  const [entryMode, setEntryMode] = useState<EntryMode>('manual');

  // Core required & primary fields
  const [hangul, setHangul] = useState('');
  const [romaja, setRomaja] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [english, setEnglish] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [category, setCategory] = useState<Category>('daily');

  // Optional extra details (expandable)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exampleKo, setExampleKo] = useState('');
  const [exampleVi, setExampleVi] = useState('');
  const [notes, setNotes] = useState('');
  const [hanja, setHanja] = useState('');

  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setEntryMode('manual');
    if (initialWord) {
      setHangul(initialWord.hangul);
      setRomaja(initialWord.romaja === '—' ? '' : initialWord.romaja);
      setVietnamese(initialWord.vietnamese || '');
      setEnglish(initialWord.english === '—' ? '' : initialWord.english || '');
      setLevel(initialWord.level);
      setCategory(initialWord.category);

      setExampleKo(initialWord.exampleKo || '');
      setExampleVi(initialWord.exampleVi || '');
      setNotes(initialWord.notes || '');
      setHanja(initialWord.hanja || '');

      // Open advanced section automatically if initial word has examples or notes
      const hasExtras = Boolean(
        initialWord.exampleKo || 
        initialWord.exampleVi || 
        initialWord.notes || 
        initialWord.hanja
      );
      setShowAdvanced(hasExtras);
    } else {
      setHangul('');
      setRomaja('');
      setVietnamese('');
      setEnglish('');
      setLevel('beginner');
      setCategory('daily');

      setExampleKo('');
      setExampleVi('');
      setNotes('');
      setHanja('');
      setShowAdvanced(false);
    }
    setError('');
  }, [initialWord, isOpen]);

  // Sino-Vietnamese (Hán - Hàn) quick analysis
  const hanjaAnalysis = useMemo(() => {
    return getHanjaAnalysis(hangul);
  }, [hangul]);

  // Online Naver lookup URL
  const lookupUrls = useMemo(() => {
    return getOnlineLookupUrls(hangul || '한국어');
  }, [hangul]);

  if (!isOpen) return null;

  const handleTestAudio = async () => {
    if (!hangul.trim()) return;
    setIsPlaying(true);
    await playKoreanAudio(hangul.trim());
    setIsPlaying(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hangul.trim()) {
      setError('Vui lòng nhập từ tiếng Hàn (Hangul)');
      return;
    }
    
    if (!vietnamese.trim() && !english.trim()) {
      setError('Vui lòng nhập nghĩa tiếng Việt');
      return;
    }

    onSave(
      {
        hangul: hangul.trim(),
        romaja: romaja.trim() || '—',
        vietnamese: vietnamese.trim() || english.trim(),
        english: english.trim() || vietnamese.trim(),
        level,
        category,
        exampleKo: exampleKo.trim(),
        exampleVi: exampleVi.trim(),
        exampleEn: initialWord?.exampleEn || '',
        notes: notes.trim(),
        hanja: hanja.trim(),
        partOfSpeech: initialWord?.partOfSpeech || 'noun',
        englishNotes: initialWord?.englishNotes || '',
        masteryLevel: initialWord ? initialWord.masteryLevel : 0,
        isFavorite: initialWord ? initialWord.isFavorite : false,
      },
      initialWord?.id
    );
    onClose();
  };

  return (
    <div 
      id="word-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="word-modal-container"
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
      >
        {/* Mobile pull indicator */}
        <div className="pt-2 sm:hidden flex justify-center bg-slate-50/80">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                {initialWord ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {entryMode === 'excel'
                  ? 'Nhập hàng loạt từ file Excel kèm file mẫu chuẩn'
                  : 'Giao diện nhập liệu tinh gọn, nhanh chóng'}
              </p>
            </div>
          </div>
          <button
            id="close-word-modal-btn"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer active:scale-90"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs: Manual Entry vs Excel Import (Only when adding new word) */}
        {!initialWord && (
          <div className="px-5 pt-3 pb-2 bg-slate-50/70 border-b border-slate-100">
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl gap-1">
              <button
                type="button"
                id="tab-mode-manual"
                onClick={() => setEntryMode('manual')}
                className={`flex-1 min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 select-none ${
                  entryMode === 'manual'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Nhập thủ công</span>
              </button>
              <button
                type="button"
                id="tab-mode-excel"
                onClick={() => setEntryMode('excel')}
                className={`flex-1 min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 select-none ${
                  entryMode === 'excel'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nhập từ Excel</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  Có file mẫu
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Render Excel Import View or Streamlined Manual Form */}
        {entryMode === 'excel' && !initialWord ? (
          <ExcelImportSection
            existingWords={existingWords}
            onBatchImport={onBatchImport}
            onClose={onClose}
            onSwitchToManual={() => setEntryMode('manual')}
          />
        ) : (
          /* Streamlined Form Body */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {/* HÀNG 1: TỪ TIẾNG HÀN & PHIÊN ÂM */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Hangul Word */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Từ tiếng Hàn (Hangul) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-hangul"
                    type="text"
                    placeholder="Ví dụ: 사과, 친구, 사랑하다"
                    value={hangul}
                    onChange={(e) => {
                      setHangul(e.target.value);
                      setError('');
                    }}
                    className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-base text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    id="test-audio-btn"
                    onClick={handleTestAudio}
                    disabled={!hangul.trim() || isPlaying}
                    title="Nghe phát âm chuẩn"
                    aria-label="Nghe phát âm chuẩn"
                    className="min-w-[42px] min-h-[42px] px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Romaja Pronunciation */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phiên âm (Romaja)
                </label>
                <input
                  id="input-romaja"
                  type="text"
                  placeholder="Ví dụ: sa-gwa, chin-gu"
                  value={romaja}
                  onChange={(e) => setRomaja(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* HÀNG 2: NGHĨA TIẾNG VIỆT & TIẾNG ANH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Vietnamese Meaning (Core) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nghĩa Tiếng Việt <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-vietnamese"
                  type="text"
                  placeholder="Ví dụ: Quả táo, Bạn bè, Yêu mến"
                  value={vietnamese}
                  onChange={(e) => {
                    setVietnamese(e.target.value);
                    setError('');
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/20 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                  required
                />
              </div>

              {/* English Meaning (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Nghĩa Tiếng Anh (English)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
                </label>
                <input
                  id="input-english"
                  type="text"
                  placeholder="Ví dụ: Apple, Friend, To love"
                  value={english}
                  onChange={(e) => setEnglish(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* HÀNG 3: CẤP ĐỘ & CHỦ ĐỀ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cấp độ (Level)
                </label>
                <select
                  id="select-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Level)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-semibold bg-white text-slate-800 cursor-pointer"
                >
                  <option value="beginner">Sơ cấp (초급)</option>
                  <option value="intermediate">Trung cấp (중급)</option>
                  <option value="advanced">Cao cấp (고급)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chủ đề (Category)
                </label>
                <select
                  id="select-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-semibold bg-white text-slate-800 cursor-pointer"
                >
                  {Object.entries(CATEGORY_LABELS).map(([catKey, catName]) => (
                    <option key={catKey} value={catKey}>
                      {catName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tra cứu nhanh từ điển (Gọn gàng 1 dòng) */}
            {hangul.trim() && (
              <div className="flex items-center justify-between text-xs py-1 px-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Tra nghĩa nhanh:
                </span>
                <a
                  href={lookupUrls.naverVi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 underline"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Mở từ điển Naver Hàn - Việt</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}

            {/* MỤC MỞ RỘNG (THÔNG TIN BỔ SUNG: VÍ DỤ, HÁN HÀN, GHI CHÚ) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>Thông tin bổ sung (Ví dụ & Ghi chú Hán Hàn)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {showAdvanced ? 'Nhấn để thu gọn' : 'Tùy chọn'}
                  </span>
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showAdvanced && (
                <div className="p-3.5 pt-1 space-y-3 border-t border-slate-200/70 bg-white">
                  {/* Câu ví dụ tiếng Hàn */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Câu ví dụ tiếng Hàn
                    </label>
                    <input
                      id="input-example-ko"
                      type="text"
                      placeholder="Ví dụ: 저는 매일 사과를 먹어요."
                      value={exampleKo}
                      onChange={(e) => setExampleKo(e.target.value)}
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Dịch câu ví dụ tiếng Việt */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dịch câu ví dụ (Tiếng Việt)
                    </label>
                    <input
                      id="input-example-vi"
                      type="text"
                      placeholder="Ví dụ: Tôi ăn táo mỗi ngày."
                      value={exampleVi}
                      onChange={(e) => setExampleVi(e.target.value)}
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Gợi ý Hán-Hàn thông minh dạng Chip bấm nhanh */}
                  {hangul.trim() && hanjaAnalysis.breakdown.length > 0 && (
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-center justify-between flex-wrap gap-1">
                      <span className="font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Gợi ý âm Hán-Hàn: <b>{hanjaAnalysis.fullSinoVi}</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setHanja(hanjaAnalysis.fullSinoVi);
                          if (!notes) {
                            setNotes(`Hán Hàn: ${hanjaAnalysis.fullSinoVi}`);
                          }
                        }}
                        className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-300 hover:bg-amber-100 cursor-pointer shadow-2xs"
                      >
                        + Áp dụng âm Hán
                      </button>
                    </div>
                  )}

                  {/* Âm Hán-Hàn & Ghi chú */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Âm Hán-Việt / Chữ Hán
                      </label>
                      <input
                        id="input-hanja"
                        type="text"
                        placeholder="Ví dụ: Học hiệu (學校)"
                        value={hanja}
                        onChange={(e) => setHanja(e.target.value)}
                        className="w-full min-h-[36px] px-3 py-1 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ghi chú ngữ pháp, mẹo nhớ
                      </label>
                      <input
                        id="input-notes"
                        type="text"
                        placeholder="Ví dụ: Đi kèm tiểu từ 을/를"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full min-h-[36px] px-3 py-1 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="cancel-modal-btn"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                id="submit-word-btn"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{initialWord ? 'Cập nhật từ vựng' : 'Lưu từ mới'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
