import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const contentMdPath = path.resolve(root, '.idea/pj/anti-scam/content.md');
const contentMd = fs.readFileSync(contentMdPath, 'utf8');

const secBlocks = contentMd.split(/## SECTION \d+:/).slice(1);

const titles = [
  'Nhận thức số & Bản đồ chiêu trò lừa đảo trực tuyến',
  'Bẫy Mạng Xã Hội, Game Online & Công nghệ Deepfake AI',
  'Bẫy Tài chính, Tiền ảo & Tuyển dụng "Việc nhẹ lương cao" cho Teen',
  'Kỹ thuật Phòng thủ số & Kịch bản Ứng phó Khủng hoảng'
];

const shortTitles = [
  'Nhận thức số & Dấu hiệu đỏ',
  'Bẫy MXH, Game & Deepfake',
  'Bẫy Tài chính & Việc làm Teen',
  'Phòng thủ & Ứng phó khẩn cấp'
];

const icons = ['🛡️', '🎮', '💸', '🚨'];

const sections = secBlocks.map((sec, idx) => {
  const parts = sec.split(/### \d+\.3\. Bài kiểm tra đánh giá/);
  const lessonPart = parts[0];
  const quizPart = parts[1] ? parts[1].split(/<\/details>/)[0] : '';

  // Extract overview / lessons
  const qMatches = [...quizPart.matchAll(/(\d+)\.\s+\*\*([^*]+)\*\*\s*\n([\s\S]*?)(?=(?:\d+\.\s+\*\*)|$)/g)];
  const questions = qMatches.slice(0, 20).map(qm => {
    const qNum = parseInt(qm[1], 10);
    const prompt = qm[2].trim();
    const optsBlock = qm[3];
    const opts = [...optsBlock.matchAll(/\*\s+([A-D])\.\s+([^\n]+)/g)];
    let correct = null;
    const cleanOpts = opts.map(o => {
      let isCorrect = o[2].includes('(Đáp án đúng)');
      if (isCorrect) correct = o[1];
      return {
        key: o[1],
        text: o[2].replace(/\s*\(Đáp án đúng\)\s*/g, '').trim()
      };
    });
    return {
      id: qNum,
      prompt,
      options: cleanOpts,
      answer: correct
    };
  });

  return {
    id: idx + 1,
    title: titles[idx],
    shortTitle: shortTitles[idx],
    icon: icons[idx],
    contentMarkdown: lessonPart.trim(),
    questions
  };
});

const output = {
  courseTitle: "Kỹ năng Phòng chống Lừa đảo Trực tuyến cho Thanh thiếu niên",
  targetAudience: "Học sinh, sinh viên, thanh thiếu niên (Gen Z)",
  passingScore: 80, // 80% (16/20)
  totalSections: sections.length,
  sections
};

const destPath = path.resolve(root, 'static/anti-scam/course-data.json');
fs.writeFileSync(destPath, JSON.stringify(output, null, 2), 'utf8');
console.log('Successfully generated static/anti-scam/course-data.json with', sections.length, 'sections.');
