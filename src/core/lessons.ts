import type { BossBlueprint, Challenge, Stage } from './types';

const schoolRomajiRules: ReadonlyArray<readonly [string, string]> = [
  ['sha', 'sya'],
  ['shu', 'syu'],
  ['sho', 'syo'],
  ['cha', 'tya'],
  ['chu', 'tyu'],
  ['cho', 'tyo'],
  ['ja', 'zya'],
  ['ju', 'zyu'],
  ['jo', 'zyo'],
  ['shi', 'si'],
  ['chi', 'ti'],
  ['tsu', 'tu'],
  ['fu', 'hu'],
  ['ji', 'zi'],
];

function toSchoolRomaji(text: string): string {
  return schoolRomajiRules.reduce((value, [from, to]) => value.replaceAll(from, to), text);
}

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
  item('ya', 'や', 'ya', 'y + a'),
  item('yu', 'ゆ', 'yu', 'y + u'),
  item('yo', 'よ', 'yo', 'y + o'),
  item('wa', 'わ', 'wa', 'w + a'),
  item('wo', 'を', 'wo', 'w + o'),
  item('nn', 'ん', 'nn', 'n + n'),
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
  item('ze', 'ぜ', 'ze', 'z + e'),
  item('zo', 'ぞ', 'zo', 'z + o'),
  item('da', 'だ', 'da', 'd + a'),
  item('de', 'で', 'de', 'd + e'),
  item('do', 'ど', 'do', 'd + o'),
  item('ba', 'ば', 'ba', 'b + a'),
  item('bi', 'び', 'bi', 'b + i'),
  item('bu', 'ぶ', 'bu', 'b + u'),
  item('be', 'べ', 'be', 'b + e'),
  item('bo', 'ぼ', 'bo', 'b + o'),
  item('pa', 'ぱ', 'pa', 'p + a'),
  item('pi', 'ぴ', 'pi', 'p + i'),
  item('pu', 'ぷ', 'pu', 'p + u'),
  item('pe', 'ぺ', 'pe', 'p + e'),
  item('po', 'ぽ', 'po', 'p + o'),
];

const combo = [
  item('kya', 'きゃ', 'kya', 'ki + ゃ'),
  item('kyu', 'きゅ', 'kyu', 'ki + ゅ'),
  item('kyo', 'きょ', 'kyo', 'ki + ょ'),
  item('sha', 'しゃ', 'sha', 'shi + ゃ'),
  item('shu', 'しゅ', 'shu', 'shi + ゅ'),
  item('sho', 'しょ', 'sho', 'shi + ょ'),
  item('cha', 'ちゃ', 'cha', 'chi + ゃ'),
  item('chu', 'ちゅ', 'chu', 'chi + ゅ'),
  item('cho', 'ちょ', 'cho', 'chi + ょ'),
  item('nya', 'にゃ', 'nya', 'ni + ゃ'),
  item('nyu', 'にゅ', 'nyu', 'ni + ゅ'),
  item('nyo', 'にょ', 'nyo', 'ni + ょ'),
  item('hya', 'ひゃ', 'hya', 'hi + ゃ'),
  item('hyu', 'ひゅ', 'hyu', 'hi + ゅ'),
  item('hyo', 'ひょ', 'hyo', 'hi + ょ'),
  item('mya', 'みゃ', 'mya', 'mi + ゃ'),
  item('myu', 'みゅ', 'myu', 'mi + ゅ'),
  item('myo', 'みょ', 'myo', 'mi + ょ'),
  item('rya', 'りゃ', 'rya', 'ri + ゃ'),
  item('ryu', 'りゅ', 'ryu', 'ri + ゅ'),
  item('ryo', 'りょ', 'ryo', 'ri + ょ'),
  item('gya', 'ぎゃ', 'gya', 'gi + ゃ'),
  item('gyo', 'ぎょ', 'gyo', 'gi + ょ'),
  item('bya', 'びゃ', 'bya', 'bi + ゃ'),
  item('byo', 'びょ', 'byo', 'bi + ょ'),
];

