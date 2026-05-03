import type { Challenge, Stage } from './types';

const vowel = [
  item('a', 'あ', 'a', '口を大きく「あ」'),
  item('i', 'い', 'i', 'にっこり「い」'),
  item('u', 'う', 'u', 'くちを丸く「う」'),
  item('e', 'え', 'e', 'えがおの「え」'),
  item('o', 'お', 'o', 'おにぎりの「お」'),
];

const basicRows = [
  item('ka', 'か', 'ka', 'k + a'),
  item('ki', 'き', 'ki', 'k + i'),
  item('ku', 'く', 'ku', 'k + u'),
  item('ke', 'け', 'ke', 'k + e'),
  item('ko', 'こ', 'ko', 'k + o'),
  item('sa', 'さ', 'sa', 's + a'),
  item('shi', 'し', 'shi', 's + h + i'),
  item('su', 'す', 'su', 's + u'),
  item('se', 'せ', 'se', 's + e'),
  item('so', 'そ', 'so', 's + o'),
  item('ta', 'た', 'ta', 't + a'),
  item('chi', 'ち', 'chi', 'c + h + i'),
  item('tsu', 'つ', 'tsu', 't + s + u'),
  item('te', 'て', 'te', 't + e'),
  item('to', 'と', 'to', 't + o'),
];

const mixedBasic = [
  item('na', 'な', 'na', 'n + a'),
  item('ni', 'に', 'ni', 'n + i'),
  item('nu', 'ぬ', 'nu', 'n + u'),
  item('ne', 'ね', 'ne', 'n + e'),
  item('no', 'の', 'no', 'n + o'),
  item('ha', 'は', 'ha', 'h + a'),
  item('hi', 'ひ', 'hi', 'h + i'),
  item('fu', 'ふ', 'fu', 'f + u'),
  item('he', 'へ', 'he', 'h + e'),
  item('ho', 'ほ', 'ho', 'h + o'),
  item('ma', 'ま', 'ma', 'm + a'),
  item('mi', 'み', 'mi', 'm + i'),
  item('mu', 'む', 'mu', 'm + u'),
  item('me', 'め', 'me', 'm + e'),
  item('mo', 'も', 'mo', 'm + o'),
  item('ra', 'ら', 'ra', 'r + a'),
  item('ri', 'り', 'ri', 'r + i'),
  item('ru', 'る', 'ru', 'r + u'),
  item('re', 'れ', 're', 'r + e'),
  item('ro', 'ろ', 'ro', 'r + o'),
];

const dakuten = [
  item('ga', 'が', 'ga', 'g + a'),
  item('gi', 'ぎ', 'gi', 'g + i'),
  item('gu', 'ぐ', 'gu', 'g + u'),
  item('ge', 'げ', 'ge', 'g + e'),
  item('go', 'ご', 'go', 'g + o'),
  item('za', 'ざ', 'za', 'z + a'),
  item('ji', 'じ', 'ji', 'j + i'),
  item('zu', 'ず', 'zu', 'z + u'),
  item('de', 'で', 'de', 'd + e'),
  item('do', 'ど', 'do', 'd + o'),
  item('ba', 'ば', 'ba', 'b + a'),
  item('pa', 'ぱ', 'pa', 'p + a'),
  item('pi', 'ぴ', 'pi', 'p + i'),
  item('pu', 'ぷ', 'pu', 'p + u'),
  item('po', 'ぽ', 'po', 'p + o'),
];

const combo = [
  item('kya', 'きゃ', 'kya', 'ki を小さなゃにつなげる'),
  item('kyu', 'きゅ', 'kyu', 'ki を小さなゅにつなげる'),
  item('kyo', 'きょ', 'kyo', 'ki を小さなょにつなげる'),
  item('sha', 'しゃ', 'sha', 'shi + ゃ'),
  item('shu', 'しゅ', 'shu', 'shi + ゅ'),
  item('sho', 'しょ', 'sho', 'shi + ょ'),
  item('cha', 'ちゃ', 'cha', 'chi + ゃ'),
  item('chu', 'ちゅ', 'chu', 'chi + ゅ'),
  item('cho', 'ちょ', 'cho', 'chi + ょ'),
  item('rya', 'りゃ', 'rya', 'ri + ゃ'),
  item('ryu', 'りゅ', 'ryu', 'ri + ゅ'),
  item('ryo', 'りょ', 'ryo', 'ri + ょ'),
];

const words = [
  item('neko', 'ねこ', 'neko', 'ね + こ'),
  item('sora', 'そら', 'sora', 'そ + ら'),
  item('hana', 'はな', 'hana', 'は + な'),
  item('yama', 'やま', 'yama', 'や + ま'),
  item('mizu', 'みず', 'mizu', 'み + ず'),
  item('gakkou', 'がっこう', 'gakkou', '小さい「っ」は次の子音を重ねる'),
  item('kyuushoku', 'きゅうしょく', 'kyuushoku', 'きゅ + う + しょ + く'),
  item('romaji', 'ろーまじ', 'romaji', 'のばす音は言葉ごとに練習'),
];

export const stages: Stage[] = [
  stage('vowels', 'ステージ1: あいうえお', 'Seed', 'まずは母音。1文字ずつリズムよく。', 5, vowel),
  stage('k-row', 'ステージ2: か・さ・た行', 'Sprout', '子音と母音をくっつけて打とう。', 7, basicRows),
  stage('mixed-basic', 'ステージ3: な〜ら行', 'Leaf', 'よく出る基本の音をまぜて練習。', 8, mixedBasic),
  stage('dakuten', 'ステージ4: が・ざ・ば・ぱ', 'Bloom', '点々と丸の音にチャレンジ。', 8, dakuten),
  stage('combo', 'ステージ5: きゃ・しゅ・ちょ', 'Star', '小さい「ゃゅょ」の音をつなげよう。', 8, combo),
  stage('words', 'ステージ6: ことば', 'Rocket', '短いことばを最後まで打ち切ろう。', 8, words),
];

export function getStage(index = 0): Stage {
  const wrapped = Math.max(0, Math.min(stages.length - 1, index));
  return cloneStage(stages[wrapped]);
}

export function cloneStage(stage: Stage): Stage {
  return {
    ...stage,
    challenges: stage.challenges.map((challenge) => ({ ...challenge })),
  };
}

export function getChallenge(stage: Stage, challengeIndex: number): Challenge {
  return stage.challenges[challengeIndex % stage.challenges.length];
}

export function makeChallengeOrder(stage: Stage, seed: number): number[] {
  const order = stage.challenges.map((_, index) => index);
  let value = seed + stage.id.length * 97;
  for (let index = order.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const swapIndex = value % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}

function stage(
  id: Stage['id'],
  name: string,
  badge: string,
  description: string,
  requiredCorrect: number,
  challenges: Challenge[],
): Stage {
  return { id, name, badge, description, requiredCorrect, challenges };
}

function item(id: string, kana: string, romaji: string, hint: string): Challenge {
  return {
    id,
    kana,
    romaji,
    hint,
    group: romaji.length === 1 ? 'vowel' : romaji.length <= 3 ? 'sound' : 'word',
  };
}