const words = [
  item('neko', 'ねこ', 'neko', 'ね + こ'),
  item('inu', 'いぬ', 'inu', 'い + ぬ'),
  item('uma', 'うま', 'uma', 'う + ま'),
  item('saru', 'さる', 'saru', 'さ + る'),
  item('kuma', 'くま', 'kuma', 'く + ま'),
  item('tori', 'とり', 'tori', 'と + り'),
  item('kame', 'かめ', 'kame', 'か + め'),
  item('hebi', 'へび', 'hebi', 'へ + び'),
  item('sora', 'そら', 'sora', 'そ + ら'),
  item('hana', 'はな', 'hana', 'は + な'),
  item('yama', 'やま', 'yama', 'や + ま'),
  item('mizu', 'みず', 'mizu', 'み + ず'),
  item('hoshi', 'ほし', 'hoshi', 'ほ + し'),
  item('tsuki', 'つき', 'tsuki', 'つ + き'),
  item('taiyou', 'たいよう', 'taiyou', 'た + い + よ + う'),
  item('kumo', 'くも', 'kumo', 'く + も'),
  item('kaze', 'かぜ', 'kaze', 'か + ぜ'),
  item('yuki', 'ゆき', 'yuki', 'ゆ + き'),
  item('ame', 'あめ', 'ame', 'あ + め'),
  item('niji', 'にじ', 'niji', 'に + じ'),
  item('ringo', 'りんご', 'ringo', 'り + ん + ご'),
  item('banana', 'ばなな', 'banana', 'ば + な + な'),
  item('mikan', 'みかん', 'mikan', 'み + か + ん'),
  item('ichigo', 'いちご', 'ichigo', 'い + ち + ご'),
  item('suika', 'すいか', 'suika', 'す + い + か'),
  item('sakura', 'さくら', 'sakura', 'さ + く + ら'),
  item('densha', 'でんしゃ', 'densha', 'で + ん + しゃ'),
  item('kuruma', 'くるま', 'kuruma', 'く + る + ま'),
  item('gakkou', 'がっこう', 'gakkou', 'が + っ + こ + う'),
  item('tomodachi', 'ともだち', 'tomodachi', 'と + も + だ + ち'),
  item('sensei', 'せんせい', 'sensei', 'せ + ん + せ + い'),
  item('okaasan', 'おかあさん', 'okaasan', 'お + か + あ + さ + ん'),
  item('otousan', 'おとうさん', 'otousan', 'お + と + う + さ + ん'),
  item('panya', 'ぱんや', 'panya', 'ぱ + ん + や'),
  item('kyuushoku', 'きゅうしょく', 'kyuushoku', 'きゅ + う + しょ + く'),
  item('takarabako', 'たからばこ', 'takarabako', 'た + か + ら + ば + こ'),
  item('janken', 'じゃんけん', 'janken', 'じゃ + ん + け + ん'),
  item('natsuyasumi', 'なつやすみ', 'natsuyasumi', 'な + つ + や + す + み'),
  item('undoukai', 'うんどうかい', 'undoukai', 'う + ん + ど + う + か + い'),
  item('hanabi', 'はなび', 'hanabi', 'は + な + び'),
  item('onigiri', 'おにぎり', 'onigiri', 'お + に + ぎ + り'),
  item('takoyaki', 'たこやき', 'takoyaki', 'た + こ + や + き'),
  item('asagao', 'あさがお', 'asagao', 'あ + さ + が + お'),
  item('himawari', 'ひまわり', 'himawari', 'ひ + ま + わ + り'),
  item('boushi', 'ぼうし', 'boushi', 'ぼ + う + し'),
  item('megane', 'めがね', 'megane', 'め + が + ね'),
  item('ongaku', 'おんがく', 'ongaku', 'お + ん + が + く'),
  item('bouken', 'ぼうけん', 'bouken', 'ぼ + う + け + ん'),
  item('otegami', 'おてがみ', 'otegami', 'お + て + が + み'),
  item('tanabata', 'たなばた', 'tanabata', 'た + な + ば + た'),
  item('seiza', 'せいざ', 'seiza', 'せ + い + ざ'),
  item('hoshizora', 'ほしぞら', 'hoshizora', 'ほ + し + ぞ + ら'),
  item('uchuu', 'うちゅう', 'uchuu', 'う + ちゅ + う'),
  item('uchuusen', 'うちゅうせん', 'uchuusen', 'う + ちゅ + う + せ + ん'),
  item('kaizoku', 'かいぞく', 'kaizoku', 'か + い + ぞ + く'),
  item('robotto', 'ろぼっと', 'robotto', 'ろ + ぼ + っ + と'),
  item('hikouki', 'ひこうき', 'hikouki', 'ひ + こ + う + き'),
  item('kyuukyuusha', 'きゅうきゅうしゃ', 'kyuukyuusha', 'きゅ + う + きゅ + う + しゃ'),
  item('shinkansen', 'しんかんせん', 'shinkansen', 'し + ん + か + ん + せ + ん'),
  item('toshokan', 'としょかん', 'toshokan', 'と + しょ + か + ん'),
  item('taiikukan', 'たいいくかん', 'taiikukan', 'た + い + い + く + か + ん'),
  item('norimono', 'のりもの', 'norimono', 'の + り + も + の'),
  item('tabemono', 'たべもの', 'tabemono', 'た + べ + も + の'),
  item('koinobori', 'こいのぼり', 'koinobori', 'こ + い + の + ぼ + り'),
  item('omatsuri', 'おまつり', 'omatsuri', 'お + ま + つ + り'),
  item('takaramono', 'たからもの', 'takaramono', 'た + か + ら + も + の'),
  item('kagamimochi', 'かがみもち', 'kagamimochi', 'か + が + み + も + ち'),
  item('yuuenchi', 'ゆうえんち', 'yuuenchi', 'ゆ + う + え + ん + ち'),
  item('kujiragumo', 'くじらぐも', 'kujiragumo', 'く + じ + ら + ぐ + も'),
  item('sunadokei', 'すなどけい', 'sunadokei', 'す + な + ど + け + い'),
  item('pengin', 'ぺんぎん', 'pengin', 'ぺ + ん + ぎ + ん'),
];

const bosses: BossBlueprint[] = [
  boss('ruin-ogre', '遺跡のオーガ', [
    item('kage', 'かげ', 'kage', '闇の一撃'),
    item('tsurugi', 'つるぎ', 'tsurugi', '剣の一太刀'),
    item('mahou', 'まほう', 'mahou', '魔法の詠唱'),
  ]),
  boss('abyss-wyvern', '深淵ワイバーン', [
    item('yuusha', 'ゆうしゃ', 'yuusha', '勇者の名を刻め'),
    item('seirei', 'せいれい', 'seirei', '精霊の加護を呼ぶ'),
    item('kettou', 'けっとう', 'kettou', '決闘の火花'),
    item('senkou', 'せんこう', 'senkou', '閃光で切り裂け'),
  ]),
  boss('star-eater', '星喰いドラゴン', [
    item('ryuusei', 'りゅうせい', 'ryuusei', '流星をまとえ'),
    item('meikyuu', 'めいきゅう', 'meikyuu', '迷宮を抜けろ'),
    item('tenkuu', 'てんくう', 'tenkuu', '天空へ跳べ'),
    item('shinwa', 'しんわ', 'shinwa', '神話を刻め'),
    item('eiyuu', 'えいゆう', 'eiyuu', '英雄の一撃'),
  ]),
];

export const stages: Stage[] = [
  stage('vowels', 'もじのたね', 'Lv1', '1文字の母音を打とう。', 3, 45000, 0, 0, vowel),
  stage('k-row', 'おとのはっぱ', 'Lv3', '2文字をリズムよく打とう。', 4, 45000, 0, 0, basicRows),
  stage('mixed-basic', 'ことばのつぼみ', 'Lv5', 'いろいろな音をまぜて慣れよう。', 4, 45000, 0, 0, mixedBasic),
  stage('dakuten', 'にぎやかパワー', 'Lv7', '濁る音も落ち着いて入力。', 4, 45000, 0, 0, dakuten),
  stage('combo', 'きらりコンボ', 'Lv9', '小さい「ゃゅょ」をつないで加速。', 5, 45000, 0, 0, combo),
  stage('words', 'ことばラッシュ', 'Lv11', '長い単語を区切って打とう。', 5, 45000, 0, 0, words),
];

export function getStage(index = 0): Stage {
  const wrapped = Math.max(0, Math.min(stages.length - 1, index));
  return cloneStage(stages[wrapped]);
}

export function cloneStage(stage: Stage): Stage {
  return { ...stage, challenges: stage.challenges.map((challenge) => ({ ...challenge })) };
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

export function getBossBlueprint(wave: number): BossBlueprint {
  const tier = Math.max(0, Math.floor(wave / 5) - 1);
  const source = bosses[Math.min(tier, bosses.length - 1)];
  return {
    ...source,
    segments: source.segments.map((segment) => ({ ...segment })),
  };
}

function boss(id: string, name: string, segments: Challenge[]): BossBlueprint {
  return { id, name, segments };
}

function stage(
  id: Stage['id'],
  name: string,
  badge: string,
  description: string,
  requiredCorrect: number,
  timeLimitMs: number,
  clearBonusMs: number,
  mistakePenaltyMs: number,
  challenges: Challenge[],
): Stage {
  return { id, name, badge, description, requiredCorrect, timeLimitMs, clearBonusMs, mistakePenaltyMs, challenges };
}

function item(id: string, kana: string, romaji: string, hint: string): Challenge {
  const schoolRomaji = toSchoolRomaji(romaji);
  return {
    id: /^[a-z]+$/.test(id) ? toSchoolRomaji(id) : id,
    kana,
    romaji: schoolRomaji,
    hint: toSchoolRomaji(hint),
    group: schoolRomaji.length === 1 ? 'vowel' : schoolRomaji.length <= 3 ? 'sound' : 'word',
  };
}
